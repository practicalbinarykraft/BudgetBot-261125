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
  title: string;
}

const screens: ScreenConfig[] = [
  { name: "DashboardAnalytics", component: DashboardAnalyticsScreen, title: "Dashboard" },
  { name: "ExpensesAnalytics", component: ExpensesAnalyticsScreen, title: "Expense Analytics" },
  { name: "AIAnalysis", component: AIAnalysisScreen, title: "AI Analysis" },
  { name: "AdvancedAnalytics", component: AdvancedAnalyticsScreen, title: "Advanced Analytics" },
  { name: "AIChat", component: AIChatScreen, title: "AI Chat" },
  { name: "ReceiptScanner", component: ReceiptScannerScreen, title: "Receipt Scanner" },
  { name: "VoiceInput", component: VoiceInputScreen, title: "Voice Input" },
];

export function getAnalyticsScreens(
  Stack: any,
  headerStyle: NativeStackNavigationOptions["headerStyle"],
  headerTintColor: string,
) {
  return screens.map((screen) => (
    <Stack.Screen
      key={screen.name}
      name={screen.name}
      component={screen.component}
      options={{
        headerShown: true,
        title: screen.title,
        headerStyle,
        headerTintColor,
      }}
    />
  ));
}
