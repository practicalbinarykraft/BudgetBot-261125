import React, { useCallback } from "react";
import { View, Pressable, StyleSheet, ActivityIndicator, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useInlineVoice } from "../hooks/useInlineVoice";
import { SpeechBubble } from "./SpeechBubble";
import { useTranslation } from "../i18n";
import { useSpotlightTarget } from "../tutorial/spotlight";

type IconName = React.ComponentProps<typeof Feather>["name"];

function Btn({ name, size, color, bg, d, border, onPress }: {
  name: IconName; size: number; color: string; bg: string;
  d: number; border?: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, {
        width: d, height: d, borderRadius: d / 2, backgroundColor: bg,
        borderColor: border ?? "transparent", borderWidth: border ? 1 : 0,
      }]}
    >
      <Feather name={name} size={size} color={color} />
    </Pressable>
  );
}

export default function FloatingActionPanel() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<NativeStackNavigationProp<any>>();
  const bottom = insets.bottom + 8;
  const s = { bg: theme.card, border: theme.cardBorder, c: theme.text };

  const handleVoiceResult = useCallback((r: { amount: string; currency: string; description: string; category?: string; type: "income" | "expense" }) => {
    nav.navigate("AddTransaction", {
      prefill: {
        amount: r.amount,
        currency: r.currency,
        description: r.description,
        type: r.type,
        category: r.category,
      },
    });
  }, [nav]);

  const voice = useInlineVoice(false, handleVoiceResult);
  const fabTarget = useSpotlightTarget("fab_plus_btn");

  const micBg = voice.isRecording ? "#ef4444" : voice.isParsing ? theme.secondary : theme.primary;
  const micBorder = voice.isRecording ? "#ef4444" : undefined;
  const micIcon: IconName = voice.isRecording ? "square" : "mic";

  return (
    <View style={[styles.root, { bottom }]} pointerEvents="box-none">
      {/* Speech bubble — positioned above the entire panel so it's never clipped */}
      {(voice.isRecording || voice.isParsing) && (
        <View style={styles.bubbleWrap}>
          <SpeechBubble
            text={voice.isParsing
              ? t("voice_input.transcribing")
              : t("voice_input.bubble_hint")}
            visible
          />
        </View>
      )}

      <View style={styles.container} pointerEvents="box-none">
        {/* Mic button — records on main screen */}
        <View style={[styles.abs, { top: 0, left: 48 }]}>
          <Animated.View style={{ transform: [{ scale: voice.isRecording ? voice.pulseAnim : 1 }] }}>
            <Pressable
              onPress={() => voice.toggle()}
              disabled={voice.isParsing}
              style={[styles.btn, {
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: micBg,
                borderColor: micBorder ?? "transparent",
                borderWidth: micBorder ? 2 : 0,
              }]}
            >
              {voice.isParsing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name={micIcon} size={28} color="#fff" />
              )}
            </Pressable>
          </Animated.View>
        </View>

        <View style={[styles.abs, { top: 56, left: 0 }]}>
          <Btn name="home" size={22} color={s.c} bg={s.bg} d={48} border={s.border}
            onPress={() => nav.navigate("Main", { screen: "Dashboard" })} />
        </View>
        <View style={[styles.abs, { top: 56, right: 0 }]}>
          <Btn name="message-circle" size={22} color={s.c} bg={s.bg} d={48} border={s.border}
            onPress={() => nav.navigate("AIChat")} />
        </View>
        <View style={[styles.abs, { bottom: 0, left: 56 }]} ref={fabTarget.ref} onLayout={fabTarget.onLayout}>
          <Btn name="plus" size={22} color={s.c} bg={s.bg} d={48} border={s.border}
            onPress={() => nav.navigate("AddTransaction")} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 50 },
  bubbleWrap: { marginBottom: 4, alignItems: "center" },
  container: { width: 160, height: 160 },
  abs: { position: "absolute" },
  btn: {
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
});
