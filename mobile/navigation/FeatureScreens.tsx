import React from "react";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import TagsScreen from "../screens/TagsScreen";
import TagDetailScreen from "../screens/TagDetailScreen";
import AddEditTagScreen from "../screens/AddEditTagScreen";
import RecurringScreen from "../screens/RecurringScreen";
import AddRecurringScreen from "../screens/AddRecurringScreen";
import WishlistScreen from "../screens/WishlistScreen";
import AddWishlistScreen from "../screens/AddWishlistScreen";
import PlannedExpensesScreen from "../screens/PlannedExpensesScreen";
import AddPlannedExpenseScreen from "../screens/AddPlannedExpenseScreen";
import PlannedIncomeScreen from "../screens/PlannedIncomeScreen";
import AddPlannedIncomeScreen from "../screens/AddPlannedIncomeScreen";
import ProductCatalogScreen from "../screens/ProductCatalogScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import BillingScreen from "../screens/BillingScreen";
import AssetsScreen from "../screens/AssetsScreen";
import AssetDetailScreen from "../screens/AssetDetailScreen";
import AddEditAssetScreen from "../screens/AddEditAssetScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import SwipeSortScreen from "../screens/SwipeSortScreen";

interface ScreenConfig {
  name: string;
  component: React.ComponentType<any>;
  title: string;
  presentation?: "modal";
}

const screens: ScreenConfig[] = [
  { name: "Tags", component: TagsScreen, title: "Tags" },
  { name: "TagDetail", component: TagDetailScreen, title: "Tag Detail" },
  { name: "AddEditTag", component: AddEditTagScreen, title: "Tag", presentation: "modal" },
  { name: "Recurring", component: RecurringScreen, title: "Recurring" },
  { name: "AddRecurring", component: AddRecurringScreen, title: "Add Recurring", presentation: "modal" },
  { name: "Wishlist", component: WishlistScreen, title: "Wishlist" },
  { name: "AddWishlist", component: AddWishlistScreen, title: "Add Wishlist Item", presentation: "modal" },
  { name: "PlannedExpenses", component: PlannedExpensesScreen, title: "Planned Expenses" },
  { name: "AddPlannedExpense", component: AddPlannedExpenseScreen, title: "Add Planned Expense", presentation: "modal" },
  { name: "PlannedIncome", component: PlannedIncomeScreen, title: "Planned Income" },
  { name: "AddPlannedIncome", component: AddPlannedIncomeScreen, title: "Add Planned Income", presentation: "modal" },
  { name: "ProductCatalog", component: ProductCatalogScreen, title: "Product Catalog" },
  { name: "ProductDetail", component: ProductDetailScreen, title: "Product Detail" },
  { name: "Billing", component: BillingScreen, title: "Credits & Billing" },
  { name: "Assets", component: AssetsScreen, title: "Assets" },
  { name: "AssetDetail", component: AssetDetailScreen, title: "Asset Detail" },
  { name: "AddEditAsset", component: AddEditAssetScreen, title: "Add Asset", presentation: "modal" },
  { name: "Notifications", component: NotificationsScreen, title: "Notifications" },
  { name: "SwipeSort", component: SwipeSortScreen, title: "Swipe Sort" },
];

export function getFeatureScreens(
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
        ...(screen.presentation ? { presentation: screen.presentation } : {}),
      }}
    />
  ));
}
