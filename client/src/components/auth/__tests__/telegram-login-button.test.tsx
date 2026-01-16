/**
 * TelegramLoginButton Component Tests
 *
 * Tests for Telegram Login Widget integration
 * Covers: script loading, callback handling, API calls, redirects
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TelegramLoginButton } from '../telegram-login-button';

// Mock dependencies
const mockSetLocation = vi.fn();
const mockToast = vi.fn();

vi.mock('wouter', () => ({
  useLocation: () => ['/', mockSetLocation],
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('TelegramLoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.onTelegramAuth
    delete (window as any).onTelegramAuth;
    
    // Clear any existing scripts
    document.querySelectorAll('script[src*="telegram-widget"]').forEach(el => el.remove());
  });

  afterEach(() => {
    // Clean up any scripts added to DOM
    document.querySelectorAll('script[src*="telegram-widget"]').forEach(el => el.remove());
  });

  it('should render Telegram widget script', async () => {
    render(<TelegramLoginButton />);

    // Wait for script to be added (useEffect runs after render)
    await waitFor(() => {
      const script = document.querySelector('script[src*="telegram-widget"]');
      expect(script).toBeTruthy();
    });

    const script = document.querySelector('script[src*="telegram-widget"]');
    expect(script?.getAttribute('data-telegram-login')).toBe('BudgetBuddyAIBot');
    expect(script?.getAttribute('data-size')).toBe('large');
    expect(script?.getAttribute('data-onauth')).toBe('onTelegramAuth(user)');
  });

  it('should show help text', () => {
    render(<TelegramLoginButton />);

    expect(screen.getByText('Quick login using Telegram')).toBeTruthy();
  });

  it('should define window.onTelegramAuth callback', () => {
    render(<TelegramLoginButton />);

    expect(window.onTelegramAuth).toBeDefined();
    expect(typeof window.onTelegramAuth).toBe('function');
  });

  it('should call API when Telegram auth callback is triggered', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        user: { id: 1, name: 'Test User' },
        message: 'Logged in successfully',
      }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    render(<TelegramLoginButton />);

    const mockTelegramData = {
      id: 123456789,
      first_name: 'John',
      username: 'johndoe',
      photo_url: 'https://example.com/photo.jpg',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'valid_hash',
    };

    // Trigger callback
    await window.onTelegramAuth!(mockTelegramData);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/telegram',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockTelegramData),
          credentials: 'include',
        })
      );
    });
  });

  it('should show success toast and redirect on successful login', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        user: { id: 1, name: 'Test User' },
        message: 'Logged in successfully via Telegram',
        isNewUser: false,
      }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    render(<TelegramLoginButton />);

    const mockTelegramData = {
      id: 123456789,
      first_name: 'John',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'valid_hash',
    };

    await window.onTelegramAuth!(mockTelegramData);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '👋 Welcome back!',
          description: 'Logged in successfully via Telegram',
        })
      );
    });

    // Wait for redirect timeout
    await waitFor(() => {
      expect(mockSetLocation).toHaveBeenCalledWith('/app/dashboard');
    }, { timeout: 1000 });
  });

  it('should show different toast for new user', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        user: { id: 1, name: 'Test User' },
        message: 'Account created',
        isNewUser: true,
      }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    render(<TelegramLoginButton />);

    const mockTelegramData = {
      id: 123456789,
      first_name: 'John',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'valid_hash',
    };

    await window.onTelegramAuth!(mockTelegramData);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '🎉 Welcome!',
          description: 'Your account has been created via Telegram',
        })
      );
    });
  });

  it('should show error toast on failed login', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({
        error: 'Invalid Telegram authentication data',
      }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    render(<TelegramLoginButton />);

    const mockTelegramData = {
      id: 123456789,
      first_name: 'John',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'invalid_hash',
    };

    await window.onTelegramAuth!(mockTelegramData);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '❌ Login failed',
          description: 'Invalid Telegram authentication data',
          variant: 'destructive',
        })
      );
    });

    // Should NOT redirect on error
    expect(mockSetLocation).not.toHaveBeenCalled();
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<TelegramLoginButton />);

    const mockTelegramData = {
      id: 123456789,
      first_name: 'John',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'valid_hash',
    };

    await window.onTelegramAuth!(mockTelegramData);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '❌ Error',
          description: 'An error occurred during Telegram login',
          variant: 'destructive',
        })
      );
    });
  });

  it('should prevent duplicate auth callback calls', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        user: { id: 1, name: 'Test User' },
      }),
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    render(<TelegramLoginButton />);

    const mockTelegramData = {
      id: 123456789,
      first_name: 'John',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'valid_hash',
    };

    // Call callback twice rapidly
    window.onTelegramAuth!(mockTelegramData);
    window.onTelegramAuth!(mockTelegramData);

    await waitFor(() => {
      // Should only be called once due to isLoadingRef
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('should cleanup callback on unmount', () => {
    const { unmount } = render(<TelegramLoginButton />);

    expect(window.onTelegramAuth).toBeDefined();

    unmount();

    expect(window.onTelegramAuth).toBeUndefined();
  });

  it('should not add script twice if already loaded', async () => {
    const { rerender } = render(<TelegramLoginButton />);

    // Wait for first script to be added
    await waitFor(() => {
      const scriptsCount1 = document.querySelectorAll('script[src*="telegram-widget"]').length;
      expect(scriptsCount1).toBe(1);
    });

    const scriptsCount1 = document.querySelectorAll('script[src*="telegram-widget"]').length;

    rerender(<TelegramLoginButton />);

    // Wait a bit for useEffect to run
    await waitFor(() => {
      const scriptsCount2 = document.querySelectorAll('script[src*="telegram-widget"]').length;
      // Should only add script once (component checks if script already exists)
      expect(scriptsCount2).toBe(1);
    }, { timeout: 500 });
  });
});

describe('TelegramLoginButton - Accessibility', () => {
  it('should have descriptive text for screen readers', () => {
    render(<TelegramLoginButton />);

    expect(screen.getByText('Quick login using Telegram')).toBeTruthy();
  });

  it('should set proper attributes on script tag', () => {
    render(<TelegramLoginButton />);

    const script = document.querySelector('script[src*="telegram-widget"]');

    expect(script?.getAttribute('async')).toBe('');
    expect(script?.getAttribute('data-request-access')).toBe('write');
  });
});
