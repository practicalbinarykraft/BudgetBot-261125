/**
 * Cohort Retention Heatmap Component Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для компонента heatmap удержания когорт
 * 
 * Запуск:
 *   npm test client/src/components/admin/dashboard/__tests__/cohort-retention-heatmap.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CohortRetentionHeatmap } from '../cohort-retention-heatmap';
import { adminApi } from '@/lib/admin/api/admin-api';

vi.mock('@/lib/admin/api/admin-api', () => ({
  adminApi: {
    getCohortRetention: vi.fn(),
  },
}));

vi.mock('@/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('CohortRetentionHeatmap', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should render heatmap title', () => {
    (adminApi.getCohortRetention as any).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <CohortRetentionHeatmap />
      </QueryClientProvider>
    );

    expect(screen.getByText('admin.dashboard.cohort_retention')).toBeInTheDocument();
  });

  it('should render with provided cohorts prop', () => {
    const mockCohorts = [
      {
        cohortMonth: '2025-01',
        usersCount: 100,
        retention: { month0: 100, month1: 80, month2: 70, month3: 60, month6: 50, month12: 40 },
      },
    ];

    render(
      <QueryClientProvider client={queryClient}>
        <CohortRetentionHeatmap cohorts={mockCohorts} />
      </QueryClientProvider>
    );

    expect(screen.getByText('admin.dashboard.cohort_retention')).toBeInTheDocument();
  });
});
