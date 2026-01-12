/**
 * Admin Query Client Provider
 * 
 * Junior-Friendly Guide:
 * =====================
 * Отдельный QueryClientProvider для админ-панели.
 * Использует adminQueryClient вместо обычного queryClient.
 * 
 * Использование:
 *   import { AdminQueryClientProvider } from '@/components/admin/AdminQueryClientProvider';
 *   <AdminQueryClientProvider>
 *     <AdminRoutes />
 *   </AdminQueryClientProvider>
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { adminQueryClient } from '@/lib/admin/api/admin-query-client';

interface AdminQueryClientProviderProps {
  children: React.ReactNode;
}

export function AdminQueryClientProvider({ children }: AdminQueryClientProviderProps) {
  return (
    <QueryClientProvider client={adminQueryClient}>
      {children}
    </QueryClientProvider>
  );
}
