import React from "react";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import DashboardAnalyticsScreen from "../screens/DashboardAnalyticsScreen";
import ExpensesAnalyticsScreen from "../screens/ExpensesAnalyticsScreen";
import AIAnalysisScreen from "../screens/AIAnalysisScreen";
import AdvancedAnalyticsScreen from "../screens/AdvancedAnalyticsScreen";
import AIChatScreen from "../screens/AIChatScreen";
import ReceiptScannerScreen from "../screens/ReceiptScannerScreen";
import VoiceInputScreen from "../screens/VoiceInputScreen";

interface ScreenConfig {
  name: string;
  component: React.ComponentType<any>;
  titleKey: string;
}

const screens: ScreenConfig[] = [
  { name: "DashboardAnalytics", component: DashboardAnalyticsScreen, titleKey: "nav.dashboard" },
  { name: "ExpensesAnalytics", component: ExpensesAnalyticsScreen, titleKey: "nav.expense_analytics" },
  { name: "AIAnalysis", component: AIAnalysisScreen, titleKey: "nav.ai_analysis" },
  { name: "AdvancedAnalytics", component: AdvancedAnalyticsScreen, titleKey: "nav.advanced_analytics" },
  { name: "AIChat", component: AIChatScreen, titleKey: "nav.ai_chat" },
  { name: "ReceiptScanner", component: ReceiptScannerScreen, titleKey: "nav.receipt_scanner" },
  { name: "VoiceInput", component: VoiceInputScreen, titleKey: "nav.voice_input" },
];

export function getAnalyticsScreens(
  Stack: any,
  headerStyle: NativeStackNavigationOptions["headerStyle"],
  headerTintColor: string,
  t: (key: string) => string,
) {
  return screens.map((screen) => (
    <Stack.Screen
      key={screen.name}
      name={screen.name}
      component={screen.component}
      options={{
        headerShown: true,
        title: t(screen.titleKey),
        headerStyle,
        headerTintColor,
      }}
    />
  ));
}
