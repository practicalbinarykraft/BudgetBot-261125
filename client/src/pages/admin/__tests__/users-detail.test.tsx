/**
 * Admin User Detail Page Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для страницы деталей пользователя
 * 
 * Запуск:
 *   npm test client/src/pages/admin/__tests__/users-detail.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import AdminUserDetailPage from '../users/[id]';
import { adminApi } from '@/lib/admin/api/admin-api';

vi.mock('@/lib/admin/api/admin-api', () => ({
  adminApi: {
    getUserDetail: vi.fn(),
  },
}));

vi.mock('@/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('wouter', () => ({
  useRoute: (pattern: string) => {
    const match = pattern === '/admin/users/:id';
    return [match, { id: '1' }];
  },
  Redirect: ({ to }: { to: string }) => <div>Redirect to {to}</div>,
}));

describe('AdminUserDetailPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should render user details when loaded', async () => {
    (adminApi.getUserDetail as any).mockResolvedValue({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminUserDetailPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    (adminApi.getUserDetail as any).mockImplementation(() => new Promise(() => {}));

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminUserDetailPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const skeletons = document.querySelectorAll('[class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
