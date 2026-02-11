import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "./lib/query-client";
import RootStackNavigator from "./navigation/RootStackNavigator";
import { ThemeProvider, useThemeProvider, useTheme } from "./hooks/useTheme";
import { LanguageProvider } from "./i18n";

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
                <AppContent />
              </NavigationContainer>
            </QueryClientProvider>
          </SafeAreaProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
