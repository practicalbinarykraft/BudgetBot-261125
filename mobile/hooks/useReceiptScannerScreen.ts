import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import type { ReceiptScanResult } from "../types";

export function useReceiptScannerScreen() {
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
      const merchant = data.receipt?.merchant || "receipt";
      const count = data.itemsCount || 0;
      Alert.alert("Success", `Found ${count} items from ${merchant}`);
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to scan receipt");
    },
  });

  const pickImage = async (useCamera: boolean) => {
    const permissionFn = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await permissionFn();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        `Please grant ${useCamera ? "camera" : "photo library"} permission`
      );
      return;
    }

    const launchFn = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const pickerResult = await launchFn({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: true,
    });

    if (pickerResult.canceled || !pickerResult.assets?.[0]) return;

    const asset = pickerResult.assets[0];
    setImageUri(asset.uri);
    setResult(null);

    if (asset.base64) {
      scanMutation.mutate(asset.base64);
    }
  };

  return { imageUri, result, scanMutation, pickImage };
}
