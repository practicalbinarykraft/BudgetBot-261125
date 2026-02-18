import { useState, useEffect, useCallback, useRef } from "react";
import { Animated, Platform } from "react-native";
import {
  registerSpotlightFlow,
  unregisterSpotlightFlow,
  getSpotlightTargetRect,
  onSpotlightTargetChange,
} from "../../lib/spotlight-ref";
import { SPOTLIGHT_FLOWS } from "../../tutorial/spotlight/flows";
import type { SpotlightFlowStep } from "../../tutorial/spotlight/spotlight.types";
import type { LayoutRect } from "../../lib/view-all-ref";
import { roundRect } from "./cutout-paths";

export function useFlowEngine() {
  const useND = Platform.OS !== "web";

  const [flowId, setFlowId] = useState<string | null>(null);
  const [flowStepIndex, setFlowStepIndex] = useState(0);
  const [flowRect, setFlowRect] = useState<LayoutRect | null>(null);
  const navigationRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── Derived ──
  const currentStep: SpotlightFlowStep | null =
    flowId && SPOTLIGHT_FLOWS[flowId]
      ? SPOTLIGHT_FLOWS[flowId].steps[flowStepIndex] ?? null
      : null;

  // ── Actions ──
  const clearFlow = useCallback(() => {
    setFlowId(null);
    setFlowStepIndex(0);
    setFlowRect(null);
  }, []);

  const startFlow = useCallback((id: string, navigation: any) => {
    if (flowId) return;
    navigationRef.current = navigation;
    const flow = SPOTLIGHT_FLOWS[id];
    if (flow?.steps[0]?.navigateBefore && navigation) {
      navigation.navigate(flow.steps[0].navigateBefore);
    }
    setFlowId(id);
    setFlowStepIndex(0);
    setFlowRect(null);
  }, [flowId]);

  const advanceFlow = useCallback(() => {
    if (!flowId) return;
    const flow = SPOTLIGHT_FLOWS[flowId];
    if (!flow) return;
    const nextIndex = flowStepIndex + 1;
    if (nextIndex >= flow.steps.length) { clearFlow(); return; }
    const nextStep = flow.steps[nextIndex];
    if (nextStep?.navigateBefore && navigationRef.current) {
      navigationRef.current.navigate(nextStep.navigateBefore);
    }
    setFlowStepIndex(nextIndex);
    setFlowRect(null);
  }, [flowId, flowStepIndex, clearFlow]);

  const dismissFlow = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: useND }).start(clearFlow);
  }, [fadeAnim, clearFlow]);

  // ── Registration ──
  useEffect(() => {
    registerSpotlightFlow({ start: startFlow, advance: advanceFlow, dismiss: dismissFlow });
    return () => unregisterSpotlightFlow();
  }, [startFlow, advanceFlow, dismissFlow]);

  // ── Resolve target rect ──
  useEffect(() => {
    if (!currentStep) return;
    const targetId = currentStep.targetId;
    let cancelled = false;
    const SETTLE_MS = 500;

    const settleTimer = setTimeout(() => {
      if (cancelled) return;

      const resolve = (rect: LayoutRect) => {
        if (!cancelled) {
          setFlowRect(roundRect(rect));
          cancelled = true;
          clearInterval(pollId);
          unsub?.();
        }
      };

      const immediate = getSpotlightTargetRect(targetId);
      if (immediate) { resolve(immediate); return; }

      let unsub: (() => void) | undefined;
      unsub = onSpotlightTargetChange((changedId) => {
        if (changedId === targetId && !cancelled) {
          const r = getSpotlightTargetRect(targetId);
          if (r) resolve(r);
        }
      });

      const pollId = setInterval(() => {
        if (cancelled) return;
        const r = getSpotlightTargetRect(targetId);
        if (r) resolve(r);
      }, 100);

      setTimeout(() => {
        if (!cancelled) {
          cancelled = true;
          clearInterval(pollId);
          unsub?.();
          // Auto-skip: target not found within timeout → advance to next step
          advanceFlow();
        }
      }, 3000);
    }, SETTLE_MS);

    return () => { cancelled = true; clearTimeout(settleTimer); };
  }, [currentStep, advanceFlow]);

  // ── Tap handlers ──
  const handleFlowTap = useCallback(() => {
    if (!currentStep) return;
    if (currentStep.autoAdvanceMs || currentStep.choices) return;
    if (currentStep.navigateTo && navigationRef.current) {
      navigationRef.current.navigate(currentStep.navigateTo);
    }
    advanceFlow();
  }, [currentStep, advanceFlow]);

  const handleChoiceTap = useCallback((choiceIndex: number) => {
    if (!currentStep?.choices) return;
    const choice = currentStep.choices[choiceIndex];
    if (!choice) return;
    if (choice.endFlow) {
      clearFlow();
      if (choice.navigateTo && navigationRef.current) {
        navigationRef.current.navigate(choice.navigateTo);
      }
    } else {
      if (choice.navigateTo && navigationRef.current) {
        navigationRef.current.navigate(choice.navigateTo);
      }
      advanceFlow();
    }
  }, [currentStep, advanceFlow, clearFlow]);

  return {
    flowId,
    currentStep,
    flowRect,
    fadeAnim,
    handleFlowTap,
    handleChoiceTap,
    advanceFlow,
    dismissFlow,
  };
}
