import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { KeyboardAvoidingView } from "@/components/KeyboardAvoidingView";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { useAIChat } from "../hooks/useAIChat";
import { ChatMessageBubble } from "../components/ai-chat/ChatMessageBubble";
import { ChatEmptyState } from "../components/ai-chat/ChatEmptyState";
import { ChatInputArea } from "../components/ai-chat/ChatInputArea";
import { TypingIndicator } from "../components/ai-chat/TypingIndicator";
import type { AiChatMessage } from "../types";

export default function AIChatScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const {
    message,
    setMessage,
    flatListRef,
    historyQuery,
    sendMutation,
    messages,
    handleSend,
    handleQuickAction,
  } = useAIChat();

  const renderMessage = ({ item }: { item: AiChatMessage }) => (
    <ChatMessageBubble item={item} />
  );

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Info Banner */}
      <View
        style={[
          styles.infoBanner,
          {
            backgroundColor: "#eff6ff",
            borderColor: "#bfdbfe",
          },
        ]}
      >
        <Feather name="info" size={16} color="#2563eb" />
        <ThemedText type="small" color="#1e40af" style={styles.infoText}>
          {"Ask about your spending, budgets, and financial goals. AI has access to your transaction data."}
        </ThemedText>
      </View>

      {/* Messages */}
      {historyQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : messages.length === 0 && !sendMutation.isPending ? (
        <ChatEmptyState onQuickAction={handleQuickAction} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          ListFooterComponent={
            sendMutation.isPending ? <TypingIndicator /> : null
          }
        />
      )}

      {/* Input Area */}
      <ChatInputArea
        message={message}
        onChangeText={setMessage}
        onSend={handleSend}
        isPending={sendMutation.isPending}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    margin: Spacing.md,
    marginBottom: 0,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  infoText: { flex: 1, lineHeight: 18 },
  messagesList: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
});
