import React, { useEffect, useRef } from "react";
import { View, Pressable, Dimensions, Animated, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { ThemedText } from "../ThemedText";
import { Spacing } from "../../constants/theme";
import { useTranslation } from "../../i18n";
import {
  CUTOUT_PADDING, CUTOUT_RADIUS, STROKE_WIDTH, ACCENT,
  buildRoundedRectCutoutPath,
} from "./cutout-paths";
import { useFlowEngine } from "./useFlowEngine";

export default function FlowSpotlight() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const useND = Platform.OS !== "web";

  const {
    flowId, currentStep, flowRect, fadeAnim,
    handleFlowTap, handleChoiceTap, advanceFlow, dismissFlow,
  } = useFlowEngine();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;

  // ── Pulse animation ──
  useEffect(() => {
    if (!flowRect) return;
    pulseAnim.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: useND }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: useND }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flowRect, pulseAnim]);

  // ── Fade in ──
  useEffect(() => {
    if (flowRect) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: useND }).start();
    }
  }, [flowRect, fadeAnim]);

  // ── Arrow bounce ──
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

  // ── Auto-advance ──
  useEffect(() => {
    if (!currentStep?.autoAdvanceMs || !flowRect) return;
    const timer = setTimeout(advanceFlow, currentStep.autoAdvanceMs);
    return () => clearTimeout(timer);
  }, [currentStep, flowRect, advanceFlow]);

  if (!flowId || !currentStep || !flowRect) return null;

  const { width: SW, height: SH } = Dimensions.get("window");
  const tooltipAbove = flowRect.y + flowRect.height / 2 > SH / 2;

  const bx = flowRect.x - CUTOUT_PADDING;
  const by = flowRect.y - CUTOUT_PADDING;
  const bw = flowRect.width + CUTOUT_PADDING * 2;
  const bh = flowRect.height + CUTOUT_PADDING * 2;

  const arrowCenterX = Math.min(Math.max(flowRect.x + flowRect.width / 2, 20), SW - 20);
  const arrowTop = tooltipAbove ? by - 24 : by + bh + 4;

  const tooltipMargin = 32;
  const tooltipTop = tooltipAbove
    ? undefined
    : Math.min(by + bh + tooltipMargin, SH - insets.bottom - 60);
  const tooltipBottom = tooltipAbove
    ? Math.min(SH - by + tooltipMargin, SH - insets.top - 60)
    : undefined;

  const hasChoices = !!currentStep.choices?.length;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={handleFlowTap}>
        <Svg width={SW} height={SH}>
          <Path d={buildRoundedRectCutoutPath(SW, SH, flowRect)} fill="rgba(0,0,0,0.65)" fillRule="evenodd" />
          <Rect x={bx} y={by} width={bw} height={bh} rx={CUTOUT_RADIUS} ry={CUTOUT_RADIUS}
            fill="none" stroke={ACCENT} strokeWidth={STROKE_WIDTH} />
        </Svg>
      </Pressable>

      <Animated.View pointerEvents="none" style={[styles.pulseRing, {
        left: bx - 3, top: by - 3, width: bw + 6, height: bh + 6,
        borderRadius: CUTOUT_RADIUS + 3, transform: [{ scale: pulseAnim }],
      }]} />

      <Animated.View pointerEvents="none" style={[styles.arrow, {
        left: arrowCenterX - 10, top: arrowTop, transform: [{ translateY: arrowAnim }],
      }]}>
        <ThemedText type="body" color={ACCENT} style={styles.arrowText}>
          {tooltipAbove ? "\u25BC" : "\u25B2"}
        </ThemedText>
      </Animated.View>

      <View
        pointerEvents={hasChoices ? "auto" : "none"}
        style={[styles.tooltip, styles.flowTooltip, {
          left: Spacing.xl, right: Spacing.xl,
          ...(tooltipBottom !== undefined ? { bottom: tooltipBottom } : { top: tooltipTop }),
        }]}
      >
        <ThemedText type="bodySm" color="#ffffff" style={styles.tooltipText}>
          {t(currentStep.tooltipKey)}
        </ThemedText>
        {hasChoices && (
          <View style={styles.choiceContainer}>
            {currentStep.choices!.map((choice, idx) => (
              <Pressable key={idx} onPress={() => handleChoiceTap(idx)}
                style={[styles.choiceButton, idx === 0 ? styles.choicePrimary : styles.choiceSecondary]}>
                <ThemedText type="bodySm" color={idx === 0 ? "#ffffff" : "#ffffffcc"} style={styles.choiceLabel}>
                  {t(choice.labelKey)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        )}
      </View>

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

const styles = StyleSheet.create({
  pulseRing: { position: "absolute", borderWidth: 2, borderColor: "#3b82f650" },
  arrow: { position: "absolute", width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  arrowText: { fontSize: 16, fontWeight: "700" },
  tooltip: { position: "absolute", alignItems: "center" },
  flowTooltip: {
    backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 16, alignSelf: "center",
  },
  tooltipText: {
    fontWeight: "600", textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  choiceContainer: { flexDirection: "row", gap: 8, marginTop: 10, justifyContent: "center" },
  choiceButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  choicePrimary: { backgroundColor: "#3b82f6" },
  choiceSecondary: { backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  choiceLabel: { fontWeight: "600", textAlign: "center" },
  skipContainer: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  skipButton: { paddingVertical: 8, paddingHorizontal: 24 },
  skipText: { fontWeight: "500", textDecorationLine: "underline" },
});
