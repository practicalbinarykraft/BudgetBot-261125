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
import jwt from 'jsonwebtoken';
import logger from './logger';
import { ALLOWED_ORIGINS } from '../middleware/cors';

let io: SocketIOServer | null = null;

function extractUserId(socket: Socket): number | null {
  // Try JWT token first (mobile app sends auth: { token })
  const token = socket.handshake.auth.token;
  if (token && process.env.SESSION_SECRET) {
    try {
      const payload = jwt.verify(token, process.env.SESSION_SECRET) as { userId: number };
      return payload.userId;
    } catch {
      // Invalid token — fall through
    }
  }

  // Fallback: legacy userId (web client via session)
  const userId = socket.handshake.auth.userId;
  return userId ? Number(userId) : null;
}

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: ALLOWED_ORIGINS,
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket: Socket) => {
    const userId = extractUserId(socket);

    if (!userId) {
      logger.warn('WebSocket connection rejected: no valid auth', { socketId: socket.id });
      socket.disconnect(true);
      return;
    }

    logger.info('WebSocket client connected', { socketId: socket.id, userId });

    socket.join(`user:${userId}`);
    socket.data.userId = userId;

    socket.on('disconnect', () => {
      logger.info('WebSocket client disconnected', { socketId: socket.id, userId });
    });

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
export function sendNotificationToUser(userId: number, event: string, data: unknown) {
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
  } catch (error: unknown) {
    logger.error('Failed to send WebSocket notification', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      event,
    });
  }
}

/**
 * Broadcast notification to all connected clients
 */
export function broadcastNotification(event: string, data: unknown) {
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
  } catch (error: unknown) {
    logger.error('Failed to broadcast notification', {
      error: error instanceof Error ? error.message : String(error),
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
