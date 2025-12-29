/**
 * Hook for Telegram Mini App integration
 *
 * Provides access to Telegram WebApp API:
 * - User data (id, username, language)
 * - Theme colors
 * - MainButton, BackButton
 * - Closing, expanding
 */

import { useEffect, useState } from 'react';

// Extend Window interface for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
            photo_url?: string;
          };
          auth_date?: number;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          setParams: (params: {
            text?: string;
            color?: string;
            text_color?: string;
            is_active?: boolean;
            is_visible?: boolean;
          }) => void;
        };
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        isClosingConfirmationEnabled: boolean;
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: Array<{ id?: string; type?: string; text?: string }>;
        }, callback?: (buttonId: string) => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        sendData: (data: string) => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        openInvoice: (url: string, callback?: (status: string) => void) => void;
      };
    };
  }
}

export interface TelegramWebApp {
  isAvailable: boolean;
  isTelegramMiniApp: boolean;
  user: {
    id: number;
    firstName: string;
    lastName?: string;
    username?: string;
    languageCode?: string;
    isPremium?: boolean;
    photoUrl?: string;
  } | null;
  initData: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  mainButton: {
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    enable: () => void;
    disable: () => void;
    showProgress: () => void;
    hideProgress: () => void;
  };
  backButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  haptic: {
    impact: (style?: 'light' | 'medium' | 'heavy') => void;
    notification: (type: 'error' | 'success' | 'warning') => void;
    selection: () => void;
  };
  expand: () => void;
  close: () => void;
  ready: () => void;
}

export function useTelegramWebApp(): TelegramWebApp {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      setIsAvailable(true);
      // Signal that Mini App is ready
      window.Telegram.WebApp.ready();
      // Expand to full height
      window.Telegram.WebApp.expand();
    }
  }, []);

  const webApp = window.Telegram?.WebApp;
  const isTelegramMiniApp = isAvailable && !!webApp?.initData;

  return {
    isAvailable,
    isTelegramMiniApp,
    user: webApp?.initDataUnsafe?.user ? {
      id: webApp.initDataUnsafe.user.id,
      firstName: webApp.initDataUnsafe.user.first_name,
      lastName: webApp.initDataUnsafe.user.last_name,
      username: webApp.initDataUnsafe.user.username,
      languageCode: webApp.initDataUnsafe.user.language_code,
      isPremium: webApp.initDataUnsafe.user.is_premium,
      photoUrl: webApp.initDataUnsafe.user.photo_url,
    } : null,
    initData: webApp?.initData || '',
    platform: webApp?.platform || 'web',
    colorScheme: webApp?.colorScheme || 'light',
    themeParams: webApp?.themeParams || {},
    mainButton: {
      show: () => webApp?.MainButton.show(),
      hide: () => webApp?.MainButton.hide(),
      setText: (text: string) => webApp?.MainButton.setText(text),
      onClick: (callback: () => void) => webApp?.MainButton.onClick(callback),
      enable: () => webApp?.MainButton.enable(),
      disable: () => webApp?.MainButton.disable(),
      showProgress: () => webApp?.MainButton.showProgress(),
      hideProgress: () => webApp?.MainButton.hideProgress(),
    },
    backButton: {
      show: () => webApp?.BackButton.show(),
      hide: () => webApp?.BackButton.hide(),
      onClick: (callback: () => void) => webApp?.BackButton.onClick(callback),
    },
    haptic: {
      impact: (style = 'medium') => webApp?.HapticFeedback.impactOccurred(style),
      notification: (type) => webApp?.HapticFeedback.notificationOccurred(type),
      selection: () => webApp?.HapticFeedback.selectionChanged(),
    },
    expand: () => webApp?.expand(),
    close: () => webApp?.close(),
    ready: () => webApp?.ready(),
  };
}
