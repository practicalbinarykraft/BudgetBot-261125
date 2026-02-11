import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../constants/theme";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: typeof Colors.light;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = "theme-mode";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ThemeContext.Provider;

export function useThemeProvider(): ThemeContextValue {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setModeState(stored);
      }
      setLoaded(true);
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
  };

  const isDark =
    mode === "system" ? systemScheme === "dark" : mode === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  return { theme, isDark, mode, setMode };
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  const systemScheme = useColorScheme();

  if (ctx) return ctx;

  const isDark = systemScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  return { theme, isDark, mode: "system", setMode: () => {} };
}
