/**
 * WebSocket Server
 *
 * Real-time notifications using Socket.IO
 * Features:
 * - Budget alerts when spending exceeds limit
 * - Transaction updates
 * - Currency rate changes
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import logger from './logger';

let io: SocketIOServer | null = null;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5000',
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket: Socket) => {
    logger.info('WebSocket client connected', {
      socketId: socket.id,
      userId: socket.handshake.auth.userId,
    });

    // Join user-specific room
    const userId = socket.handshake.auth.userId;
    if (userId) {
      socket.join(`user:${userId}`);
      logger.info('User joined room', {
        socketId: socket.id,
        userId,
        room: `user:${userId}`,
      });
    }

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info('WebSocket client disconnected', {
        socketId: socket.id,
        userId: socket.handshake.auth.userId,
      });
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  logger.info('✅ WebSocket server initialized');

  return io;
}

/**
 * Get Socket.IO server instance
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('WebSocket server not initialized. Call initializeWebSocket() first.');
  }
  return io;
}

/**
 * Send notification to a specific user
 */
export function sendNotificationToUser(userId: number, event: string, data: any) {
  try {
    if (!io) {
      logger.warn('Cannot send notification: WebSocket not initialized');
      return;
    }

    io.to(`user:${userId}`).emit(event, data);

    logger.info('Notification sent', {
      userId,
      event,
      data,
    });
  } catch (error: any) {
    logger.error('Failed to send WebSocket notification', {
      error: error.message,
      userId,
      event,
    });
  }
}

/**
 * Broadcast notification to all connected clients
 */
export function broadcastNotification(event: string, data: any) {
  try {
    if (!io) {
      logger.warn('Cannot broadcast: WebSocket not initialized');
      return;
    }

    io.emit(event, data);

    logger.info('Notification broadcasted', {
      event,
      data,
    });
  } catch (error: any) {
    logger.error('Failed to broadcast notification', {
      error: error.message,
      event,
    });
  }
}

/**
 * Event types for notifications
 */
export enum NotificationEvent {
  // Budget alerts
  BUDGET_EXCEEDED = 'budget:exceeded',
  BUDGET_WARNING = 'budget:warning', // 80% of budget reached
  BUDGET_RESET = 'budget:reset',

  // Transaction events
  TRANSACTION_CREATED = 'transaction:created',
  TRANSACTION_UPDATED = 'transaction:updated',
  TRANSACTION_DELETED = 'transaction:deleted',

  // Currency events
  EXCHANGE_RATE_UPDATED = 'exchange_rate:updated',
  EXCHANGE_RATE_ALERT = 'exchange_rate:alert', // Significant change

  // Wallet events
  WALLET_BALANCE_LOW = 'wallet:balance_low',

  // System events
  SYSTEM_MAINTENANCE = 'system:maintenance',
}
