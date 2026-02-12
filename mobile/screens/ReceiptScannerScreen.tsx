import React, { useLayoutEffect } from "react";
import { View, ScrollView, Image, TouchableOpacity, Alert, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { Card, CardHeader, CardContent } from "../components/Card";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { useNavigation } from "@react-navigation/native";
import { useReceiptScannerScreen } from "../hooks/useReceiptScannerScreen";
import { styles } from "./styles/receiptScannerStyles";

const CURRENCY_OPTIONS = ["USD", "RUB", "IDR", "EUR", "KRW", "CNY"];

export default function ReceiptScannerScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const {
    imageUris,
    result,
    scanMutation,
    scanningPhrase,
    receiptCurrency,
    setReceiptCurrency,
    pickImage,
    scanImages,
    removeImage,
    clearImages,
  } = useReceiptScannerScreen();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t("nav.receipt_scanner") });
  }, [navigation, t]);

  const handleAddPhoto = () => {
    Alert.alert(
      t("receipts.add_photo"),
      undefined,
      [
        { text: t("receipts.take_photo"), onPress: () => pickImage(true) },
        { text: t("receipts.pick_from_library"), onPress: () => pickImage(false) },
        { text: t("common.cancel"), style: "cancel" },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="h3" style={styles.bold}>
            {t("receipts.title")}
          </ThemedText>
          <ThemedText type="small" color={theme.textSecondary}>
            {t("receipts.description_multi")}
          </ThemedText>
        </View>
      </View>

      {imageUris.length === 0 ? (
        <>
          <View style={styles.buttonRow}>
            <Button
              title={t("receipts.take_photo")}
              onPress={() => pickImage(true)}
              disabled={scanMutation.isPending}
              icon={<Feather name="camera" size={16} color="#ffffff" />}
              style={styles.halfBtn}
            />
            <Button
              title={t("receipts.pick_from_library")}
              variant="outline"
              onPress={() => pickImage(false)}
              disabled={scanMutation.isPending}
              icon={<Feather name="image" size={16} color={theme.text} />}
              style={styles.halfBtn}
            />
          </View>
          <ThemedText type="small" color={theme.textSecondary} style={styles.photoHint}>
            {t("receipts.photo_hint")}
          </ThemedText>
        </>
      ) : (
        <>
          <Button
            title={t("receipts.add_photo")}
            variant="outline"
            onPress={handleAddPhoto}
            disabled={scanMutation.isPending}
            icon={<Feather name="plus" size={16} color={theme.text} />}
          />
          <ThemedText type="small" color={theme.textSecondary} style={styles.photoHint}>
            {t("receipts.add_more_hint")}
          </ThemedText>
        </>
      )}

      {imageUris.length > 0 ? (
        <Card>
          <CardContent>
            {imageUris.length === 1 ? (
              <View style={styles.imageThumbWrapper}>
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(0)}>
                  <Feather name="x" size={12} color="#ffffff" />
                </TouchableOpacity>
                <Image
                  source={{ uri: imageUris[0] }}
                  style={styles.preview}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={styles.imageGrid}>
                {imageUris.map((uri, index) => (
                  <View key={uri + index} style={styles.imageThumbWrapper}>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                      <Feather name="x" size={12} color="#ffffff" />
                    </TouchableOpacity>
                    <Image
                      source={{ uri }}
                      style={styles.imageThumb}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </View>
            )}
            <View
              style={[styles.photoBadge, { backgroundColor: theme.muted }]}
            >
              <Feather name="image" size={12} color={theme.textSecondary} />
              <ThemedText type="small" color={theme.textSecondary}>
                {t("receipts.photos_count").replace("{count}", String(imageUris.length))}
              </ThemedText>
            </View>
          </CardContent>
        </Card>
      ) : null}

      {imageUris.length > 0 && !scanMutation.isPending && !result ? (
        <View style={styles.buttonRow}>
          <Button
            title={t("receipts.scan")}
            onPress={scanImages}
            icon={<Feather name="send" size={16} color="#ffffff" />}
            style={styles.halfBtn}
          />
          <Button
            title={t("receipts.clear")}
            variant="outline"
            onPress={clearImages}
            icon={<Feather name="trash-2" size={16} color={theme.text} />}
            style={styles.halfBtn}
          />
        </View>
      ) : null}

      {scanMutation.isPending ? (
        <Card>
          <CardContent style={styles.loadingContent}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText type="bodySm" color={theme.textSecondary}>
              {scanningPhrase}
            </ThemedText>
          </CardContent>
        </Card>
      ) : null}

      {result ? (
        <>
          <View
            style={[
              styles.successBanner,
              { backgroundColor: "#dcfce7", borderColor: "#86efac" },
            ]}
          >
            <Feather name="check-circle" size={16} color="#166534" />
            <View style={styles.successText}>
              <ThemedText type="bodySm" color="#166534" style={styles.bold}>
                {t("receipts.scan_success")}
              </ThemedText>
              <ThemedText type="small" color="#15803d">
                {t("receipts.found_items")
                  .replace("{count}", String(result.itemsCount || 0))
                  .replace("{merchant}", result.receipt?.merchant || t("receipts.receipt"))}
              </ThemedText>
            </View>
          </View>

          {/* Currency selector */}
          <View style={styles.currencySection}>
            <ThemedText type="small" color={theme.textSecondary}>
              {t("receipts.currency_hint")}
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyRow}>
              {CURRENCY_OPTIONS.map((cur) => (
                <Pressable
                  key={cur}
                  onPress={() => setReceiptCurrency(cur)}
                  style={[
                    styles.currencyBtn,
                    {
                      backgroundColor: receiptCurrency === cur ? theme.primary : theme.secondary,
                      borderColor: receiptCurrency === cur ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    color={receiptCurrency === cur ? "#ffffff" : theme.text}
                    style={styles.bold}
                  >
                    {cur}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {result.receipt?.items && result.receipt.items.length > 0 ? (
            <Card>
              <CardHeader>
                <ThemedText type="h4" style={styles.bold}>
                  {t("receipts.extracted_items")}
                </ThemedText>
              </CardHeader>
              <CardContent style={styles.itemsList}>
                {result.receipt.items.map((item, index) => (
                  <View
                    key={index}
                    style={[styles.itemRow, { borderColor: theme.border }]}
                  >
                    <View style={styles.itemLeft}>
                      <ThemedText type="bodySm" style={styles.bold}>
                        {item.name || t("receipts.unknown_item")}
                      </ThemedText>
                      <ThemedText type="small" color={theme.textSecondary}>
                        {t("receipts.qty") + " "}
                        {item.quantity || 1}
                      </ThemedText>
                    </View>
                    <View style={styles.itemRight}>
                      <ThemedText type="bodySm" mono style={styles.bold}>
                        {item.totalPrice || 0}
                      </ThemedText>
                      <ThemedText type="small" color={theme.textSecondary}>
                        {"@ "}
                        {item.pricePerUnit || 0}
                      </ThemedText>
                    </View>
                  </View>
                ))}

                {result.receipt.total ? (
                  <View
                    style={[
                      styles.totalRow,
                      {
                        borderTopColor: theme.border,
                        backgroundColor: theme.muted,
                      },
                    ]}
                  >
                    <ThemedText type="bodySm" style={styles.bold}>
                      {t("receipts.total")}
                    </ThemedText>
                    <ThemedText type="bodySm" mono style={styles.bold}>
                      {result.receipt.total}
                    </ThemedText>
                  </View>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Button
            title={t("voice_input.create_transaction")}
            onPress={() => {
              (navigation as any).navigate("AddTransaction", {
                prefill: {
                  amount: String(result.receipt?.total || ""),
                  description: result.receipt?.merchant || "",
                  type: "expense" as const,
                  currency: receiptCurrency,
                },
              });
            }}
            icon={<Feather name="plus" size={16} color="#ffffff" />}
          />

          <Button
            title={t("receipts.scan_another")}
            variant="outline"
            onPress={clearImages}
            icon={<Feather name="camera" size={16} color={theme.text} />}
          />
        </>
      ) : null}

      {imageUris.length === 0 && !scanMutation.isPending && !result ? (
        <View style={styles.emptyState}>
          <Feather name="camera" size={48} color={theme.textTertiary} />
          <ThemedText type="bodySm" color={theme.textSecondary}>
            {t("receipts.empty_state")}
          </ThemedText>
        </View>
      ) : null}
    </ScrollView>
  );
}
