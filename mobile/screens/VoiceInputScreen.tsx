import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Card, CardContent } from "../components/Card";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { useVoiceInputScreen } from "../hooks/useVoiceInputScreen";
import { VoiceResultCard } from "../components/voice-input/VoiceResultCard";

export default function VoiceInputScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const h = useVoiceInputScreen();

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="h3" style={styles.bold}>
            {t("voice_input.title")}
          </ThemedText>
          <ThemedText type="small" color={theme.textSecondary}>
            {"Record a voice message to create a transaction"}
          </ThemedText>
        </View>
      </View>

      {/* Record Button */}
      <View style={styles.recordSection}>
        <Animated.View style={{ transform: [{ scale: h.pulseAnim }] }}>
          <Pressable
            onPress={h.handleToggleRecording}
            disabled={h.isParsing}
            style={[
              styles.recordBtn,
              {
                backgroundColor: h.isRecording ? "#ef4444" : theme.primary,
              },
            ]}
          >
            <Feather
              name={h.isRecording ? "square" : "mic"}
              size={32}
              color="#ffffff"
            />
          </Pressable>
        </Animated.View>
        <ThemedText type="bodySm" color={theme.textSecondary}>
          {h.isRecording
            ? "Recording... Tap to stop"
            : h.isParsing
              ? "Processing..."
              : "Tap to start recording"}
        </ThemedText>
        <ThemedText type="small" color={theme.textTertiary}>
          {'Say something like "Coffee 5 dollars" or "Salary 3000"'}
        </ThemedText>
      </View>

      {/* Parsing indicator */}
      {h.isParsing ? (
        <Card>
          <CardContent style={styles.parsingContent}>
            <Feather name="loader" size={24} color={theme.primary} />
            <ThemedText type="bodySm" color={theme.textSecondary}>
              {"Transcribing and parsing..."}
            </ThemedText>
          </CardContent>
        </Card>
      ) : null}

      {/* Result */}
      {h.result ? (
        <VoiceResultCard
          result={h.result}
          onCreateTransaction={() => {
            h.navigation.navigate("AddTransaction" as never);
          }}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing["5xl"] },
  headerRow: { gap: Spacing.sm },
  bold: { fontWeight: "600" },
  recordSection: { alignItems: "center", gap: Spacing.md, paddingVertical: Spacing.xl },
  recordBtn: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center",
  },
  parsingContent: { alignItems: "center", gap: Spacing.md, paddingVertical: Spacing.xl },
});
