import React from "react";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import AddTransactionScreen from "../screens/AddTransactionScreen";
import EditTransactionScreen from "../screens/EditTransactionScreen";
import AddEditCategoryScreen from "../screens/AddEditCategoryScreen";
import AddEditBudgetScreen from "../screens/AddEditBudgetScreen";
import AddWalletScreen from "../screens/AddWalletScreen";
import CalibrationScreen from "../screens/CalibrationScreen";
import WalletsScreen from "../screens/WalletsScreen";
import CurrencyHistoryScreen from "../screens/CurrencyHistoryScreen";

interface ScreenConfig {
  name: string;
  component: React.ComponentType<any>;
  title: string;
  presentation?: "modal";
}

const screens: ScreenConfig[] = [
  { name: "AddTransaction", component: AddTransactionScreen, title: "Add Transaction", presentation: "modal" },
  { name: "EditTransaction", component: EditTransactionScreen, title: "Edit Transaction", presentation: "modal" },
  { name: "AddEditCategory", component: AddEditCategoryScreen, title: "Category", presentation: "modal" },
  { name: "AddEditBudget", component: AddEditBudgetScreen, title: "Budget", presentation: "modal" },
  { name: "AddWallet", component: AddWalletScreen, title: "Add Wallet", presentation: "modal" },
  { name: "Calibration", component: CalibrationScreen, title: "Calibration", presentation: "modal" },
  { name: "Wallets", component: WalletsScreen, title: "Wallets" },
  { name: "CurrencyHistory", component: CurrencyHistoryScreen, title: "Currency History" },
];

export function getTransactionScreens(
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
