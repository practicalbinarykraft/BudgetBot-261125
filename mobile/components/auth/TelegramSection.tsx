import React from "react";
import { View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { useTheme } from "../../hooks/useTheme";
import { authStyles as styles } from "./authStyles";

export function TelegramSection() {
  const { theme } = useTheme();

  return (
    <>
      <View style={styles.dividerContainer}>
        <View
          style={[styles.dividerLine, { backgroundColor: theme.border }]}
        />
        <View
          style={[
            styles.dividerTextWrap,
            { backgroundColor: theme.background },
          ]}
        >
          <ThemedText
            type="small"
            color={theme.textSecondary}
            style={styles.dividerText}
          >
            {"OR CONTINUE WITH"}
          </ThemedText>
        </View>
      </View>

      <Pressable
        style={[
          styles.telegramButton,
          { backgroundColor: "#0088cc20", borderColor: "#0088cc40" },
        ]}
        onPress={() => {}}
        disabled
      >
        <Feather name="send" size={16} color="#0088cc" />
        <ThemedText
          type="bodySm"
          color="#0088cc"
          style={styles.telegramText}
        >
          {"Telegram Login"}
        </ThemedText>
      </Pressable>
      <ThemedText
        type="small"
        color={theme.textTertiary}
        style={styles.telegramHint}
      >
        {"Available via web app"}
      </ThemedText>
    </>
  );
}
