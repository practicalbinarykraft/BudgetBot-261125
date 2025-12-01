import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BudgetBot API',
      version: '2.16.0',
      description: 'Comprehensive API documentation for BudgetBot - Personal Finance Management System',
      contact: {
        name: 'BudgetBot Team',
        url: 'https://github.com/yourusername/budgetbot',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.budgetbot.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session-based authentication using cookies',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Transaction ID',
            },
            userId: {
              type: 'integer',
              description: 'User ID',
            },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              description: 'Transaction type',
            },
            amount: {
              type: 'string',
              description: 'Transaction amount',
            },
            amountUsd: {
              type: 'string',
              nullable: true,
              description: 'Amount in USD',
            },
            description: {
              type: 'string',
              description: 'Transaction description',
            },
            category: {
              type: 'string',
              nullable: true,
              description: 'Category name (deprecated)',
            },
            categoryId: {
              type: 'integer',
              nullable: true,
              description: 'Category ID',
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Transaction date',
            },
            currency: {
              type: 'string',
              default: 'USD',
              description: 'Transaction currency',
            },
            walletId: {
              type: 'integer',
              nullable: true,
              description: 'Wallet ID',
            },
            personalTagId: {
              type: 'integer',
              nullable: true,
              description: 'Personal tag ID',
            },
            financialType: {
              type: 'string',
              enum: ['essential', 'discretionary', 'investment', 'debt'],
              nullable: true,
              description: 'Financial type classification',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
        },
        Wallet: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Wallet ID',
            },
            userId: {
              type: 'integer',
              description: 'User ID',
            },
            name: {
              type: 'string',
              description: 'Wallet name',
            },
            balance: {
              type: 'string',
              description: 'Current balance',
            },
            currency: {
              type: 'string',
              default: 'USD',
              description: 'Wallet currency',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
        },
        Budget: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Budget ID',
            },
            userId: {
              type: 'integer',
              description: 'User ID',
            },
            categoryId: {
              type: 'integer',
              description: 'Category ID',
            },
            period: {
              type: 'string',
              enum: ['monthly', 'yearly'],
              description: 'Budget period',
            },
            limitAmount: {
              type: 'string',
              description: 'Budget limit',
            },
            currentAmount: {
              type: 'string',
              description: 'Current spending',
            },
            alertThreshold: {
              type: 'number',
              description: 'Alert threshold percentage (0-100)',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Category ID',
            },
            userId: {
              type: 'integer',
              nullable: true,
              description: 'User ID (null for system categories)',
            },
            name: {
              type: 'string',
              description: 'Category name',
            },
            icon: {
              type: 'string',
              nullable: true,
              description: 'Category icon',
            },
            color: {
              type: 'string',
              nullable: true,
              description: 'Category color',
            },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              description: 'Category type',
            },
            isSystem: {
              type: 'boolean',
              description: 'Is system category',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints',
      },
      {
        name: 'Transactions',
        description: 'Transaction management endpoints',
      },
      {
        name: 'Wallets',
        description: 'Wallet management endpoints',
      },
      {
        name: 'Budgets',
        description: 'Budget management endpoints',
      },
      {
        name: 'Categories',
        description: 'Category management endpoints',
      },
      {
        name: 'Health',
        description: 'Service health check endpoints',
      },
    ],
  },
  apis: ['./server/routes/*.ts'], // Path to API routes with JSDoc comments
};

export const swaggerSpec = swaggerJsdoc(options);
