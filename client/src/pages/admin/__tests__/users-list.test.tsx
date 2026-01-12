/**
 * Admin Users List Page Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для страницы списка пользователей
 * 
 * Запуск:
 *   npm test client/src/pages/admin/__tests__/users-list.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminUsersListPage from '../users/list';
import { adminApi } from '@/lib/admin/api/admin-api';

vi.mock('@/lib/admin/api/admin-api', () => ({
  adminApi: {
    getUsers: vi.fn(),
  },
}));

vi.mock('@/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('AdminUsersListPage', () => {
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
    (adminApi.getUsers as any).mockResolvedValue({
      users: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminUsersListPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('admin.users.title')).toBeInTheDocument();
  });

  it('should render users table when data loaded', async () => {
    (adminApi.getUsers as any).mockResolvedValue({
      users: [
        {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          status: 'active',
          plan: 'pro',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminUsersListPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    (adminApi.getUsers as any).mockImplementation(() => new Promise(() => {}));

    render(
      <QueryClientProvider client={queryClient}>
        <AdminUsersListPage />
      </QueryClientProvider>
    );

    // Should show loading skeletons
    const skeletons = document.querySelectorAll('[class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
