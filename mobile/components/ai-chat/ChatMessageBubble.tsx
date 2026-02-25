import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { MarkdownText } from "./MarkdownText";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import type { AiChatMessage } from "../../types";

interface Props {
  item: AiChatMessage;
}

export function ChatMessageBubble({ item }: Props) {
  const { theme } = useTheme();
  const isUser = item.role === "user";

  return (
    <View
      style={[
        styles.messageRow,
        isUser ? styles.messageRowUser : styles.messageRowAssistant,
      ]}
    >
      {!isUser ? (
        <View
          style={[styles.avatar, { backgroundColor: theme.primary + "20" }]}
        >
          <Feather name="cpu" size={16} color={theme.primary} />
        </View>
      ) : null}
      <View
        style={[
          styles.messageBubble,
          isUser
            ? [styles.userBubble, { backgroundColor: theme.primary }]
            : [
                styles.assistantBubble,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ],
        ]}
      >
        <MarkdownText
          color={isUser ? "#ffffff" : theme.text}
          style={styles.messageText}
        >
          {item.content}
        </MarkdownText>
      </View>
      {isUser ? (
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Feather name="user" size={16} color="#ffffff" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    maxWidth: "90%",
  },
  messageRowUser: { alignSelf: "flex-end" },
  messageRowAssistant: { alignSelf: "flex-start" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  messageBubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    maxWidth: "80%",
    flexShrink: 1,
  },
  userBubble: {},
  assistantBubble: { borderWidth: 1 },
  messageText: { lineHeight: 20 },
});
