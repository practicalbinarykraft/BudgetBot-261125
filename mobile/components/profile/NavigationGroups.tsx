import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { openOnboarding, isOnboardingReady } from "../../lib/onboarding-ref";
import { useToast } from "../Toast";
import { styles } from "./profileStyles";

function NavGroup({ titleKey, items }: { titleKey: string; items: NavItemDef[] }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <>
      <ThemedText type="bodySm" color={theme.textSecondary} style={styles.navGroupTitle}>
        {t(titleKey)}
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
            {t(item.labelKey)}
          </ThemedText>
          <Feather name="chevron-right" size={18} color={theme.textTertiary} />
        </Pressable>
      ))}
    </>
  );
}

interface NavItemDef { screen: string; icon: React.ComponentProps<typeof Feather>["name"]; labelKey: string }

const dashboardItems: NavItemDef[] = [
  { screen: "DashboardAnalytics", icon: "bar-chart-2", labelKey: "nav.dashboard" },
  { screen: "Wallets", icon: "credit-card", labelKey: "nav.wallets" },
];

const financesItems: NavItemDef[] = [
  { screen: "Recurring", icon: "repeat", labelKey: "nav.recurring" },
  { screen: "CurrencyHistory", icon: "dollar-sign", labelKey: "nav.currency_history" },
];

const analyticsItems: NavItemDef[] = [
  { screen: "AIAnalysis", icon: "cpu", labelKey: "nav.ai_analysis" },
  { screen: "AdvancedAnalytics", icon: "activity", labelKey: "nav.advanced_analytics" },
  { screen: "ExpensesAnalytics", icon: "pie-chart", labelKey: "nav.expense_analytics" },
  { screen: "Tags", icon: "tag", labelKey: "nav.tags" },
  { screen: "ProductCatalog", icon: "package", labelKey: "nav.product_catalog" },
  { screen: "SwipeSort", icon: "shuffle", labelKey: "nav.swipe_sort" },
];

const goalsItems: NavItemDef[] = [
  { screen: "Wishlist", icon: "heart", labelKey: "nav.wishlist" },
  { screen: "PlannedExpenses", icon: "calendar", labelKey: "nav.planned_expenses" },
  { screen: "PlannedIncome", icon: "dollar-sign", labelKey: "nav.planned_income" },
  { screen: "Assets", icon: "briefcase", labelKey: "nav.assets" },
];

const aiToolsItems: NavItemDef[] = [
  { screen: "AIChat", icon: "message-circle", labelKey: "nav.ai_chat" },
  { screen: "ReceiptScanner", icon: "camera", labelKey: "nav.receipt_scanner" },
  { screen: "VoiceInput", icon: "mic", labelKey: "nav.voice_input" },
];

export default function NavigationGroups() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const toast = useToast();

  // DEV-ONLY: diagnostic banner — remove before release
  const [devStatus, setDevStatus] = useState<string | null>(null);
  useEffect(() => {
    if (__DEV__) {
      AsyncStorage.getItem("budgetbot_onboarding_status").then((val) => {
        setDevStatus(val);
      });
    }
  }, []);

  const billingItems: NavItemDef[] = [
    { screen: "Billing", icon: "zap", labelKey: "nav.credits_billing" },
  ];

  return (
    <>
      {__DEV__ && (
        <View style={{ backgroundColor: "#fef3c7", padding: 8, borderRadius: 8, marginBottom: 8 }}>
          <ThemedText type="small" color="#92400e">
            {"[DEV] status: " + (devStatus ?? "null") +
              " | openFn: " + (isOnboardingReady() ? "YES" : "NO") +
              " | commit: a2b3df5"}
          </ThemedText>
        </View>
      )}
      <NavGroup titleKey="nav.dashboard" items={dashboardItems} />
      <NavGroup titleKey="nav.money" items={financesItems} />
      <NavGroup titleKey="nav.analytics" items={analyticsItems} />
      <NavGroup titleKey="nav.goals" items={goalsItems} />
      <NavGroup titleKey="nav.group_ai_tools" items={aiToolsItems} />
      <NavGroup titleKey="nav.settings" items={billingItems} />
      <Pressable
        onPress={() => {
          if (!openOnboarding()) {
            toast.show(t("common.tutorial_unavailable"), "error");
          }
        }}
        style={({ pressed }) => [
          styles.navRow,
          {
            backgroundColor: pressed ? theme.muted : theme.card,
            borderColor: theme.cardBorder,
          },
        ]}
      >
        <Feather name="help-circle" size={18} color={theme.text} />
        <ThemedText type="body" style={styles.navRowText}>
          {t("nav.tutorial")}
        </ThemedText>
        <Feather name="chevron-right" size={18} color={theme.textTertiary} />
      </Pressable>
    </>
  );
}
