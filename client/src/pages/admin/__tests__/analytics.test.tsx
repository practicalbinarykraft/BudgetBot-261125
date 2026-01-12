/**
 * Admin Analytics Page Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для страницы аналитики
 * 
 * Запуск:
 *   npm test client/src/pages/admin/__tests__/analytics.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminAnalyticsPage from '../analytics/index';

vi.mock('@/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('AdminAnalyticsPage', () => {
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
    render(
      <QueryClientProvider client={queryClient}>
        <AdminAnalyticsPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('admin.analytics.title')).toBeInTheDocument();
  });

  it('should render analytics components', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminAnalyticsPage />
      </QueryClientProvider>
    );

    // Page should render without errors
    expect(screen.getByText('admin.analytics.description')).toBeInTheDocument();
  });
});
