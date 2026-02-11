import React, { useState, useMemo } from "react";
import {
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "../components/ThemedText";
import { Input } from "../components/Input";
import { Card, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { api } from "../lib/api-client";
import type { ProductCatalog } from "../types";
import { styles } from "./ProductCatalogScreen.styles";

export default function ProductCatalogScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const productsQuery = useQuery({
    queryKey: ["product-catalog", { search, category: selectedCategory }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      const qs = params.toString();
      return api.get<ProductCatalog[]>(
        `/api/product-catalog${qs ? `?${qs}` : ""}`
      );
    },
  });

  const products = productsQuery.data || [];

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  if (productsQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const renderItem = ({ item }: { item: ProductCatalog }) => (
    <Pressable
      onPress={() => navigation.navigate("ProductDetail", { productId: item.id })}
    >
      <Card style={styles.productCard}>
        <CardContent style={styles.productContent}>
          <View style={styles.productRow}>
            <View style={styles.productInfo}>
              <ThemedText type="bodySm" style={styles.productName}>
                {item.name}
              </ThemedText>
              {item.category ? (
                <Badge label={item.category} variant="outline" />
              ) : null}
            </View>
            <Feather
              name="chevron-right"
              size={18}
              color={theme.textTertiary}
            />
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          {/* Header */}
          <View style={styles.header}>
            <Feather name="package" size={24} color={theme.primary} />
            <View style={styles.headerText}>
              <ThemedText type="h2">{t("product_catalog.title")}</ThemedText>
              <ThemedText type="bodySm" color={theme.textSecondary}>
                {t("product_catalog.subtitle")}
              </ThemedText>
            </View>
          </View>

          {/* Search */}
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder={t("product_catalog.search_placeholder")}
            containerStyle={styles.searchInput}
          />

          {/* Category filter */}
          <View style={styles.categoryRow}>
            <Pressable
              onPress={() => setSelectedCategory("all")}
              style={[
                styles.catBtn,
                {
                  backgroundColor:
                    selectedCategory === "all"
                      ? theme.primary
                      : theme.secondary,
                  borderColor:
                    selectedCategory === "all"
                      ? theme.primary
                      : theme.border,
                },
              ]}
            >
              <ThemedText
                type="small"
                color={selectedCategory === "all" ? "#ffffff" : theme.text}
              >
                {t("common.all")}
              </ThemedText>
            </Pressable>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.catBtn,
                    {
                      backgroundColor: isActive
                        ? theme.primary
                        : theme.secondary,
                      borderColor: isActive ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    color={isActive ? "#ffffff" : theme.text}
                  >
                    {cat}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Stats */}
          <ThemedText
            type="small"
            color={theme.textSecondary}
            style={styles.statsText}
          >
            {t("product_catalog.products_count").replace("{count}", String(products.length))}
          </ThemedText>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Feather name="package" size={48} color={theme.textTertiary} />
          <ThemedText
            type="body"
            color={theme.textSecondary}
            style={styles.emptyTitle}
          >
            {t("product_catalog.no_products")}
          </ThemedText>
          <ThemedText type="bodySm" color={theme.textTertiary}>
            {t("product_catalog.no_products_hint")}
          </ThemedText>
        </View>
      }
    />
  );
}

