/**
 * Admin Sidebar Component Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для компонента боковой панели админ-панели
 * 
 * Запуск:
 *   npm test client/src/components/admin/layout/__tests__/admin-sidebar.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminSidebar } from '../admin-sidebar';

vi.mock('@/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('AdminSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/admin/dashboard' },
      writable: true,
    });
  });

  it('should render sidebar with title', () => {
    render(<AdminSidebar />);
    expect(screen.getByText('admin.layout.title')).toBeInTheDocument();
  });

  it('should render navigation items', () => {
    render(<AdminSidebar />);
    expect(screen.getByText('admin.nav.dashboard')).toBeInTheDocument();
    expect(screen.getByText('admin.nav.users')).toBeInTheDocument();
    expect(screen.getByText('admin.nav.analytics')).toBeInTheDocument();
  });

  it('should render version', () => {
    render(<AdminSidebar />);
    expect(screen.getByText('admin.layout.version')).toBeInTheDocument();
  });
});
