/**
 * WebSocket Hook
 *
 * Real-time notifications using Socket.IO
 */

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// WebSocket server URL
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;

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
    if (!user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to Socket.IO server
    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: {
        userId: user.id,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

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
