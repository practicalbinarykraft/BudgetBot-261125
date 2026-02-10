import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Alert } from "react-native";
import { storage } from "../lib/storage";
import { queryClient } from "../lib/query-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export function useWebSocket(userId: number | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const wsUrl = API_URL.replace(/\/+$/, "");

    const socket = io(wsUrl, {
      path: "/socket.io",
      auth: { userId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ["polling", "websocket"],
      forceNew: false,
      autoConnect: false,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", () => {
      setConnected(false);
    });

    // Budget alerts
    socket.on("budget:warning", (data: { categoryName: string; percentage: number }) => {
      Alert.alert(
        "Budget Warning",
        `${data.categoryName} is at ${data.percentage}% of budget`
      );
    });

    socket.on("budget:exceeded", (data: { categoryName: string; percentage: number }) => {
      Alert.alert(
        "Budget Exceeded",
        `${data.categoryName} has exceeded budget (${data.percentage}%)`
      );
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    });

    // Transaction events
    socket.on("transaction:created", () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    });

    // Exchange rate updates
    socket.on("exchange_rate:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["exchange-rates-history"] });
    });

    // Wallet alerts
    socket.on("wallet:balance_low", (data: { walletName: string; balance: string }) => {
      Alert.alert(
        "Low Balance",
        `${data.walletName} balance is low: $${data.balance}`
      );
    });

    // System events
    socket.on("system:maintenance", (data: { message: string }) => {
      Alert.alert("System Notice", data.message);
    });

    socket.connect();

    // Keep-alive ping every 30s
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit("ping");
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [userId]);

  const subscribe = useCallback(
    (event: string, handler: (...args: any[]) => void) => {
      socketRef.current?.on(event, handler);
      return () => {
        socketRef.current?.off(event, handler);
      };
    },
    []
  );

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { connected, subscribe, emit };
}
