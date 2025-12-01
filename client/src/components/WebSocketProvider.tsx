/**
 * WebSocket Provider
 *
 * Initializes WebSocket connection for real-time notifications
 */

import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  // Initialize WebSocket connection
  useWebSocket();

  return <>{children}</>;
}
