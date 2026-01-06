/**
 * TelegramAccountSettings Component Tests
 *
 * Tests for Telegram account management in settings
 * Covers: link/unlink functionality, UI states, validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TelegramAccountSettings } from '../telegram-account-settings';

// Mock dependencies
const mockToast = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock window.confirm
global.confirm = vi.fn(() => true);

// Helper to render with QueryClient
function renderWithClient(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  queryClient.invalidateQueries = mockInvalidateQueries as any;

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}

describe('TelegramAccountSettings - Not Linked State', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock user data: NOT linked
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        telegramId: null,
        telegramUsername: null,
      }),
    });
  });

  it('should show "not linked" state', async () => {
    renderWithClient(<TelegramAccountSettings />);

    await waitFor(() => {
      expect(screen.getByText(/No Telegram account linked/i)).toBeTruthy();
    });
  });

  it('should show link benefits', async () => {
    renderWithClient(<TelegramAccountSettings />);

    await waitFor(() => {
      expect(screen.getByText(/One-click login/i)).toBeTruthy();
      expect(screen.getByText(/Telegram bot integration/i)).toBeTruthy();
      expect(screen.getByText(/Data synchronization/i)).toBeTruthy();
    });
  });

  it('should render Telegram widget script for linking', async () => {
    renderWithClient(<TelegramAccountSettings />);

    await waitFor(() => {
      const script = document.querySelector('script[src*="telegram-widget"]');
      expect(script).toBeTruthy();
      expect(script?.getAttribute('data-telegram-login')).toBe('BudgetBuddyAIBot');
      expect(script?.getAttribute('data-onauth')).toBe('onTelegramLinkAuth(user)');
    });
  });

  it('should call link API when Telegram callback is triggered', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: 'test@example.com',
        telegramId: null,
      }),
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Telegram account linked successfully',
      }),
    });

    renderWithClient(<TelegramAccountSettings />);

    await waitFor(() => {
      expect(window.onTelegramLinkAuth).toBeDefined();
    });

    const mockTelegramData = {
      id: 123456789,
      first_name: 'John',
      username: 'johndoe',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'valid_hash',
    };

    await window.onTelegramLinkAuth!(mockTelegramData);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/link-telegram',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockTelegramData),
          credentials: 'include',
        })
      );
    });
  });

  it('should show success toast and refresh data on successful link', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: 'test@example.com',
        telegramId: null,
      }),
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
      }),
    });

    renderWithClient(<TelegramAccountSettings />);

    await waitFor(() => {
      expect(window.onTelegramLinkAuth).toBeDefined();
    });

    const mockTelegramData = {
      id: 123456789,
      first_name: 'John',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'valid_hash',
    };

    await window.onTelegramLinkAuth!(mockTelegramData);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: '✅ Telegram linked!',
        description: 'Your Telegram account has been successfully linked',
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['/api/user'],
      });
    });
  });

  it('should show error toast on link failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: 'test@example.com',
        telegramId: null,
      }),
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'This Telegram account is already linked to another user',
      }),
    });

    renderWithClient(<TelegramAccountSettings />);

    await waitFor(() => {
      expect(window.onTelegramLinkAuth).toBeDefined();
    });

    const mockTelegramData = {
      id: 123456789,
      first_name: 'John',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'valid_hash',
    };

    await window.onTelegramLinkAuth!(mockTelegramData);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: '❌ Failed to link Telegram',
        description: 'This Telegram account is already linked to another user',
        variant: 'destructive',
      });
    });
  });
});

describe('TelegramAccountSettings - Linked State', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock user data: LINKED
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        telegramId: '123456789',
        telegramUsername: 'johndoe',
      }),
    });
  });

  it('should show "connected" state', async () => {
    renderWithClient(<TelegramAccountSettings />);

    await waitFor(() => {
      expect(screen.getByText(/✓ Connected/i)).toBeTruthy();
    });
  });

  it('should display Telegram username', async () => {
    renderWithClient(<TelegramAccountSettings />);

    await waitFor(() => {
      expect(screen.getByText(/@johndoe/i)).toBeTruthy();
    });
  });

  it('should show benefits list', async () => {
    renderWithClient(<TelegramAccountSettings />);

    await waitFor(() => {
      expect(screen.getByText(/Quick login without password/i)).toBeTruthy();
      expect(screen.getByText(/Seamless integration with Telegram bot/i)).toBeTruthy();
      expect(screen.getByText(/Sync data between web and bot/i)).toBeTruthy();
    });
  });

  it('should have unlink button', async () => {
    renderWithClient(<TelegramAccountSettings />);

    await waitFor(() => {
      expect(screen.getByText(/Unlink/i)).toBeTruthy();
    });
  });

  it('should call unlink API when unlink button is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: 'test@example.com',
        telegramId: '123456789',
        telegramUsername: 'johndoe',
      }),
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
      }),
    });

    renderWithClient(<TelegramAccountSettings />);

    await waitFor(() => {
      const unlinkButton = screen.getByText(/Unlink/i);
      expect(unlinkButton).toBeTruthy();
    });

    const unlinkButton = screen.getByText(/Unlink/i);
    fireEvent.click(unlinkButton);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to unlink your Telegram account?'
      );

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/unlink-telegram',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });
  });

  it('should show success toast and refresh data on successful unlink', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: 'test@example.com',
        telegramId: '123456789',
      }),
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
      }),
    });

    renderWithClient(<TelegramAccountSettings />);

    const unlinkButton = await screen.findByText(/Unlink/i);
    fireEvent.click(unlinkButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: '✅ Telegram unlinked',
        description: 'Your Telegram account has been unlinked',
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['/api/user'],
      });
    });
  });

  it('should not call API if user cancels confirm dialog', async () => {
    (global.confirm as any).mockReturnValueOnce(false);

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: 'test@example.com',
        telegramId: '123456789',
      }),
    });

    renderWithClient(<TelegramAccountSettings />);

    const unlinkButton = await screen.findByText(/Unlink/i);
    fireEvent.click(unlinkButton);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
    });

    // Should NOT call unlink API
    expect(global.fetch).toHaveBeenCalledTimes(1); // Only initial user fetch
  });
});

describe('TelegramAccountSettings - Edge Cases', () => {
  it('should show warning if user tries to unlink without email', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: null, // NO EMAIL!
        name: 'Test User',
        telegramId: '123456789',
        telegramUsername: 'johndoe',
      }),
    });

    renderWithClient(<TelegramAccountSettings />);

    await waitFor(() => {
      expect(screen.getByText(/⚠️ You cannot unlink Telegram without adding email and password first/i)).toBeTruthy();
    });

    const unlinkButton = await screen.findByText(/Unlink/i);
    expect(unlinkButton.hasAttribute('disabled')).toBe(true);
  });

  it('should show toast if trying to unlink without email', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: null,
        telegramId: '123456789',
      }),
    });

    renderWithClient(<TelegramAccountSettings />);

    const unlinkButton = await screen.findByText(/Unlink/i);

    // Try to click (should be disabled, but test handler logic)
    fireEvent.click(unlinkButton);

    // Should not proceed
    expect(global.confirm).not.toHaveBeenCalled();
  });

  it('should handle user without username (username is optional)', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        email: 'test@example.com',
        telegramId: '123456789',
        telegramUsername: null, // NO USERNAME
      }),
    });

    renderWithClient(<TelegramAccountSettings />);

    await waitFor(() => {
      expect(screen.getByText(/✓ Connected/i)).toBeTruthy();
    });

    // Username should not be displayed
    expect(screen.queryByText(/@/)).toBeNull();
  });
});
