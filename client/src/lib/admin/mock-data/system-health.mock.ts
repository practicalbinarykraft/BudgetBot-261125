/**
 * Mock System Health Data
 *
 * Realistic mock data for system monitoring
 * Junior-Friendly: Simple structure
 */

export interface MockSystemHealth {
  api: {
    uptime: number; // %
    avgResponseTime: number; // ms
    errorRate: number; // %
    requests24h: number;
    endpoints: {
      path: string;
      requests: number;
      avgTime: number;
      p95Time: number;
      errorRate: number;
    }[];
  };
  database: {
    connections: number;
    maxConnections: number;
    slowQueries: number;
    size: number; // GB
    tables: {
      name: string;
      rows: number;
      size: number; // MB
    }[];
  };
  external: {
    telegram: { status: 'healthy' | 'degraded' | 'down'; latency: number };
    openai: { status: 'healthy' | 'degraded' | 'down'; latency: number };
    stripe: { status: 'healthy' | 'degraded' | 'down'; latency: number };
    s3: { status: 'healthy' | 'degraded' | 'down'; latency: number };
  };
  jobs: {
    currencyUpdate: { lastRun: Date; status: 'success' | 'failed' };
    dailyNotifications: { lastRun: Date; status: 'success' | 'failed'; sent: number };
    sessionCleanup: { lastRun: Date; status: 'success' | 'failed'; deleted: number };
  };
}

export const mockSystemHealth: MockSystemHealth = {
  api: {
    uptime: 99.95,
    avgResponseTime: 145,
    errorRate: 0.12,
    requests24h: 125430,
    endpoints: [
      { path: '/api/transactions', requests: 45230, avgTime: 120, p95Time: 280, errorRate: 0.05 },
      { path: '/api/ai/chat', requests: 12340, avgTime: 850, p95Time: 2100, errorRate: 0.8 },
      { path: '/api/users', requests: 8900, avgTime: 95, p95Time: 200, errorRate: 0.02 },
      { path: '/api/wallets', requests: 15600, avgTime: 110, p95Time: 250, errorRate: 0.03 },
    ],
  },
  database: {
    connections: 12,
    maxConnections: 100,
    slowQueries: 3,
    size: 2.45,
    tables: [
      { name: 'transactions', rows: 125000, size: 45.2 },
      { name: 'users', rows: 1250, size: 0.8 },
      { name: 'wallets', rows: 2100, size: 0.3 },
      { name: 'categories', rows: 8900, size: 0.5 },
    ],
  },
  external: {
    telegram: { status: 'healthy', latency: 45 },
    openai: { status: 'healthy', latency: 850 },
    stripe: { status: 'healthy', latency: 120 },
    s3: { status: 'healthy', latency: 65 },
  },
  jobs: {
    currencyUpdate: {
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'success',
    },
    dailyNotifications: {
      lastRun: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      status: 'success',
      sent: 342,
    },
    sessionCleanup: {
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: 'success',
      deleted: 156,
    },
  },
};

