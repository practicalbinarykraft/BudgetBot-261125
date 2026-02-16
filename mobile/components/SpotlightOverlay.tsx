import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Pressable, Dimensions, Animated, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Button } from "./Button";
import { ThemedText } from "./ThemedText";
import { Spacing } from "../constants/theme";
import { useTranslation } from "../i18n";
import {
  registerSpotlightShow,
  unregisterSpotlightShow,
  type SpotlightTarget,
} from "../lib/spotlight-ref";
import { getViewAllRect } from "../lib/view-all-ref";

interface TargetPosition {
  cx: number;
  cy: number;
  radius: number;
}

function useTargetPosition(targetId: SpotlightTarget | null): TargetPosition | null {
  const insets = useSafeAreaInsets();
  if (!targetId) return null;

  const { width: SW, height: SH } = Dimensions.get("window");

  switch (targetId) {
    case "add_transaction": {
      // FloatingActionPanel "+" button: panel centered horizontally, bottom = insets.bottom + 8
      // Container 160x160, plus button at (bottom:0, left:56, 48x48)
      const cx = SW / 2 - 80 + 56 + 24;
      const cy = SH - insets.bottom - 8 - 24;
      return { cx, cy, radius: 32 };
    }
    case "voice_input": {
      // FloatingActionPanel mic button: same panel, mic at (top:0, left:48, 64x64)
      const cx = SW / 2 - 80 + 48 + 32;
      const cy = SH - insets.bottom - 8 - 160 + 32;
      return { cx, cy, radius: 40 };
    }
    case "receipt_scan": {
      // Dashboard menu hamburger icon: rightmost icon in header
      const cx = SW - 16 - 20;
      const cy = insets.top + 8 + 20;
      return { cx, cy, radius: 28 };
    }
    case "view_transactions": {
      // "View all" Pressable — measured dynamically
      const rect = getViewAllRect();
      if (rect) {
        return {
          cx: rect.x + rect.width / 2,
          cy: rect.y + rect.height / 2,
          radius: Math.max(rect.width, rect.height) / 2 + 8,
        };
      }
      // Fallback: approximate position
      return { cx: SW - 60, cy: 420, radius: 32 };
    }
    default:
      return null;
  }
}

function buildCutoutPath(sw: number, sh: number, cx: number, cy: number, r: number): string {
  // Full-screen rect with circular hole using evenodd fill rule
  // Outer rect (clockwise)
  const outer = `M0,0 H${sw} V${sh} H0 Z`;
  // Inner circle (counter-clockwise for evenodd cutout)
  const circle = `M${cx - r},${cy} A${r},${r} 0 1,0 ${cx + r},${cy} A${r},${r} 0 1,0 ${cx - r},${cy} Z`;
  return `${outer} ${circle}`;
}

const TOOLTIP_KEYS: Record<SpotlightTarget, string> = {
  add_transaction: "spotlight.add_transaction",
  voice_input: "spotlight.voice_input",
  receipt_scan: "spotlight.receipt_scan",
  view_transactions: "spotlight.view_transactions",
};

export default function SpotlightOverlay() {
  const { t } = useTranslation();
  const [targetId, setTargetId] = useState<SpotlightTarget | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const position = useTargetPosition(targetId);

  const show = useCallback((id: SpotlightTarget) => {
    setTargetId(id);
  }, []);

  useEffect(() => {
    registerSpotlightShow(show);
    return () => unregisterSpotlightShow();
  }, [show]);

  // Pulse animation
  useEffect(() => {
    if (!targetId) return;
    pulseAnim.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [targetId, pulseAnim]);

  const handleDismiss = () => setTargetId(null);

  if (!targetId || !position) return null;

  const { width: SW, height: SH } = Dimensions.get("window");
  const { cx, cy, radius } = position;
  const tooltipAbove = cy > SH / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss}>
        <Svg width={SW} height={SH}>
          <Path
            d={buildCutoutPath(SW, SH, cx, cy, radius)}
            fill="rgba(0,0,0,0.6)"
            fillRule="evenodd"
          />
        </Svg>
      </Pressable>

      {/* Pulsing ring */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pulseRing,
          {
            left: cx - radius,
            top: cy - radius,
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Tooltip */}
      <View
        pointerEvents="none"
        style={[
          styles.tooltip,
          {
            left: Spacing.xl,
            right: Spacing.xl,
            ...(tooltipAbove
              ? { bottom: SH - cy + radius + 16 }
              : { top: cy + radius + 16 }),
          },
        ]}
      >
        <ThemedText type="bodySm" color="#ffffff" style={styles.tooltipText}>
          {t(TOOLTIP_KEYS[targetId])}
        </ThemedText>
      </View>

      {/* Got it button */}
      <View style={[styles.gotItContainer, { bottom: 40 }]}>
        <Button title={t("spotlight.got_it")} onPress={handleDismiss} />
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
  gotItContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
