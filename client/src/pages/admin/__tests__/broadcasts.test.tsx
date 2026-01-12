/**
 * Admin Broadcasts Page Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для страницы рассылок
 * 
 * Запуск:
 *   npm test client/src/pages/admin/__tests__/broadcasts.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminBroadcastsPage from '../broadcasts/index';
import { adminApi } from '@/lib/admin/api/admin-api';

vi.mock('@/lib/admin/api/admin-api', () => ({
  adminApi: {
    getBroadcasts: vi.fn(),
    getBroadcastTemplates: vi.fn(),
    sendBroadcast: vi.fn(),
  },
}));

vi.mock('@/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('AdminBroadcastsPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    (adminApi.getBroadcasts as any).mockResolvedValue([]);
    (adminApi.getBroadcastTemplates as any).mockResolvedValue([]);
  });

  it('should render page title', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminBroadcastsPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('admin.broadcasts.title')).toBeInTheDocument();
  });

  it('should render tabs', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminBroadcastsPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('admin.broadcasts.tabs.compose')).toBeInTheDocument();
    expect(screen.getByText('admin.broadcasts.tabs.templates')).toBeInTheDocument();
    expect(screen.getByText('admin.broadcasts.tabs.history')).toBeInTheDocument();
  });
});
