/**
 * Cross-platform view measurement helper.
 * Native: uses measureInWindow (viewport coords).
 * Web: uses measure() (RNW supports it), with getBoundingClientRect fallback.
 */
import { Platform } from "react-native";
import type { View } from "react-native";

export interface ViewRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Measure a View ref's position relative to the viewport.
 * Returns null if measurement fails or ref is null.
 */
export function measureView(ref: React.RefObject<View | null>): Promise<ViewRect | null> {
  return new Promise((resolve) => {
    if (!ref.current) {
      resolve(null);
      return;
    }

    if (Platform.OS === "web") {
      measureWeb(ref.current, resolve);
    } else {
      measureNative(ref.current, resolve);
    }
  });
}

function measureNative(node: View, resolve: (r: ViewRect | null) => void) {
  try {
    node.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0) {
        resolve(null);
      } else {
        resolve({ x, y, width, height });
      }
    });
  } catch {
    resolve(null);
  }
}

function measureWeb(node: View, resolve: (r: ViewRect | null) => void) {
  // RNW supports measure() which gives (x, y, width, height, pageX, pageY)
  if (typeof (node as any).measure === "function") {
    try {
      (node as any).measure(
        (_x: number, _y: number, width: number, height: number, pageX: number, pageY: number) => {
          if (width === 0 && height === 0) {
            resolve(null);
          } else {
            resolve({ x: pageX, y: pageY, width, height });
          }
        },
      );
      return;
    } catch {
      // fall through to getBoundingClientRect
    }
  }

  // Fallback: try DOM getBoundingClientRect
  try {
    const el = node as unknown as HTMLElement;
    if (typeof el.getBoundingClientRect === "function") {
      const rect = el.getBoundingClientRect();
      resolve({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
    } else {
      resolve(null);
    }
  } catch {
    resolve(null);
  }
}
