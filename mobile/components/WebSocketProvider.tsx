import React from "react";
import { useWebSocket } from "../hooks/useWebSocket";

interface WebSocketProviderProps {
  userId: number | undefined;
  children: React.ReactNode;
}

export default function WebSocketProvider({
  userId,
  children,
}: WebSocketProviderProps) {
  useWebSocket(userId);
  return <>{children}</>;
}
