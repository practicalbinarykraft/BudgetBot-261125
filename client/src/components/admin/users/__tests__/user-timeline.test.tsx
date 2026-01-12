/**
 * User Timeline Component Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для компонента временной линии пользователя
 * 
 * Запуск:
 *   npm test client/src/components/admin/users/__tests__/user-timeline.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserTimeline } from '../user-timeline';

vi.mock('@/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      if (params) {
        let result = key;
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{${k}}`, String(v));
        });
        return result;
      }
      return key;
    },
  }),
}));

describe('UserTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render timeline title', () => {
    render(<UserTimeline userId={1} />);
    expect(screen.getByText('admin.user_timeline.title')).toBeInTheDocument();
  });

  it('should render timeline description', () => {
    render(<UserTimeline userId={1} />);
    expect(screen.getByText('admin.user_timeline.description')).toBeInTheDocument();
  });

  it('should render timeline events', () => {
    render(<UserTimeline userId={1} />);
    // Should render events from generateMockTimeline
    expect(screen.getByText(/admin.user_timeline.event/)).toBeInTheDocument();
  });
});
