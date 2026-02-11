import React from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

interface Props {
  message: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isPending: boolean;
}

export function ChatInputArea({
  message,
  onChangeText,
  onSend,
  isPending,
}: Props) {
  const { theme } = useTheme();
  const canSend = message.trim() && !isPending;

  return (
    <View
      style={[
        styles.inputArea,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
      ]}
    >
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: theme.input,
            color: theme.text,
            borderColor: theme.border,
          },
        ]}
        value={message}
        onChangeText={onChangeText}
        placeholder="Ask about your spending..."
        placeholderTextColor={theme.textTertiary}
        multiline
        maxLength={2000}
        editable={!isPending}
      />
      <Pressable
        onPress={onSend}
        disabled={!canSend}
        style={[
          styles.sendBtn,
          {
            backgroundColor: canSend ? theme.primary : theme.muted,
          },
        ]}
      >
        <Feather
          name="send"
          size={18}
          color={canSend ? "#ffffff" : theme.textTertiary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
