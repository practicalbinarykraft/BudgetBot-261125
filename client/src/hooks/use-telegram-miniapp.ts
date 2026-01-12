/**
 * useTelegramMiniApp Hook
 *
 * Detects if app is running in Telegram Mini App and provides initData
 * Junior-Friendly: ~80 lines, clear and simple
 */

import { useState, useEffect } from 'react';

import type { TelegramUser } from '@shared/types/telegram';

interface TelegramMiniAppState {
  isMiniApp: boolean;
  initData: string | null;
  telegramUser: TelegramUser | null;
  webApp: any; // Telegram WebApp type - using any to avoid complex type definitions
}

/**
 * Hook to detect Telegram Mini App and get initData
 * 
 * @returns {TelegramMiniAppState} State with isMiniApp flag, initData, and user info
 * 
 * @example
 * ```tsx
 * const { isMiniApp, initData, telegramUser } = useTelegramMiniApp();
 * 
 * if (isMiniApp) {
 *   // Handle Mini App specific logic
 * }
 * ```
 */
export function useTelegramMiniApp(): TelegramMiniAppState {
  const [state, setState] = useState<TelegramMiniAppState>({
    isMiniApp: false,
    initData: null,
    telegramUser: null,
    webApp: null,
  });

  useEffect(() => {
    // Check if running in Telegram Mini App
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Initialize Mini App
      tg.ready();
      tg.expand(); // Expand to full screen
      
      // Get initData and user info
      const initData = tg.initData;
      const unsafeUser = tg.initDataUnsafe?.user;
      
      // Map Telegram WebApp user to TelegramUser type
      const telegramUser: TelegramUser | null = unsafeUser ? {
        id: unsafeUser.id,
        first_name: unsafeUser.first_name || '',
        username: unsafeUser.username,
        photo_url: unsafeUser.photo_url,
        auth_date: Math.floor(Date.now() / 1000), // Use current timestamp as fallback
        hash: '', // Not available in initDataUnsafe
        language_code: unsafeUser.language_code,
      } : null;
      
      setState({
        isMiniApp: true,
        initData: initData || null,
        telegramUser,
        webApp: tg,
      });
    } else {
      // Not in Mini App
      setState({
        isMiniApp: false,
        initData: null,
        telegramUser: null,
        webApp: null,
      });
    }
  }, []);

  return state;
}

