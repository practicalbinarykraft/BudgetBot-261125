# ===== BudgetBot Production Dockerfile =====
# Multi-stage build for optimal image size
# Builds both client and server in a single container

# ===== Stage 1: Base =====
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat

# ===== Stage 2: Dependencies =====
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./
COPY client/package.json client/package-lock.json* ./client/

# Install dependencies
RUN npm ci --only=production --legacy-peer-deps && \
    cd client && npm ci --only=production --legacy-peer-deps

# ===== Stage 3: Builder =====
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules

# Copy source code
COPY . .

# Build client (Vite)
WORKDIR /app/client
RUN npm run build

# Build server (TypeScript)
WORKDIR /app
RUN npm run build

# ===== Stage 4: Runner (Production) =====
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 budgetbot

# Set environment to production
ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder --chown=budgetbot:nodejs /app/dist ./dist
COPY --from=builder --chown=budgetbot:nodejs /app/client/dist ./client/dist

# Copy database files (if needed for migrations)
COPY --from=builder --chown=budgetbot:nodejs /app/db ./db

# Switch to non-root user
USER budgetbot

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start the application
CMD ["node", "dist/index.js"]
