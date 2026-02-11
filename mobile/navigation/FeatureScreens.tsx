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
  titleKey: string;
  presentation?: "modal";
}

const screens: ScreenConfig[] = [
  { name: "Tags", component: TagsScreen, titleKey: "nav.tags" },
  { name: "TagDetail", component: TagDetailScreen, titleKey: "nav.tag_detail" },
  { name: "AddEditTag", component: AddEditTagScreen, titleKey: "nav.tag", presentation: "modal" },
  { name: "Recurring", component: RecurringScreen, titleKey: "nav.recurring" },
  { name: "AddRecurring", component: AddRecurringScreen, titleKey: "nav.add_recurring", presentation: "modal" },
  { name: "Wishlist", component: WishlistScreen, titleKey: "nav.wishlist" },
  { name: "AddWishlist", component: AddWishlistScreen, titleKey: "nav.add_wishlist_item", presentation: "modal" },
  { name: "PlannedExpenses", component: PlannedExpensesScreen, titleKey: "nav.planned_expenses" },
  { name: "AddPlannedExpense", component: AddPlannedExpenseScreen, titleKey: "nav.add_planned_expense", presentation: "modal" },
  { name: "PlannedIncome", component: PlannedIncomeScreen, titleKey: "nav.planned_income" },
  { name: "AddPlannedIncome", component: AddPlannedIncomeScreen, titleKey: "nav.add_planned_income", presentation: "modal" },
  { name: "ProductCatalog", component: ProductCatalogScreen, titleKey: "nav.product_catalog" },
  { name: "ProductDetail", component: ProductDetailScreen, titleKey: "nav.product_detail" },
  { name: "Billing", component: BillingScreen, titleKey: "nav.credits_billing" },
  { name: "Assets", component: AssetsScreen, titleKey: "nav.assets" },
  { name: "AssetDetail", component: AssetDetailScreen, titleKey: "nav.asset_detail" },
  { name: "AddEditAsset", component: AddEditAssetScreen, titleKey: "nav.add_asset", presentation: "modal" },
  { name: "Notifications", component: NotificationsScreen, titleKey: "nav.notifications" },
  { name: "SwipeSort", component: SwipeSortScreen, titleKey: "nav.swipe_sort" },
];

export function getFeatureScreens(
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
        ...(screen.presentation ? { presentation: screen.presentation } : {}),
      }}
    />
  ));
}
