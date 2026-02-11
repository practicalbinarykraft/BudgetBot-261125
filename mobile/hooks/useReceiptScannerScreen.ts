import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { File } from "expo-file-system";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { useTranslation } from "../i18n";
import type { ReceiptScanResult } from "../types";

const MAX_IMAGE_WIDTH = 1200;

export function useReceiptScannerScreen() {
  const { t } = useTranslation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<ReceiptScanResult | null>(null);

  const scanMutation = useMutation({
    mutationFn: async (base64: string) =>
      api.post<ReceiptScanResult>("/api/ai/receipt-with-items", {
        imageBase64: base64,
        mimeType: "image/jpeg",
      }),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["product-catalog"] });
      const merchant = data.receipt?.merchant || "receipt";
      const count = data.itemsCount || 0;
      Alert.alert(
        t("common.success"),
        t("receipts.found_items").replace("{count}", String(count)).replace("{merchant}", merchant),
      );
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message || t("receipts.failed_to_scan"));
    },
  });

  const pickImage = async (useCamera: boolean) => {
    const permissionFn = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await permissionFn();
    if (status !== "granted") {
      Alert.alert(
        t("common.error"),
        `Please grant ${useCamera ? "camera" : "photo library"} permission`,
      );
      return;
    }

    const launchFn = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const pickerResult = await launchFn({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (pickerResult.canceled || !pickerResult.assets?.[0]) return;

    const asset = pickerResult.assets[0];
    setImageUri(asset.uri);
    setResult(null);

    const resized = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: MAX_IMAGE_WIDTH } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    );

    const base64 = await new File(resized.uri).base64();

    scanMutation.mutate(base64);
  };

  return { imageUri, result, scanMutation, pickImage };
}
