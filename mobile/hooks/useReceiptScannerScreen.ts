import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { useTranslation } from "../i18n";
import type { ReceiptScanResult } from "../types";

const MAX_IMAGE_WIDTH = 1024;
const MAX_BASE64_SIZE = 5_000_000; // ~5MB base64 ≈ ~3.7MB image

export function useReceiptScannerScreen() {
  const { t } = useTranslation();
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [result, setResult] = useState<ReceiptScanResult | null>(null);

  const scanMutation = useMutation({
    mutationFn: async (base64Images: string[]) =>
      api.post<ReceiptScanResult>("/api/ai/receipt-with-items", {
        images: base64Images,
        mimeType: "image/jpeg",
      }),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["product-catalog"] });
      const merchant = data.receipt?.merchant || "receipt";
      const count = data.itemsCount || 0;
      Alert.alert(
        t("common.success"),
        t("receipts.found_items")
          .replace("{count}", String(count))
          .replace("{merchant}", merchant),
      );
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message || t("receipts.failed_to_scan"));
    },
  });

  const compressAndEncode = async (uri: string, quality: number): Promise<string> => {
    const resized = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_IMAGE_WIDTH } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    if (!resized.base64) {
      throw new Error("Failed to encode image to base64");
    }
    return resized.base64;
  };

  const encodeImage = async (uri: string): Promise<string> => {
    let base64 = await compressAndEncode(uri, 0.7);
    if (base64.length > MAX_BASE64_SIZE) {
      base64 = await compressAndEncode(uri, 0.4);
    }
    if (base64.length > MAX_BASE64_SIZE) {
      throw new Error(t("receipts.image_too_large"));
    }
    return base64;
  };

  const pickImage = async (useCamera: boolean) => {
    const permissionFn = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await permissionFn();
    if (status !== "granted") {
      Alert.alert(
        t("common.error"),
        t(useCamera ? "receipts.permission_camera" : "receipts.permission_photos"),
      );
      return;
    }

    const launchFn = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const pickerResult = await launchFn({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsMultipleSelection: !useCamera,
      selectionLimit: 5,
    });

    if (pickerResult.canceled || !pickerResult.assets?.length) return;

    const newUris = pickerResult.assets.map((a) => a.uri);
    setImageUris((prev) => [...prev, ...newUris]);
    setResult(null);
  };

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    setImageUris([]);
    setResult(null);
  };

  const scanImages = async () => {
    if (imageUris.length === 0) return;
    try {
      const base64Images = await Promise.all(imageUris.map(encodeImage));
      scanMutation.mutate(base64Images);
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.message || String(err));
    }
  };

  return {
    imageUris,
    result,
    scanMutation,
    pickImage,
    scanImages,
    removeImage,
    clearImages,
  };
}
