import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Pressable,
  Platform,
} from "react-native";
import { FullWindowOverlay } from "react-native-screens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";

type ToastType = "success" | "error" | "info";

interface ToastState {
  message: string;
  type: ToastType;
  id: number;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 3000;
const ERROR_DISMISS_MS = 5000;

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setToast(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = "info") => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const id = ++idRef.current;
      setToast({ message, type, id });
      const delay = type === "error" ? ERROR_DISMISS_MS : AUTO_DISMISS_MS;
      timerRef.current = setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, delay);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const toastElement = toast ? <ToastView toast={toast} onDismiss={dismiss} /> : null;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toastElement && Platform.OS === "ios" ? (
        <FullWindowOverlay>{toastElement}</FullWindowOverlay>
      ) : (
        toastElement
      )}
    </ToastContext.Provider>
  );
}

const ICON_MAP: Record<ToastType, keyof typeof Feather.glyphMap> = {
  success: "check-circle",
  error: "alert-circle",
  info: "info",
};

function ToastView({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy < -5,
      onPanResponderRelease: (_, g) => {
        if (g.dy < -20) onDismiss();
      },
    }),
  ).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: Platform.OS !== "web",
      tension: 80,
      friction: 10,
    }).start();
  }, [toast.id]);

  const bgColor =
    toast.type === "error"
      ? theme.destructive
      : toast.type === "success"
        ? theme.success
        : theme.primary;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          top: insets.top + 8,
          backgroundColor: bgColor,
          transform: [{ translateY }],
        },
      ]}
    >
      <Feather name={ICON_MAP[toast.type]} size={16} color="#fff" />
      <Text style={styles.message}>{toast.message}</Text>
      <Pressable onPress={onDismiss} hitSlop={8}>
        <Feather name="x" size={14} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 10,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  message: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
