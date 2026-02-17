import React from "react";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import AddTransactionScreen from "../screens/AddTransactionScreen";
import EditTransactionScreen from "../screens/EditTransactionScreen";
import AddEditCategoryScreen from "../screens/AddEditCategoryScreen";
import CategoryPickerScreen from "../screens/CategoryPickerScreen";
import AddEditBudgetScreen from "../screens/AddEditBudgetScreen";
import AddWalletScreen from "../screens/AddWalletScreen";
import CalibrationScreen from "../screens/CalibrationScreen";
import WalletsScreen from "../screens/WalletsScreen";
import CurrencyHistoryScreen from "../screens/CurrencyHistoryScreen";

interface ScreenConfig {
  name: string;
  component: React.ComponentType<any>;
  titleKey: string;
  presentation?: "modal";
}

const screens: ScreenConfig[] = [
  { name: "AddTransaction", component: AddTransactionScreen, titleKey: "nav.add_transaction", presentation: "modal" },
  { name: "EditTransaction", component: EditTransactionScreen, titleKey: "nav.edit_transaction", presentation: "modal" },
  { name: "AddEditCategory", component: AddEditCategoryScreen, titleKey: "nav.category", presentation: "modal" },
  { name: "CategoryPicker", component: CategoryPickerScreen, titleKey: "category_picker.title", presentation: "modal" },
  { name: "AddEditBudget", component: AddEditBudgetScreen, titleKey: "nav.budget", presentation: "modal" },
  { name: "AddWallet", component: AddWalletScreen, titleKey: "nav.add_wallet" },
  { name: "Calibration", component: CalibrationScreen, titleKey: "nav.calibration", presentation: "modal" },
  { name: "Wallets", component: WalletsScreen, titleKey: "nav.wallets" },
  { name: "CurrencyHistory", component: CurrencyHistoryScreen, titleKey: "nav.currency_history" },
];

export function getTransactionScreens(
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
