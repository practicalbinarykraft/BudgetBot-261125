import { useEffect } from "react";
import * as ScreenOrientation from "expo-screen-orientation";

/**
 * Unlocks landscape orientation on mount, locks back to portrait on unmount.
 * Uses try/finally to guarantee portrait is restored even on crash/unmount race.
 */
export function useFullscreenChart() {
  useEffect(() => {
    let mounted = true;

    const unlock = async () => {
      try {
        await ScreenOrientation.unlockAsync();
      } catch {
        // Ignore — screen orientation API may not be available in all environments
      }
    };

    unlock();

    return () => {
      mounted = false;
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);
}
