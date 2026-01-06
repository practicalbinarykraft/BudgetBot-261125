/**
 * useTelegramMiniApp Hook Tests
 *
 * Tests for Telegram Mini App detection hook
 * Junior-Friendly: ~100 lines, clear test cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTelegramMiniApp } from '../use-telegram-miniapp';

// Mock window.Telegram
const mockTelegramWebApp = {
  ready: vi.fn(),
  expand: vi.fn(),
  initData: 'test_init_data_string',
  initDataUnsafe: {
    user: {
      id: 123456789,
      first_name: 'Test User',
      username: 'testuser',
      photo_url: 'https://example.com/photo.jpg',
    },
  },
};

describe('useTelegramMiniApp', () => {
  beforeEach(() => {
    // Reset window.Telegram
    delete (window as any).Telegram;
    vi.clearAllMocks();
  });

  it('should detect Mini App when Telegram WebApp is available', async () => {
    // Arrange: Mock Telegram WebApp
    (window as any).Telegram = {
      WebApp: mockTelegramWebApp,
    };

    // Act
    const { result } = renderHook(() => useTelegramMiniApp());

    // Assert
    await waitFor(() => {
      expect(result.current.isMiniApp).toBe(true);
      expect(result.current.initData).toBe('test_init_data_string');
      expect(result.current.telegramUser).toEqual({
        id: 123456789,
        first_name: 'Test User',
        username: 'testuser',
        photo_url: 'https://example.com/photo.jpg',
      });
    });

    // Verify Telegram WebApp methods were called
    expect(mockTelegramWebApp.ready).toHaveBeenCalled();
    expect(mockTelegramWebApp.expand).toHaveBeenCalled();
  });

  it('should return false when not in Mini App', () => {
    // Arrange: No Telegram WebApp
    (window as any).Telegram = undefined;

    // Act
    const { result } = renderHook(() => useTelegramMiniApp());

    // Assert
    expect(result.current.isMiniApp).toBe(false);
    expect(result.current.initData).toBeNull();
    expect(result.current.telegramUser).toBeNull();
    expect(result.current.webApp).toBeNull();
  });

  it('should handle missing user data gracefully', async () => {
    // Arrange: Telegram WebApp without user data
    (window as any).Telegram = {
      WebApp: {
        ready: vi.fn(),
        expand: vi.fn(),
        initData: 'test_init_data',
        initDataUnsafe: {},
      },
    };

    // Act
    const { result } = renderHook(() => useTelegramMiniApp());

    // Assert
    await waitFor(() => {
      expect(result.current.isMiniApp).toBe(true);
      expect(result.current.initData).toBe('test_init_data');
      expect(result.current.telegramUser).toBeNull();
    });
  });

  it('should handle missing initData', async () => {
    // Arrange: Telegram WebApp without initData
    (window as any).Telegram = {
      WebApp: {
        ready: vi.fn(),
        expand: vi.fn(),
        initData: '',
        initDataUnsafe: {
          user: {
            id: 123456789,
            first_name: 'Test',
          },
        },
      },
    };

    // Act
    const { result } = renderHook(() => useTelegramMiniApp());

    // Assert
    await waitFor(() => {
      expect(result.current.isMiniApp).toBe(true);
      expect(result.current.initData).toBeNull();
    });
  });
});

