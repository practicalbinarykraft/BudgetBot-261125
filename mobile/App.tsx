import React from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "./lib/query-client";
import RootStackNavigator from "./navigation/RootStackNavigator";
import { ThemeProvider, useThemeProvider, useTheme } from "./hooks/useTheme";
import { LanguageProvider } from "./i18n";
import { ToastProvider } from "./components/Toast";

// Web: reset browser defaults that cause white strip and scrollbar
if (Platform.OS === "web" && typeof document !== "undefined") {
  const id = "bb-web-reset";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent =
      "html,body{margin:0!important;padding:0!important;overflow:hidden!important;height:100%!important;width:100%!important}" +
      "#root{height:100%;overflow:hidden}";
    document.head.appendChild(s);
  }
}

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <RootStackNavigator />
    </>
  );
}

export default function App() {
  const themeValue = useThemeProvider();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={themeValue}>
        <LanguageProvider>
          <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
              <NavigationContainer>
                <ToastProvider>
                  <AppContent />
                </ToastProvider>
              </NavigationContainer>
            </QueryClientProvider>
          </SafeAreaProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
