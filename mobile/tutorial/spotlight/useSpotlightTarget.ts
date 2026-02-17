import { useRef, useCallback, useEffect } from "react";
import type { View } from "react-native";
import {
  registerSpotlightTarget,
  unregisterSpotlightTarget,
} from "../../lib/spotlight-ref";

export function useSpotlightTarget(id: string) {
  const ref = useRef<View>(null);

  const onLayout = useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        registerSpotlightTarget(id, { x, y, width, height });
      }
    });
  }, [id]);

  useEffect(() => {
    return () => unregisterSpotlightTarget(id);
  }, [id]);

  return { ref, onLayout };
}
