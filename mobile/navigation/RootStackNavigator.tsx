import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import AuthStackNavigator from "./AuthStackNavigator";
import MainTabNavigator from "./MainTabNavigator";
import TutorialDialog from "../components/TutorialDialog";
import RewardModal from "../components/RewardModal";
import SpotlightOverlay from "../components/SpotlightOverlay";
import WebSocketProvider from "../components/WebSocketProvider";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { getTransactionScreens } from "./TransactionScreens";
import { getFeatureScreens } from "./FeatureScreens";
import { getAnalyticsScreens } from "./AnalyticsScreens";
import { queryClient, categoriesQueryKey } from "../lib/query-client";
import { api } from "../lib/api-client";
import type { Category, Transaction, PersonalTag, Wallet, PaginatedResponse } from "../types";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  AddTransaction: { prefill?: { amount?: string; description?: string; type?: "expense" | "income"; currency?: string; category?: string; tutorialSource?: "voice" | "receipt" }; selectedCategoryId?: number } | undefined;
  CategoryPicker: { type: "expense" | "income" };
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
  Referral: undefined;
  FullscreenChart: { historyDays?: 7 | 30 | 90 | 365; showForecast?: boolean } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user, isLoading, isAuthenticated, login, register, logout } =
    useAuth();

  // Prefetch core data as soon as user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      queryClient.prefetchQuery({
        queryKey: categoriesQueryKey(),
        queryFn: () => api.get<PaginatedResponse<Category>>("/api/categories?limit=100"),
      });
      queryClient.prefetchQuery({
        queryKey: ["wallets"],
        queryFn: () => api.get<PaginatedResponse<Wallet>>("/api/wallets?limit=50"),
      });
      queryClient.prefetchQuery({
        queryKey: ["tags"],
        queryFn: () => api.get<PaginatedResponse<PersonalTag>>("/api/tags"),
      });
    }
  }, [isAuthenticated]);

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
      <TutorialDialog userId={user?.id} />
      <RewardModal />
      <Stack.Navigator screenOptions={{
        headerShown: false,
        headerBackTitle: t("common.back"),
        headerShadowVisible: false,
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
      <SpotlightOverlay />
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
