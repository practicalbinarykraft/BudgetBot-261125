/**
 * useTelegramMiniApp Hook
 *
 * Detects if app is running in Telegram Mini App and provides initData
 * Junior-Friendly: ~80 lines, clear and simple
 */

import { useState, useEffect } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

interface TelegramMiniAppState {
  isMiniApp: boolean;
  initData: string | null;
  telegramUser: TelegramUser | null;
  webApp: typeof window.Telegram.WebApp | null;
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
      const user = tg.initDataUnsafe?.user || null;
      
      setState({
        isMiniApp: true,
        initData: initData || null,
        telegramUser: user,
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

