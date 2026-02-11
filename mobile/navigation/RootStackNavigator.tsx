import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import AuthStackNavigator from "./AuthStackNavigator";
import MainTabNavigator from "./MainTabNavigator";
import OnboardingDialog from "../components/OnboardingDialog";
import WebSocketProvider from "../components/WebSocketProvider";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { getTransactionScreens } from "./TransactionScreens";
import { getFeatureScreens } from "./FeatureScreens";
import { getAnalyticsScreens } from "./AnalyticsScreens";
import type { Category, Transaction, PersonalTag } from "../types";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  AddTransaction: undefined;
  EditTransaction: { transaction: Transaction };
  AddEditCategory: { category?: Category };
  AddEditBudget: {
    budget?: {
      id: number;
      categoryId: number;
      limitAmount: string;
      period: string;
      periodStart: string;
    };
  };
  AddWallet: undefined;
  Calibration: undefined;
  Tags: undefined;
  TagDetail: { tagId: number };
  AddEditTag: { tag?: PersonalTag };
  Recurring: undefined;
  AddRecurring: undefined;
  Wishlist: undefined;
  AddWishlist: undefined;
  PlannedExpenses: undefined;
  AddPlannedExpense: undefined;
  PlannedIncome: undefined;
  AddPlannedIncome: undefined;
  CurrencyHistory: undefined;
  ExpensesAnalytics: undefined;
  ProductCatalog: undefined;
  ProductDetail: { productId: number };
  Billing: undefined;
  Assets: undefined;
  AssetDetail: { assetId: number };
  AddEditAsset: { type?: string };
  Wallets: undefined;
  DashboardAnalytics: undefined;
  AIAnalysis: undefined;
  AdvancedAnalytics: undefined;
  AIChat: undefined;
  ReceiptScanner: undefined;
  VoiceInput: undefined;
  Notifications: undefined;
  SwipeSort: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user, isLoading, isAuthenticated, login, register, logout } =
    useAuth();

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const headerStyle = { backgroundColor: theme.card };
  const headerTintColor = theme.text;

  return (
    <WebSocketProvider userId={user?.id}>
      <OnboardingDialog userId={user?.id} />
      <Stack.Navigator screenOptions={{
        headerShown: false,
        headerBackTitle: t("common.back"),
      }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" options={{ headerBackTitle: t("common.back") }}>
              {() => <MainTabNavigator user={user} onLogout={logout} />}
            </Stack.Screen>
            {getTransactionScreens(Stack, headerStyle, headerTintColor, t)}
            {getFeatureScreens(Stack, headerStyle, headerTintColor, t)}
            {getAnalyticsScreens(Stack, headerStyle, headerTintColor, t)}
          </>
        ) : (
          <Stack.Screen name="Auth">
            {() => (
              <AuthStackNavigator onLogin={login} onRegister={register} />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </WebSocketProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
