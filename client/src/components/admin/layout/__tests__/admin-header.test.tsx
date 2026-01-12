/**
 * Admin Header Component Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для компонента заголовка админ-панели
 * 
 * Запуск:
 *   npm test client/src/components/admin/layout/__tests__/admin-header.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminHeader } from '../admin-header';

vi.mock('@/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('AdminHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header with title', () => {
    render(<AdminHeader />);
    expect(screen.getByText('admin.layout.title')).toBeInTheDocument();
  });

  it('should render logout button', () => {
    render(<AdminHeader />);
    expect(screen.getByText('admin.layout.logout')).toBeInTheDocument();
  });
});
