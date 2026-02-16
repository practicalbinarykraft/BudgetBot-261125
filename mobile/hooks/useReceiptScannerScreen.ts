import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { uiAlert } from "@/lib/uiAlert";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useMutation } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { classifyReceiptError } from "../lib/receipt-errors";
import { useTranslation } from "../i18n";
import type { ReceiptScanResult } from "../types";

const isWeb = Platform.OS === "web";
const MAX_IMAGE_WIDTH = 1024;
const MAX_BASE64_SIZE = 5_000_000; // ~5MB base64 ≈ ~3.7MB image

const SCANNING_PHRASE_KEYS = [
  "receipts.scan_p1",
  "receipts.scan_p2",
  "receipts.scan_p3",
  "receipts.scan_p4",
  "receipts.scan_p5",
  "receipts.scan_p6",
  "receipts.scan_p7",
  "receipts.scan_p8",
  "receipts.scan_p9",
  "receipts.scan_p10",
] as const;

export function useReceiptScannerScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [result, setResult] = useState<ReceiptScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [scanningPhaseIndex, setScanningPhaseIndex] = useState(0);
  const [receiptCurrency, setReceiptCurrency] = useState("IDR");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scanMutation = useMutation({
    mutationFn: async (base64Images: string[]) =>
      api.post<ReceiptScanResult>("/api/ai/receipt-with-items", {
        images: base64Images,
        mimeType: "image/jpeg",
      }),
    onSuccess: (data) => {
      setResult(data);
      setScanError(null);
      setCanRetry(false);
      setReceiptCurrency(data.receipt?.currency || "IDR");
      queryClient.invalidateQueries({ queryKey: ["product-catalog"] });
    },
    onError: (error: Error) => {
      const classified = classifyReceiptError(error);
      setScanError(t(classified.messageKey));
      setCanRetry(classified.canRetry);
    },
  });

  useEffect(() => {
    if (scanMutation.isPending) {
      setScanningPhaseIndex(0);
      intervalRef.current = setInterval(() => {
        setScanningPhaseIndex((prev) => {
          const next = prev + 1;
          if (next >= SCANNING_PHRASE_KEYS.length) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return prev;
          }
          return next;
        });
      }, 3000);
    } else {
      setScanningPhaseIndex(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [scanMutation.isPending]);

  const scanningPhrase = t(SCANNING_PHRASE_KEYS[scanningPhaseIndex]);

  // ===== Native image encoding (ImageManipulator) =====
  const compressAndEncodeNative = async (uri: string, quality: number): Promise<string> => {
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

  // ===== Web image encoding (Canvas) =====
  const compressAndEncodeWeb = async (dataUri: string, quality: number): Promise<string> => {
    const { compressWebImage } = await import("../lib/web-image-picker");
    return compressWebImage(dataUri, MAX_IMAGE_WIDTH, quality);
  };

  const encodeImage = async (uri: string): Promise<string> => {
    const compress = isWeb ? compressAndEncodeWeb : compressAndEncodeNative;
    let base64 = await compress(uri, 0.7);
    if (base64.length > MAX_BASE64_SIZE) {
      base64 = await compress(uri, 0.4);
    }
    if (base64.length > MAX_BASE64_SIZE) {
      throw new Error(t("receipts.image_too_large"));
    }
    return base64;
  };

  // ===== Web: <input type="file"> =====
  const pickImageWeb = async (_useCamera: boolean) => {
    const { pickWebImages } = await import("../lib/web-image-picker");
    const uris = await pickWebImages(true); // always multi-select on web
    if (uris.length === 0) return;
    setImageUris((prev) => [...prev, ...uris]);
    setResult(null);
  };

  // ===== Native: expo-image-picker =====
  const pickImageNative = async (useCamera: boolean) => {
    const permissionFn = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await permissionFn();
    if (status !== "granted") {
      uiAlert(
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

  const pickImage = isWeb ? pickImageWeb : pickImageNative;

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    setImageUris([]);
    setResult(null);
    setScanError(null);
    setCanRetry(false);
  };

  const goManual = () => {
    navigation.navigate("AddTransaction", {});
  };

  const scanImages = async () => {
    if (imageUris.length === 0) return;
    setScanError(null);
    try {
      const base64Images = await Promise.all(imageUris.map(encodeImage));
      scanMutation.mutate(base64Images);
    } catch (err: any) {
      setScanError(err?.message || String(err));
    }
  };

  return {
    imageUris,
    result,
    scanMutation,
    scanError,
    canRetry,
    scanningPhrase,
    receiptCurrency,
    setReceiptCurrency,
    pickImage,
    scanImages,
    removeImage,
    clearImages,
    goManual,
  };
}
