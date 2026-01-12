/**
 * Admin Support Page Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для страницы поддержки
 * 
 * Запуск:
 *   npm test client/src/pages/admin/__tests__/support.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminSupportPage from '../support/index';
import { adminApi } from '@/lib/admin/api/admin-api';

vi.mock('@/lib/admin/api/admin-api', () => ({
  adminApi: {
    getSupportChats: vi.fn(),
    getChatMessages: vi.fn(),
    sendSupportMessage: vi.fn(),
    updateSupportChat: vi.fn(),
    markChatAsRead: vi.fn(),
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

describe('AdminSupportPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    (adminApi.getSupportChats as any).mockResolvedValue([]);
  });

  it('should render support interface', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminSupportPage />
      </QueryClientProvider>
    );

    expect(screen.getByPlaceholderText('admin.support.search_chats')).toBeInTheDocument();
  });
});
