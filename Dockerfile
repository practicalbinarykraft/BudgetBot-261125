# ===== BudgetBot Production Dockerfile =====
# Multi-stage build for optimal image size
# Monorepo: client builds from root with Vite

# ===== Stage 1: Base =====
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat

# ===== Stage 2: Dependencies =====
FROM base AS deps

# Copy package files (monorepo - all deps in root)
COPY package.json package-lock.json* ./

# Install ALL dependencies (need devDependencies for build)
RUN npm install --legacy-peer-deps

# ===== Stage 3: Builder =====
FROM base AS builder

# Increase Node memory for build (Render free tier has limited RAM)
ENV NODE_OPTIONS="--max-old-space-size=512"

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build everything (vite build && esbuild server)
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
RUN npm install --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder --chown=budgetbot:nodejs /app/dist ./dist

# Copy database files (needed for drizzle schema)
COPY --from=builder --chown=budgetbot:nodejs /app/db ./db

# Switch to non-root user
USER budgetbot

# Expose port (Render uses PORT env var, default 10000)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:' + (process.env.PORT || 10000) + '/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Start the application
CMD ["node", "dist/index.js"]
