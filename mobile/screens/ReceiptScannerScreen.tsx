import React from "react";
import { View, ScrollView, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { Card, CardHeader, CardContent } from "../components/Card";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { useNavigation } from "@react-navigation/native";
import { useReceiptScannerScreen } from "../hooks/useReceiptScannerScreen";
import { styles } from "./styles/receiptScannerStyles";

export default function ReceiptScannerScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { imageUri, result, scanMutation, pickImage } = useReceiptScannerScreen();

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
            {t("receipts.description")}
          </ThemedText>
        </View>
      </View>

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

      {imageUri ? (
        <Card>
          <CardContent>
            <Image
              source={{ uri: imageUri }}
              style={styles.preview}
              resizeMode="contain"
            />
          </CardContent>
        </Card>
      ) : null}

      {scanMutation.isPending ? (
        <Card>
          <CardContent style={styles.loadingContent}>
            <Feather name="loader" size={24} color={theme.primary} />
            <ThemedText type="bodySm" color={theme.textSecondary}>
              {t("receipts.scanning")}
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
                },
              });
            }}
            icon={<Feather name="plus" size={16} color="#ffffff" />}
          />
        </>
      ) : null}

      {!imageUri && !scanMutation.isPending && !result ? (
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
