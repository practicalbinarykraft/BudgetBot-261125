/**
 * Feature Adoption Chart Component Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для компонента графика принятия функций
 * 
 * Запуск:
 *   npm test client/src/components/admin/analytics/__tests__/feature-adoption-chart.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeatureAdoptionChart } from '../feature-adoption-chart';
import { adminApi } from '@/lib/admin/api/admin-api';

vi.mock('@/lib/admin/api/admin-api', () => ({
  adminApi: {
    getFeatureAdoption: vi.fn(),
  },
}));

vi.mock('@/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('FeatureAdoptionChart', () => {
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
    (adminApi.getFeatureAdoption as any).mockResolvedValue({
      features: [],
      totalUsers: 0,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <FeatureAdoptionChart />
      </QueryClientProvider>
    );

    expect(screen.getByText('admin.analytics.feature_adoption.title')).toBeInTheDocument();
  });
});
