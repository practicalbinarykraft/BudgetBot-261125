import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { uiAlert } from "@/lib/uiAlert";
import { storage } from "../lib/storage";
import { queryClient } from "../lib/query-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export function useWebSocket(userId: number | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    let pingInterval: ReturnType<typeof setInterval> | null = null;

    storage.getToken().then((token) => {
      if (cancelled || !token) return;

      const wsUrl = API_URL.replace(/\/+$/, "");

      const socket = io(wsUrl, {
        path: "/socket.io",
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        transports: ["polling", "websocket"],
        forceNew: false,
        autoConnect: false,
      });

      socketRef.current = socket;

      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));
      socket.on("connect_error", () => setConnected(false));

      socket.on("budget:warning", (data: { categoryName: string; percentage: number }) => {
        uiAlert("Budget Warning", `${data.categoryName} is at ${data.percentage}% of budget`);
      });

      socket.on("budget:exceeded", (data: { categoryName: string; percentage: number }) => {
        uiAlert("Budget Exceeded", `${data.categoryName} has exceeded budget (${data.percentage}%)`);
        queryClient.invalidateQueries({ queryKey: ["budgets"] });
      });

      socket.on("transaction:created", () => {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        queryClient.invalidateQueries({ queryKey: ["wallets"] });
      });

      socket.on("exchange_rate:updated", () => {
        queryClient.invalidateQueries({ queryKey: ["exchange-rates-history"] });
      });

      socket.on("wallet:balance_low", (data: { walletName: string; balance: string }) => {
        uiAlert("Low Balance", `${data.walletName} balance is low: $${data.balance}`);
      });

      socket.on("system:maintenance", (data: { message: string }) => {
        uiAlert("System Notice", data.message);
      });

      socket.connect();

      pingInterval = setInterval(() => {
        if (socket.connected) socket.emit("ping");
      }, 30000);
    });

    return () => {
      cancelled = true;
      if (pingInterval) clearInterval(pingInterval);
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
    };
  }, [userId]);

  const subscribe = useCallback(
    (event: string, handler: (...args: any[]) => void) => {
      socketRef.current?.on(event, handler);
      return () => { socketRef.current?.off(event, handler); };
    },
    []
  );

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { connected, subscribe, emit };
}
