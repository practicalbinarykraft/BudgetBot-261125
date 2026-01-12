/**
 * Admin Audit Log Page Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для страницы журнала аудита
 * 
 * Запуск:
 *   npm test client/src/pages/admin/__tests__/audit-log.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminAuditLogPage from '../audit-log/index';
import { adminApi } from '@/lib/admin/api/admin-api';

vi.mock('@/lib/admin/api/admin-api', () => ({
  adminApi: {
    getAuditLogs: vi.fn(),
  },
}));

vi.mock('@/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('AdminAuditLogPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    (adminApi.getAuditLogs as any).mockResolvedValue({
      logs: [],
      total: 0,
    });
  });

  it('should render page title', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminAuditLogPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('admin.audit_log.title')).toBeInTheDocument();
  });
});
