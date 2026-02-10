import React from "react";
import { Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { styles } from "./profileStyles";

interface NavItem {
  screen: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
}

interface NavGroupProps {
  title: string;
  items: NavItem[];
}

function NavGroup({ title, items }: NavGroupProps) {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <>
      <ThemedText type="bodySm" color={theme.textSecondary} style={styles.navGroupTitle}>
        {title}
      </ThemedText>
      {items.map((item) => (
        <Pressable
          key={item.screen}
          onPress={() => navigation.navigate(item.screen)}
          style={({ pressed }) => [
            styles.navRow,
            {
              backgroundColor: pressed ? theme.muted : theme.card,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <Feather name={item.icon} size={18} color={theme.text} />
          <ThemedText type="body" style={styles.navRowText}>
            {item.label}
          </ThemedText>
          <Feather name="chevron-right" size={18} color={theme.textTertiary} />
        </Pressable>
      ))}
    </>
  );
}

const dashboardItems: NavItem[] = [
  { screen: "DashboardAnalytics", icon: "bar-chart-2", label: "Dashboard Analytics" },
  { screen: "Wallets", icon: "credit-card", label: "Wallets" },
];

const financesItems: NavItem[] = [
  { screen: "Recurring", icon: "repeat", label: "Recurring Transactions" },
  { screen: "CurrencyHistory", icon: "dollar-sign", label: "Currency History" },
];

const analyticsItems: NavItem[] = [
  { screen: "AIAnalysis", icon: "cpu", label: "AI Analysis" },
  { screen: "AdvancedAnalytics", icon: "activity", label: "Advanced Analytics" },
  { screen: "ExpensesAnalytics", icon: "pie-chart", label: "Expense Analytics" },
  { screen: "Tags", icon: "tag", label: "Manage Tags" },
  { screen: "ProductCatalog", icon: "package", label: "Product Catalog" },
  { screen: "SwipeSort", icon: "shuffle", label: "Swipe Sort" },
];

const goalsItems: NavItem[] = [
  { screen: "Wishlist", icon: "heart", label: "Wishlist" },
  { screen: "PlannedExpenses", icon: "calendar", label: "Planned Expenses" },
  { screen: "PlannedIncome", icon: "dollar-sign", label: "Planned Income" },
  { screen: "Assets", icon: "briefcase", label: "Assets" },
];

const aiToolsItems: NavItem[] = [
  { screen: "AIChat", icon: "message-circle", label: "AI Chat" },
  { screen: "ReceiptScanner", icon: "camera", label: "Receipt Scanner" },
  { screen: "VoiceInput", icon: "mic", label: "Voice Input" },
];

export default function NavigationGroups() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <>
      <NavGroup title="Dashboard" items={dashboardItems} />
      <NavGroup title="Finances" items={financesItems} />
      <NavGroup title="Analytics" items={analyticsItems} />
      <NavGroup title="Goals" items={goalsItems} />
      <NavGroup title="AI Tools" items={aiToolsItems} />

      <ThemedText type="bodySm" color={theme.textSecondary} style={styles.navGroupTitle}>
        {t("settings.title")}
      </ThemedText>
      <Pressable
        onPress={() => navigation.navigate("Billing")}
        style={({ pressed }) => [
          styles.navRow,
          {
            backgroundColor: pressed ? theme.muted : theme.card,
            borderColor: theme.cardBorder,
          },
        ]}
      >
        <Feather name="zap" size={18} color={theme.text} />
        <ThemedText type="body" style={styles.navRowText}>
          {"Credits & Billing"}
        </ThemedText>
        <Feather name="chevron-right" size={18} color={theme.textTertiary} />
      </Pressable>
    </>
  );
}
