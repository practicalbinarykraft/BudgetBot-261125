import { useState, useRef, useEffect } from "react";
import { FlatList, Alert } from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import type { AiChatMessage } from "../types";

export function useAIChat() {
  const [message, setMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const historyQuery = useQuery({
    queryKey: ["ai-chat-history"],
    queryFn: () => api.get<AiChatMessage[]>("/api/ai/chat/history"),
  });

  const sendMutation = useMutation({
    mutationFn: (userMessage: string) =>
      api.post<{ success: boolean; message: string }>("/api/ai/chat", {
        message: userMessage,
        includeContext: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-chat-history"] });
      setMessage("");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to send message");
    },
  });

  const messages = historyQuery.data || [];

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  const handleQuickAction = (question: string) => {
    if (sendMutation.isPending) return;
    setMessage(question);
    sendMutation.mutate(question);
  };

  return {
    message,
    setMessage,
    flatListRef,
    historyQuery,
    sendMutation,
    messages,
    handleSend,
    handleQuickAction,
  };
}
