/**
 * NotificationsList Component Tests
 * 
 * Tests for notification list component with filters
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationsList } from '../notifications-list';
import { Notification } from '@shared/schema';

// Mock fetch
global.fetch = vi.fn();

// Mock useTranslation
vi.mock('@/i18n', () => ({
  useTranslation: () => ({
    language: 'ru',
    t: (key: string) => key,
  }),
}));

const createMockNotification = (overrides?: Partial<Notification>): Notification => ({
  id: 1,
  userId: 1,
  type: 'planned_expense',
  title: 'Запланированный расход',
  message: 'Test message',
  plannedTransactionId: 1,
  plannedIncomeId: null,
  transactionData: {
    amount: '100.00',
    currency: 'USD',
    description: 'Test',
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
  },
  status: 'unread',
  createdAt: new Date().toISOString(),
  readAt: null,
  dismissedAt: null,
  completedAt: null,
  ...overrides,
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('NotificationsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  describe('Rendering', () => {
    it('should render loading state', async () => {
      (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithQueryClient(<NotificationsList />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render empty state when no notifications', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      renderWithQueryClient(<NotificationsList />);

      await waitFor(() => {
        expect(screen.getByText('Нет уведомлений')).toBeInTheDocument();
      });
    });

    it('should render notifications list', async () => {
      const notifications = [
        createMockNotification({ id: 1, title: 'Notification 1' }),
        createMockNotification({ id: 2, title: 'Notification 2' }),
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => notifications,
      });

      renderWithQueryClient(<NotificationsList />);

      await waitFor(() => {
        expect(screen.getByText('Notification 1')).toBeInTheDocument();
        expect(screen.getByText('Notification 2')).toBeInTheDocument();
      });
    });
  });

  describe('Filters', () => {
    it('should render date filter', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      renderWithQueryClient(<NotificationsList />);

      await waitFor(() => {
        const dateInput = screen.getByTitle('Показать до даты');
        expect(dateInput).toBeInTheDocument();
        expect(dateInput).toHaveAttribute('type', 'date');
      });
    });

    it('should render type filter with options', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      renderWithQueryClient(<NotificationsList />);

      await waitFor(() => {
        const filterSelect = screen.getByRole('combobox');
        expect(filterSelect).toBeInTheDocument();
      });

      // Open select
      fireEvent.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByText('Все')).toBeInTheDocument();
        expect(screen.getByText('Пропущенные')).toBeInTheDocument();
        expect(screen.getByText('Сегодня')).toBeInTheDocument();
        expect(screen.getByText('Предстоящие')).toBeInTheDocument();
      });
    });

    it('should filter notifications by date', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const notifications = [
        createMockNotification({
          id: 1,
          transactionData: { ...createMockNotification().transactionData, date: today.toISOString().split('T')[0] },
        }),
        createMockNotification({
          id: 2,
          transactionData: { ...createMockNotification().transactionData, date: tomorrow.toISOString().split('T')[0] },
        }),
        createMockNotification({
          id: 3,
          transactionData: { ...createMockNotification().transactionData, date: nextWeek.toISOString().split('T')[0] },
        }),
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => notifications,
      });

      renderWithQueryClient(<NotificationsList />);

      await waitFor(() => {
        expect(screen.getByText('Notification 1')).toBeInTheDocument();
      });

      // Set end date to tomorrow
      const dateInput = screen.getByTitle('Показать до даты');
      fireEvent.change(dateInput, {
        target: { value: tomorrow.toISOString().split('T')[0] },
      });

      await waitFor(() => {
        expect(screen.getByText('Notification 1')).toBeInTheDocument();
        expect(screen.getByText('Notification 2')).toBeInTheDocument();
        expect(screen.queryByText('Notification 3')).not.toBeInTheDocument();
      });
    });

    it('should filter notifications by type - missed', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const today = new Date();

      const notifications = [
        createMockNotification({
          id: 1,
          status: 'unread',
          transactionData: {
            ...createMockNotification().transactionData,
            date: yesterday.toISOString().split('T')[0],
          },
        }),
        createMockNotification({
          id: 2,
          status: 'unread',
          transactionData: {
            ...createMockNotification().transactionData,
            date: today.toISOString().split('T')[0],
          },
        }),
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => notifications,
      });

      renderWithQueryClient(<NotificationsList />);

      await waitFor(() => {
        expect(screen.getByText('Notification 1')).toBeInTheDocument();
      });

      // Select "missed" filter
      const filterSelect = screen.getByRole('combobox');
      fireEvent.click(filterSelect);

      await waitFor(() => {
        const missedOption = screen.getByText('Пропущенные');
        fireEvent.click(missedOption);
      });

      await waitFor(() => {
        expect(screen.getByText('Notification 1')).toBeInTheDocument();
        expect(screen.queryByText('Notification 2')).not.toBeInTheDocument();
      });
    });

    it('should filter notifications by type - today', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const notifications = [
        createMockNotification({
          id: 1,
          transactionData: {
            ...createMockNotification().transactionData,
            date: today.toISOString().split('T')[0],
          },
        }),
        createMockNotification({
          id: 2,
          transactionData: {
            ...createMockNotification().transactionData,
            date: tomorrow.toISOString().split('T')[0],
          },
        }),
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => notifications,
      });

      renderWithQueryClient(<NotificationsList />);

      await waitFor(() => {
        expect(screen.getByText('Notification 1')).toBeInTheDocument();
      });

      // Select "today" filter
      const filterSelect = screen.getByRole('combobox');
      fireEvent.click(filterSelect);

      await waitFor(() => {
        const todayOption = screen.getByText('Сегодня');
        fireEvent.click(todayOption);
      });

      await waitFor(() => {
        expect(screen.getByText('Notification 1')).toBeInTheDocument();
        expect(screen.queryByText('Notification 2')).not.toBeInTheDocument();
      });
    });

    it('should filter notifications by type - upcoming', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const notifications = [
        createMockNotification({
          id: 1,
          transactionData: {
            ...createMockNotification().transactionData,
            date: yesterday.toISOString().split('T')[0],
          },
        }),
        createMockNotification({
          id: 2,
          transactionData: {
            ...createMockNotification().transactionData,
            date: tomorrow.toISOString().split('T')[0],
          },
        }),
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => notifications,
      });

      renderWithQueryClient(<NotificationsList />);

      await waitFor(() => {
        expect(screen.getByText('Notification 1')).toBeInTheDocument();
      });

      // Select "upcoming" filter
      const filterSelect = screen.getByRole('combobox');
      fireEvent.click(filterSelect);

      await waitFor(() => {
        const upcomingOption = screen.getByText('Предстоящие');
        fireEvent.click(upcomingOption);
      });

      await waitFor(() => {
        expect(screen.queryByText('Notification 1')).not.toBeInTheDocument();
        expect(screen.getByText('Notification 2')).toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    it('should mark notification as read when clicked', async () => {
      const notification = createMockNotification({ status: 'unread' });

      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/notifications') && !url.includes('/read')) {
          return Promise.resolve({
            ok: true,
            json: async () => [notification],
          });
        }
        if (url.includes('/read')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ...notification, status: 'read' }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      renderWithQueryClient(<NotificationsList />);

      await waitFor(() => {
        expect(screen.getByText('Notification 1')).toBeInTheDocument();
      });

      const notificationElement = screen.getByText('Notification 1').closest('div');
      if (notificationElement) {
        fireEvent.click(notificationElement);
      }

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/notifications/1/read'),
          expect.any(Object)
        );
      });
    });

    it('should delete notification', async () => {
      const notification = createMockNotification();

      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/api/notifications') && !url.includes('/delete')) {
          return Promise.resolve({
            ok: true,
            json: async () => [notification],
          });
        }
        if (url.includes('/delete')) {
          return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      renderWithQueryClient(<NotificationsList />);

      await waitFor(() => {
        expect(screen.getByText('Notification 1')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Удалить');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/notifications/1'),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });
  });
});
