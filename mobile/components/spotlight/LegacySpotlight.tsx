import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Pressable, Dimensions, Animated, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { ThemedText } from "../ThemedText";
import { Spacing } from "../../constants/theme";
import { useTranslation } from "../../i18n";
import {
  registerSpotlightShow,
  unregisterSpotlightShow,
  type SpotlightTarget,
} from "../../lib/spotlight-ref";
import { getViewAllRect } from "../../lib/view-all-ref";
import { buildCircleCutoutPath } from "./cutout-paths";

// ─── Legacy position calculator ──────────────────────────────────────

interface TargetPosition { cx: number; cy: number; radius: number }

function useLegacyTargetPosition(targetId: SpotlightTarget | null): TargetPosition | null {
  const insets = useSafeAreaInsets();
  if (!targetId) return null;

  const { width: SW, height: SH } = Dimensions.get("window");

  switch (targetId) {
    case "add_transaction": {
      const cx = SW / 2 - 80 + 56 + 24;
      return { cx, cy: SH - insets.bottom - 8 - 24, radius: 32 };
    }
    case "voice_input": {
      const cx = SW / 2 - 80 + 48 + 32;
      return { cx, cy: SH - insets.bottom - 8 - 160 + 32, radius: 40 };
    }
    case "receipt_scan":
      return { cx: SW - 16 - 20, cy: insets.top + 8 + 20, radius: 28 };
    case "view_transactions": {
      const rect = getViewAllRect();
      if (rect) {
        return {
          cx: rect.x + rect.width / 2,
          cy: rect.y + rect.height / 2,
          radius: Math.max(rect.width, rect.height) / 2 + 8,
        };
      }
      return { cx: SW - 60, cy: 420, radius: 32 };
    }
    default:
      return null;
  }
}

const LEGACY_TOOLTIP_KEYS: Record<SpotlightTarget, string> = {
  add_transaction: "spotlight.add_transaction",
  voice_input: "spotlight.voice_input",
  receipt_scan: "spotlight.receipt_scan",
  view_transactions: "spotlight.view_transactions",
};

// ─── Component ───────────────────────────────────────────────────────

export default function LegacySpotlight() {
  const { t } = useTranslation();
  const useND = Platform.OS !== "web";
  const [targetId, setTargetId] = useState<SpotlightTarget | null>(null);
  const position = useLegacyTargetPosition(targetId);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const show = useCallback((id: SpotlightTarget) => setTargetId(id), []);
  const dismiss = useCallback(() => setTargetId(null), []);

  useEffect(() => {
    registerSpotlightShow(show);
    return () => unregisterSpotlightShow();
  }, [show]);

  useEffect(() => {
    if (!targetId) return;
    pulseAnim.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: useND }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: useND }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [targetId, pulseAnim]);

  if (!targetId || !position) return null;

  const { width: SW, height: SH } = Dimensions.get("window");
  const { cx, cy, radius } = position;
  const tooltipAbove = cy > SH / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}>
        <Svg width={SW} height={SH}>
          <Path
            d={buildCircleCutoutPath(SW, SH, cx, cy, radius)}
            fill="rgba(0,0,0,0.6)"
            fillRule="evenodd"
          />
        </Svg>
      </Pressable>

      <Animated.View
        pointerEvents="none"
        style={[styles.pulseRing, {
          left: cx - radius, top: cy - radius,
          width: radius * 2, height: radius * 2,
          borderRadius: radius,
          transform: [{ scale: pulseAnim }],
        }]}
      />

      <View
        pointerEvents="none"
        style={[styles.tooltip, {
          left: Spacing.xl, right: Spacing.xl,
          ...(tooltipAbove
            ? { bottom: SH - cy + radius + 16 }
            : { top: cy + radius + 16 }),
        }]}
      >
        <ThemedText type="bodySm" color="#ffffff" style={styles.tooltipText}>
          {t(LEGACY_TOOLTIP_KEYS[targetId])}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pulseRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#ffffff80",
  },
  tooltip: {
    position: "absolute",
    alignItems: "center",
  },
  tooltipText: {
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
