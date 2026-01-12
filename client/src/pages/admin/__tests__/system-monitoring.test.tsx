/**
 * Admin System Monitoring Page Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для страницы мониторинга системы
 * 
 * Запуск:
 *   npm test client/src/pages/admin/__tests__/system-monitoring.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminSystemMonitoringPage from '../system/monitoring';
import { adminApi } from '@/lib/admin/api/admin-api';

vi.mock('@/lib/admin/api/admin-api', () => ({
  adminApi: {
    getSystemHealth: vi.fn(),
  },
}));

vi.mock('@/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('AdminSystemMonitoringPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should render page title', () => {
    (adminApi.getSystemHealth as any).mockResolvedValue({
      api: { uptime: 86400, uptimePercent: 99.9 },
      database: { connections: 10 },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminSystemMonitoringPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('admin.system.title')).toBeInTheDocument();
  });

  it('should render system health data', async () => {
    (adminApi.getSystemHealth as any).mockResolvedValue({
      api: {
        uptime: 86400,
        uptimePercent: 99.9,
        avgResponseTime: 120,
        errorRate: 0.1,
        requests24h: 45000,
      },
      database: {
        connections: 10,
        maxConnections: 100,
        slowQueries: 2,
        size: 2.5,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminSystemMonitoringPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('99.9')).toBeInTheDocument();
    });
  });
});
