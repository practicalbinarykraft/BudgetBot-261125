import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  Animated,
  Modal,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";

const PANEL_W = 300;
const SCREEN_W = Dimensions.get("window").width;

type IconName = React.ComponentProps<typeof Feather>["name"];
interface NavItem { label: string; icon: IconName; route?: string; tab?: string; children?: NavItem[] }

const NAV_ITEMS: NavItem[] = [
  { label: "Главная", icon: "home", tab: "Dashboard" },
  { label: "Панель управления", icon: "grid", route: "DashboardAnalytics" },
  {
    label: "Финансы",
    icon: "credit-card",
    children: [
      { label: "Транзакции", icon: "credit-card", route: "Transactions" },
      { label: "Кошельки", icon: "credit-card", route: "Wallets" },
      { label: "Повторяющиеся", icon: "repeat", route: "Recurring" },
    ],
  },
  {
    label: "Аналитика",
    icon: "bar-chart-2",
    children: [
      { label: "Бюджеты", icon: "trending-down", route: "Budgets" },
      { label: "Анализ ИИ", icon: "cpu", route: "AIAnalysis" },
      { label: "Категории", icon: "tag", route: "Categories" },
      { label: "Теги", icon: "users", route: "Tags" },
      { label: "Каталог товаров", icon: "package", route: "ProductCatalog" },
    ],
  },
  {
    label: "Цели",
    icon: "target",
    children: [
      { label: "Вишлист", icon: "heart", route: "Wishlist" },
      { label: "Запланированные расходы", icon: "calendar", route: "PlannedExpenses" },
      { label: "Запланированный доход", icon: "dollar-sign", route: "PlannedIncome" },
      { label: "Активы", icon: "briefcase", route: "Assets" },
    ],
  },
  { label: "Настройки", icon: "settings", tab: "Profile" },
  { label: "Тарифы", icon: "zap", route: "Billing" },
];

export default function MobileMenuSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { theme, isDark, setMode } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_W)).current;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? SCREEN_W - PANEL_W : SCREEN_W,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const go = (item: NavItem) => {
    if (item.tab) {
      navigation.navigate("Main", { screen: item.tab });
    } else if (item.route) {
      navigation.navigate(item.route as any);
    }
    onClose();
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const toggleTheme = () => setMode(isDark ? "light" : "dark");

  const renderItem = (item: NavItem, depth = 0) => {
    const hasChildren = !!item.children?.length;
    const isOpen = openGroups[item.label];
    return (
      <View key={item.label}>
        <Pressable
          onPress={() => (hasChildren ? toggleGroup(item.label) : go(item))}
          style={[styles.navItem, { paddingLeft: 16 + depth * 16 }]}
        >
          <Feather name={item.icon} size={18} color={theme.textSecondary} />
          <ThemedText type="bodySm" style={styles.navLabel}>{item.label}</ThemedText>
          {hasChildren && (
            <Feather
              name="chevron-down"
              size={16}
              color={theme.textSecondary}
              style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
            />
          )}
        </Pressable>
        {hasChildren && isOpen && item.children!.map((c) => renderItem(c, depth + 1))}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.panel,
            {
              backgroundColor: theme.card,
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 8,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="h4">Главное меню</ThemedText>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={theme.text} />
            </Pressable>
          </View>

          {/* Nav */}
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {NAV_ITEMS.map((item) => renderItem(item))}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            {user?.email && (
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: 8 }}>
                {user.email}
              </ThemedText>
            )}
            <Pressable onPress={toggleTheme} style={styles.footerBtn}>
              <Feather name={isDark ? "sun" : "moon"} size={18} color={theme.text} />
              <ThemedText type="bodySm" style={styles.footerBtnText}>
                {isDark ? "Светлая тема" : "Тёмная тема"}
              </ThemedText>
            </Pressable>
            <Pressable onPress={handleLogout} style={styles.footerBtn}>
              <Feather name="log-out" size={18} color={theme.destructive} />
              <ThemedText type="bodySm" color={theme.destructive} style={styles.footerBtnText}>
                Выйти
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  panel: { position: "absolute", top: 0, bottom: 0, width: PANEL_W },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
  },
  closeBtn: { padding: 4 },
  scrollArea: { flex: 1, paddingHorizontal: 4 },
  navItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingRight: 16 },
  navLabel: { flex: 1 },
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12 },
  footerBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  footerBtnText: { fontWeight: "500" },
});
