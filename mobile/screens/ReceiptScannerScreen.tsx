import React from "react";
import { View, ScrollView, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { Card, CardHeader, CardContent } from "../components/Card";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { useReceiptScannerScreen } from "../hooks/useReceiptScannerScreen";
import { styles } from "./styles/receiptScannerStyles";

export default function ReceiptScannerScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { imageUri, result, scanMutation, pickImage } = useReceiptScannerScreen();

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="h3" style={styles.bold}>
            {"Receipt Scanner"}
          </ThemedText>
          <ThemedText type="small" color={theme.textSecondary}>
            {"Upload a receipt to extract items and prices"}
          </ThemedText>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Button
          title="Take Photo"
          onPress={() => pickImage(true)}
          disabled={scanMutation.isPending}
          icon={<Feather name="camera" size={16} color="#ffffff" />}
          style={styles.halfBtn}
        />
        <Button
          title="Pick from Library"
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
              {"Scanning receipt..."}
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
                {"Receipt scanned successfully"}
              </ThemedText>
              <ThemedText type="small" color="#15803d">
                {"Found "}
                {result.itemsCount || 0}
                {" items from "}
                {result.receipt?.merchant || "receipt"}
              </ThemedText>
            </View>
          </View>

          {result.receipt?.items && result.receipt.items.length > 0 ? (
            <Card>
              <CardHeader>
                <ThemedText type="h4" style={styles.bold}>
                  {"Extracted Items"}
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
                        {item.name || "Unknown item"}
                      </ThemedText>
                      <ThemedText type="small" color={theme.textSecondary}>
                        {"Qty: "}
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
                      {"Total"}
                    </ThemedText>
                    <ThemedText type="bodySm" mono style={styles.bold}>
                      {result.receipt.total}
                    </ThemedText>
                  </View>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}

      {!imageUri && !scanMutation.isPending && !result ? (
        <View style={styles.emptyState}>
          <Feather name="camera" size={48} color={theme.textTertiary} />
          <ThemedText type="bodySm" color={theme.textSecondary}>
            {"Take a photo or select a receipt image to get started"}
          </ThemedText>
        </View>
      ) : null}
    </ScrollView>
  );
}
