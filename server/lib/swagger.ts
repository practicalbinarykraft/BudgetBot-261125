/**
 * Swagger/OpenAPI Configuration
 *
 * Provides API documentation with Swagger UI.
 * Junior-Friendly: ~80 lines, clear configuration
 *
 * Access docs at: /api/docs
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

/**
 * OpenAPI specification options
 */
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BudgetBot API',
      version: '1.0.0',
      description: `
Personal finance management API with AI-powered insights.

## Features
- 💰 **Wallets** - Manage multiple currency wallets
- 📊 **Transactions** - Track income and expenses
- 🏷️ **Categories** - Organize spending by category
- 📈 **Budgets** - Set and monitor spending limits
- 🤖 **AI Insights** - Get smart financial recommendations
- 🔔 **Notifications** - Budget alerts via Telegram

## Authentication
Most endpoints require authentication via session cookie.
Use \`POST /api/auth/login\` to authenticate.
      `,
      contact: {
        name: 'BudgetBot Support',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Wallets', description: 'Wallet operations' },
      { name: 'Transactions', description: 'Transaction management' },
      { name: 'Categories', description: 'Category management' },
      { name: 'Budgets', description: 'Budget tracking' },
      { name: 'AI', description: 'AI-powered features' },
      { name: 'Health', description: 'Health check endpoints' },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie for authentication',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' },
            code: { type: 'string', description: 'Error code' },
            requestId: { type: 'string', description: 'Request ID for support' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ sessionAuth: [] }],
  },
  apis: [
    './server/routes/*.ts',
    './server/docs/*.yaml',
  ],
};

/**
 * Generate OpenAPI specification
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Setup Swagger UI middleware
 */
export function setupSwagger(app: Express): void {
  // Serve Swagger UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'BudgetBot API Docs',
    })
  );

  // Serve raw OpenAPI spec as JSON
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
