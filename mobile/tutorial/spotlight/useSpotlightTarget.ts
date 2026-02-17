import { useRef, useCallback, useEffect } from "react";
import type { View } from "react-native";
import {
  registerSpotlightTarget,
  unregisterSpotlightTarget,
} from "../../lib/spotlight-ref";

export function useSpotlightTarget(id: string) {
  const ref = useRef<View>(null);

  const measure = useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        registerSpotlightTarget(id, { x, y, width, height });
      }
    });
  }, [id]);

  const onLayout = useCallback(() => {
    measure();
    // Re-measure after navigation animations settle (300-500ms typical)
    setTimeout(measure, 400);
    setTimeout(measure, 800);
  }, [measure]);

  useEffect(() => {
    // Also re-measure shortly after mount in case onLayout fired during animation
    const t = setTimeout(measure, 600);
    return () => {
      clearTimeout(t);
      unregisterSpotlightTarget(id);
    };
  }, [id, measure]);

  return { ref, onLayout };
}
