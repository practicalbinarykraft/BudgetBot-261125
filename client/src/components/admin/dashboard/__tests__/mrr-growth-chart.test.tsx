/**
 * MRR Growth Chart Component Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для компонента графика роста MRR
 * 
 * Запуск:
 *   npm test client/src/components/admin/dashboard/__tests__/mrr-growth-chart.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MRRGrowthChart } from '../mrr-growth-chart';
import { adminApi } from '@/lib/admin/api/admin-api';

vi.mock('@/lib/admin/api/admin-api', () => ({
  adminApi: {
    getRevenueMetrics: vi.fn(),
  },
}));

vi.mock('@/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('MRRGrowthChart', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should render chart title', () => {
    (adminApi.getRevenueMetrics as any).mockResolvedValue({
      mrr: { total: 1000 },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MRRGrowthChart />
      </QueryClientProvider>
    );

    expect(screen.getByText('admin.dashboard.mrr_growth')).toBeInTheDocument();
  });
});
