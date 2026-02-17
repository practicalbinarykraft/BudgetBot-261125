import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Pressable, Dimensions, Animated, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { Button } from "./Button";
import { ThemedText } from "./ThemedText";
import { Spacing } from "../constants/theme";
import { useTranslation } from "../i18n";
import {
  registerSpotlightShow,
  unregisterSpotlightShow,
  registerSpotlightFlow,
  unregisterSpotlightFlow,
  getSpotlightTargetRect,
  onSpotlightTargetChange,
  type SpotlightTarget,
} from "../lib/spotlight-ref";
import { getViewAllRect } from "../lib/view-all-ref";
import { SPOTLIGHT_FLOWS } from "../tutorial/spotlight/flows";
import type { SpotlightFlowStep } from "../tutorial/spotlight/spotlight.types";
import type { LayoutRect } from "../lib/view-all-ref";

// ─── Legacy helpers (unchanged) ─────────────────────────────────────

interface TargetPosition {
  cx: number;
  cy: number;
  radius: number;
}

function useLegacyTargetPosition(targetId: SpotlightTarget | null): TargetPosition | null {
  const insets = useSafeAreaInsets();
  if (!targetId) return null;

  const { width: SW, height: SH } = Dimensions.get("window");

  switch (targetId) {
    case "add_transaction": {
      const cx = SW / 2 - 80 + 56 + 24;
      const cy = SH - insets.bottom - 8 - 24;
      return { cx, cy, radius: 32 };
    }
    case "voice_input": {
      const cx = SW / 2 - 80 + 48 + 32;
      const cy = SH - insets.bottom - 8 - 160 + 32;
      return { cx, cy, radius: 40 };
    }
    case "receipt_scan": {
      const cx = SW - 16 - 20;
      const cy = insets.top + 8 + 20;
      return { cx, cy, radius: 28 };
    }
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

function buildCircleCutoutPath(sw: number, sh: number, cx: number, cy: number, r: number): string {
  const outer = `M0,0 H${sw} V${sh} H0 Z`;
  const circle = `M${cx - r},${cy} A${r},${r} 0 1,0 ${cx + r},${cy} A${r},${r} 0 1,0 ${cx - r},${cy} Z`;
  return `${outer} ${circle}`;
}

const LEGACY_TOOLTIP_KEYS: Record<SpotlightTarget, string> = {
  add_transaction: "spotlight.add_transaction",
  voice_input: "spotlight.voice_input",
  receipt_scan: "spotlight.receipt_scan",
  view_transactions: "spotlight.view_transactions",
};

// ─── Flow helpers ───────────────────────────────────────────────────

const CUTOUT_PADDING = 10;
const CUTOUT_RADIUS = 14;
const STROKE_WIDTH = 2.5;
const ACCENT = "#3b82f6";

function roundRect(rect: LayoutRect): LayoutRect {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

function buildRoundedRectCutoutPath(
  sw: number,
  sh: number,
  rect: LayoutRect,
): string {
  const x = rect.x - CUTOUT_PADDING;
  const y = rect.y - CUTOUT_PADDING;
  const w = rect.width + CUTOUT_PADDING * 2;
  const h = rect.height + CUTOUT_PADDING * 2;
  const r = CUTOUT_RADIUS;

  const outer = `M0,0 H${sw} V${sh} H0 Z`;
  const inner =
    `M${x + r},${y}` +
    ` H${x + w - r}` +
    ` Q${x + w},${y} ${x + w},${y + r}` +
    ` V${y + h - r}` +
    ` Q${x + w},${y + h} ${x + w - r},${y + h}` +
    ` H${x + r}` +
    ` Q${x},${y + h} ${x},${y + h - r}` +
    ` V${y + r}` +
    ` Q${x},${y} ${x + r},${y}` +
    ` Z`;

  return `${outer} ${inner}`;
}

// ─── Component ──────────────────────────────────────────────────────

export default function SpotlightOverlay() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const useND = Platform.OS !== "web";

  // ── Legacy state ──
  const [legacyTargetId, setLegacyTargetId] = useState<SpotlightTarget | null>(null);
  const legacyPosition = useLegacyTargetPosition(legacyTargetId);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Flow state ──
  const [flowId, setFlowId] = useState<string | null>(null);
  const [flowStepIndex, setFlowStepIndex] = useState(0);
  const [flowRect, setFlowRect] = useState<LayoutRect | null>(null);
  const navigationRef = useRef<any>(null);
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── Legacy registration ──
  const showLegacy = useCallback((id: SpotlightTarget) => {
    setLegacyTargetId(id);
  }, []);

  useEffect(() => {
    registerSpotlightShow(showLegacy);
    return () => unregisterSpotlightShow();
  }, [showLegacy]);

  // ── Pulse animation (shared by legacy + flow) ──
  useEffect(() => {
    if (!legacyTargetId && !flowRect) return;
    pulseAnim.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: useND }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: useND }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [legacyTargetId, flowRect, pulseAnim]);

  const handleLegacyDismiss = () => setLegacyTargetId(null);

  // ── Flow registration ──
  const startFlow = useCallback((id: string, navigation: any) => {
    if (flowId) return;
    navigationRef.current = navigation;
    setFlowId(id);
    setFlowStepIndex(0);
    setFlowRect(null);
  }, [flowId]);

  const advanceFlow = useCallback(() => {
    if (!flowId) return;
    const flow = SPOTLIGHT_FLOWS[flowId];
    if (!flow) return;
    const nextIndex = flowStepIndex + 1;
    if (nextIndex >= flow.steps.length) {
      setFlowId(null);
      setFlowStepIndex(0);
      setFlowRect(null);
      return;
    }
    setFlowStepIndex(nextIndex);
    setFlowRect(null);
  }, [flowId, flowStepIndex]);

  const dismissFlow = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: useND }).start(() => {
      setFlowId(null);
      setFlowStepIndex(0);
      setFlowRect(null);
    });
  }, [fadeAnim]);

  useEffect(() => {
    registerSpotlightFlow({ start: startFlow, advance: advanceFlow, dismiss: dismissFlow });
    return () => unregisterSpotlightFlow();
  }, [startFlow, advanceFlow, dismissFlow]);

  // ── Flow: resolve current step & poll for rect ──
  const currentFlowStep: SpotlightFlowStep | null =
    flowId && SPOTLIGHT_FLOWS[flowId]
      ? SPOTLIGHT_FLOWS[flowId].steps[flowStepIndex] ?? null
      : null;

  useEffect(() => {
    if (!currentFlowStep) return;

    const targetId = currentFlowStep.targetId;

    const tryResolve = (rect: LayoutRect) => {
      setFlowRect(roundRect(rect));
    };

    const immediate = getSpotlightTargetRect(targetId);
    if (immediate) {
      tryResolve(immediate);
      return;
    }

    let cancelled = false;

    const unsubscribe = onSpotlightTargetChange((changedId) => {
      if (changedId === targetId && !cancelled) {
        const rect = getSpotlightTargetRect(targetId);
        if (rect) {
          tryResolve(rect);
          cancelled = true;
          clearInterval(intervalId);
          unsubscribe();
        }
      }
    });

    const intervalId = setInterval(() => {
      if (cancelled) return;
      const rect = getSpotlightTargetRect(targetId);
      if (rect) {
        tryResolve(rect);
        cancelled = true;
        clearInterval(intervalId);
        unsubscribe();
      }
    }, 100);

    const timeoutId = setTimeout(() => {
      cancelled = true;
      clearInterval(intervalId);
      unsubscribe();
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [currentFlowStep]);

  // ── Flow: fade in when rect appears ──
  useEffect(() => {
    if (flowRect) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: useND }).start();
    }
  }, [flowRect, fadeAnim]);

  // ── Flow: arrow bounce ──
  useEffect(() => {
    if (!flowRect) return;
    arrowAnim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, { toValue: -6, duration: 300, useNativeDriver: useND }),
        Animated.timing(arrowAnim, { toValue: 0, duration: 300, useNativeDriver: useND }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flowRect, arrowAnim]);

  // ── Flow: auto-advance ──
  useEffect(() => {
    if (!currentFlowStep?.autoAdvanceMs || !flowRect) return;
    const timer = setTimeout(() => {
      advanceFlow();
    }, currentFlowStep.autoAdvanceMs);
    return () => clearTimeout(timer);
  }, [currentFlowStep, flowRect, advanceFlow]);

  // ── Flow: tap handler ──
  const handleFlowTap = useCallback(() => {
    if (!currentFlowStep) return;
    if (currentFlowStep.autoAdvanceMs) return;
    if (currentFlowStep.navigateTo && navigationRef.current) {
      navigationRef.current.navigate(currentFlowStep.navigateTo);
    }
    advanceFlow();
  }, [currentFlowStep, advanceFlow]);

  // ─── Render: Flow mode ────────────────────────────────────────────
  if (flowId && currentFlowStep && flowRect) {
    const { width: SW, height: SH } = Dimensions.get("window");
    const tooltipAbove = flowRect.y + flowRect.height / 2 > SH / 2;

    // Border rect (padded around target)
    const bx = flowRect.x - CUTOUT_PADDING;
    const by = flowRect.y - CUTOUT_PADDING;
    const bw = flowRect.width + CUTOUT_PADDING * 2;
    const bh = flowRect.height + CUTOUT_PADDING * 2;

    // Arrow position — clamped to screen
    const arrowCenterX = Math.min(Math.max(flowRect.x + flowRect.width / 2, 20), SW - 20);
    const arrowTop = tooltipAbove
      ? by - 24
      : by + bh + 4;

    // Tooltip Y — clamped with safe area
    const tooltipMargin = 32;
    const tooltipTop = tooltipAbove
      ? undefined
      : Math.min(by + bh + tooltipMargin, SH - insets.bottom - 60);
    const tooltipBottom = tooltipAbove
      ? Math.min(SH - by + tooltipMargin, SH - insets.top - 60)
      : undefined;

    return (
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]} pointerEvents="box-none">
        {/* Dark overlay with rounded-rect cutout + blue stroke */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleFlowTap}>
          <Svg width={SW} height={SH}>
            <Path
              d={buildRoundedRectCutoutPath(SW, SH, flowRect)}
              fill="rgba(0,0,0,0.65)"
              fillRule="evenodd"
            />
            <Rect
              x={bx}
              y={by}
              width={bw}
              height={bh}
              rx={CUTOUT_RADIUS}
              ry={CUTOUT_RADIUS}
              fill="none"
              stroke={ACCENT}
              strokeWidth={STROKE_WIDTH}
            />
          </Svg>
        </Pressable>

        {/* Pulsing glow ring */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flowPulseRing,
            {
              left: bx - 3,
              top: by - 3,
              width: bw + 6,
              height: bh + 6,
              borderRadius: CUTOUT_RADIUS + 3,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* Bouncing arrow */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.arrow,
            {
              left: arrowCenterX - 10,
              top: arrowTop,
              transform: [{ translateY: arrowAnim }],
            },
          ]}
        >
          <ThemedText type="body" color={ACCENT} style={styles.arrowText}>
            {tooltipAbove ? "\u25BC" : "\u25B2"}
          </ThemedText>
        </Animated.View>

        {/* Tooltip */}
        <View
          pointerEvents="none"
          style={[
            styles.tooltip,
            styles.flowTooltip,
            {
              left: Spacing.xl,
              right: Spacing.xl,
              ...(tooltipBottom !== undefined
                ? { bottom: tooltipBottom }
                : { top: tooltipTop }),
            },
          ]}
        >
          <ThemedText type="bodySm" color="#ffffff" style={styles.tooltipText}>
            {t(currentFlowStep.tooltipKey)}
          </ThemedText>
        </View>

        {/* Skip button */}
        <View style={[styles.skipContainer, { bottom: Math.max(insets.bottom, 16) + 16 }]}>
          <Pressable onPress={dismissFlow} style={styles.skipButton}>
            <ThemedText type="bodySm" color="#ffffffaa" style={styles.skipText}>
              {t("spotlight.skip_flow")}
            </ThemedText>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  // ─── Render: Legacy mode ──────────────────────────────────────────
  if (!legacyTargetId || !legacyPosition) return null;

  const { width: SW, height: SH } = Dimensions.get("window");
  const { cx, cy, radius } = legacyPosition;
  const tooltipAbove = cy > SH / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={handleLegacyDismiss}>
        <Svg width={SW} height={SH}>
          <Path
            d={buildCircleCutoutPath(SW, SH, cx, cy, radius)}
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
          {t(LEGACY_TOOLTIP_KEYS[legacyTargetId])}
        </ThemedText>
      </View>

      {/* Got it button */}
      <View style={[styles.gotItContainer, { bottom: 40 }]}>
        <Button title={t("spotlight.got_it")} onPress={handleLegacyDismiss} />
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
  flowTooltip: {
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "center",
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
  arrow: {
    position: "absolute",
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontSize: 16,
    fontWeight: "700",
  },
  flowPulseRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#3b82f650",
  },
  skipContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  skipText: {
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
