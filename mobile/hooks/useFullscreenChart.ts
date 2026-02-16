import { useEffect } from "react";
import { Platform } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";

/**
 * Unlocks landscape orientation on mount, locks back to portrait on unmount.
 * Uses try/finally to guarantee portrait is restored even on crash/unmount race.
 * Noop on web — browser handles orientation natively.
 */
export function useFullscreenChart() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    const unlock = async () => {
      try {
        await ScreenOrientation.unlockAsync();
      } catch {
        // Ignore — screen orientation API may not be available in all environments
      }
    };

    unlock();

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);
}
