/**
 * WebSocket Hook
 *
 * Real-time notifications using Socket.IO
 */

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// WebSocket server URL - computed dynamically to avoid issues
const getSocketUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Don't connect WebSocket in admin panel
  if (window.location.pathname.startsWith('/admin')) {
    return null;
  }
  
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // Validate API URL
    try {
      const url = new URL(apiUrl);
      if (url.hostname && !url.hostname.includes('undefined')) {
        return apiUrl;
      }
    } catch (error) {
      console.warn('[WebSocket] Invalid VITE_API_URL, using fallback:', apiUrl);
    }
  }
  
  // Fallback to current origin, but ensure it's valid
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  
  // КРИТИЧНО: Если порт пустой, явно устанавливаем порт для localhost
  if (!port || port === '' || port === 'undefined') {
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // В dev режиме всегда используем порт 3000
      const devPort = import.meta.env.DEV ? ':3000' : '';
      const constructedOrigin = `${protocol}//${hostname}${devPort}`;
      console.log('[WebSocket] Constructed URL for localhost without port:', constructedOrigin);
      return constructedOrigin;
    }
    // Для других хостов используем стандартные порты
    const defaultPort = protocol === 'https:' ? '' : ':80';
    const constructedOrigin = `${protocol}//${hostname}${defaultPort}`;
    console.log('[WebSocket] Constructed URL without port:', constructedOrigin);
    return constructedOrigin;
  }
  
  // Если порт есть, используем origin, но проверяем на undefined
  const origin = window.location.origin;
  if (!origin || origin.includes('undefined') || !origin.includes('://')) {
    console.warn('[WebSocket] Invalid origin, skipping connection:', origin);
    return null;
  }
  
  return origin;
};

// Event types
export enum NotificationEvent {
  // Budget alerts
  BUDGET_EXCEEDED = 'budget:exceeded',
  BUDGET_WARNING = 'budget:warning',
  BUDGET_RESET = 'budget:reset',

  // Transaction events
  TRANSACTION_CREATED = 'transaction:created',
  TRANSACTION_UPDATED = 'transaction:updated',
  TRANSACTION_DELETED = 'transaction:deleted',

  // Currency events
  EXCHANGE_RATE_UPDATED = 'exchange_rate:updated',
  EXCHANGE_RATE_ALERT = 'exchange_rate:alert',

  // Wallet events
  WALLET_BALANCE_LOW = 'wallet:balance_low',

  // System events
  SYSTEM_MAINTENANCE = 'system:maintenance',
}

/**
 * WebSocket hook for real-time notifications
 */
export function useWebSocket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    // Get URL dynamically
    const socketUrl = getSocketUrl();
    
    // Don't connect in admin panel or if no URL
    if (!socketUrl) {
      return;
    }

    if (!user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to Socket.IO server
    // CRITICAL: Ensure socketUrl is valid and doesn't contain 'undefined'
    if (!socketUrl || socketUrl.includes('undefined')) {
      console.error('[WebSocket] Invalid socketUrl, skipping connection:', socketUrl);
      return;
    }

    // Final validation - ensure URL is completely valid
    let finalUrl = socketUrl;
    try {
      const url = new URL(socketUrl);
      // If port is undefined, set it explicitly
      if (!url.port && url.hostname === 'localhost') {
        finalUrl = `${url.protocol}//${url.hostname}:3000`;
        console.log('[WebSocket] Fixed localhost URL without port:', finalUrl);
      }
      // Validate the final URL
      new URL(finalUrl); // This will throw if invalid
      
      // Final check - ensure no undefined in URL
      if (finalUrl.includes('undefined')) {
        console.error('[WebSocket] URL still contains undefined after validation:', finalUrl);
        return;
      }
    } catch (error) {
      console.error('[WebSocket] Invalid URL after validation, skipping connection:', socketUrl, error);
      return;
    }

    // Создаем Socket.IO клиент с отключенным autoConnect
    // Подключимся явно после проверки
    const socket = io(finalUrl, {
      path: '/socket.io',
      auth: {
        userId: user.id,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      // Force Socket.IO to use HTTP transport, not native WebSocket
      transports: ['polling', 'websocket'],
      // Prevent Socket.IO from auto-detecting URL (which might use undefined port)
      forceNew: false,
      // Отключаем автоматическое подключение - подключимся явно после проверки
      autoConnect: false,
      // Явно указываем URL, чтобы Socket.IO не пытался его определить сам
      withCredentials: true,
    });

    // Подключаемся только после проверки, что URL валидный
    if (socket && finalUrl && !finalUrl.includes('undefined')) {
      try {
        socket.connect();
        console.log('[WebSocket] Connecting to:', finalUrl);
      } catch (error) {
        console.error('[WebSocket] Failed to connect:', error);
        return;
      }
    } else {
      console.error('[WebSocket] Cannot connect - invalid socket or URL');
      return;
    }

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('[WebSocket] Connected', { socketId: socket.id });
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
    });

    // Budget alerts
    socket.on(NotificationEvent.BUDGET_WARNING, (data) => {
      toast({
        title: '⚠️ Budget Warning',
        description: data.message,
        variant: 'default',
      });
    });

    socket.on(NotificationEvent.BUDGET_EXCEEDED, (data) => {
      toast({
        title: '🚨 Budget Exceeded!',
        description: data.message,
        variant: 'destructive',
      });
    });

    // Transaction events
    socket.on(NotificationEvent.TRANSACTION_CREATED, (data) => {
      // Optional: Show toast for transaction created
      // toast({
      //   title: 'Transaction Created',
      //   description: data.message,
      // });
    });

    // Exchange rate updates
    socket.on(NotificationEvent.EXCHANGE_RATE_UPDATED, (data) => {
      console.log('[WebSocket] Exchange rates updated', data);
      // Optional: Show toast
      // toast({
      //   title: 'Exchange Rates Updated',
      //   description: data.message,
      // });
    });

    // Wallet balance low
    socket.on(NotificationEvent.WALLET_BALANCE_LOW, (data) => {
      toast({
        title: '💰 Low Balance Alert',
        description: data.message,
        variant: 'default',
      });
    });

    // System maintenance
    socket.on(NotificationEvent.SYSTEM_MAINTENANCE, (data) => {
      toast({
        title: '🔧 System Maintenance',
        description: data.message,
        variant: 'default',
      });
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, toast]);

  // Send ping to keep connection alive
  useEffect(() => {
    if (!socketRef.current) return;

    const pingInterval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('ping');
      }
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, []);

  // Subscribe to a custom event
  const subscribe = useCallback((event: string, handler: (data: any) => void) => {
    if (!socketRef.current) return;

    socketRef.current.on(event, handler);

    // Return unsubscribe function
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
    };
  }, []);

  // Emit a custom event
  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current) return;

    socketRef.current.emit(event, data);
  }, []);

  return {
    socket: socketRef.current,
    subscribe,
    emit,
    connected: socketRef.current?.connected || false,
  };
}
