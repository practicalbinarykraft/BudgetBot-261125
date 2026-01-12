/**
 * Admin Login Page Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для страницы входа админа
 * 
 * Запуск:
 *   npm test client/src/pages/admin/__tests__/login.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminLoginPage from '../auth/login';

vi.mock('wouter', () => ({
  useLocation: () => ['', vi.fn()],
}));

vi.mock('@/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    render(<AdminLoginPage />);

    expect(screen.getByText('admin.auth.login.title')).toBeInTheDocument();
    expect(screen.getByLabelText('admin.auth.login.email')).toBeInTheDocument();
    expect(screen.getByLabelText('admin.auth.login.password')).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(<AdminLoginPage />);

    expect(screen.getByRole('button', { name: /admin.auth.login.submit/i })).toBeInTheDocument();
  });
});
