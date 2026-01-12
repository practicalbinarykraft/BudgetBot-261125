/**
 * WebSocket Provider
 *
 * Initializes WebSocket connection for real-time notifications
 * NOTE: WebSocket is automatically disabled in admin routes by useWebSocket hook
 */

import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect, useState } from 'react';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isAdminRoute, setIsAdminRoute] = useState(
    typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
  );

  // Update admin route status on navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkAdminRoute = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    };
    
    window.addEventListener('popstate', checkAdminRoute);
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      checkAdminRoute();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      checkAdminRoute();
    };
    
    return () => {
      window.removeEventListener('popstate', checkAdminRoute);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  // Всегда вызываем хук (React rules), но хук сам проверяет условия
  // The hook will return early if in admin route, preventing any connection
  // Хук также проверяет window и другие условия внутри себя
  try {
    useWebSocket();
  } catch (error) {
    // Ловим любые ошибки при инициализации WebSocket
    console.error('[WebSocketProvider] Error initializing WebSocket:', error);
    // Продолжаем рендеринг даже при ошибке WebSocket
  }

  return <>{children}</>;
}
