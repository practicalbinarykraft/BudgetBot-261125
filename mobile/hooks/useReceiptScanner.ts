/**
 * Receipt scanner hook – uses expo-image-picker + camera to capture receipts.
 * Sends image to BudgetBot API for OCR analysis via Claude.
 */

import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { apiUpload } from '@/lib/api';

interface ReceiptItem {
  name: string;
  amount: string;
  quantity?: number;
}

interface ReceiptResult {
  items: ReceiptItem[];
  total: string;
  vendor?: string;
  date?: string;
  currency?: string;
}

export function useReceiptScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Open camera to take a photo of receipt */
  const scanFromCamera = useCallback(async (): Promise<ReceiptResult | null> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Camera permission denied');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      return processImage(result.assets[0].uri);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera error';
      setError(message);
      return null;
    }
  }, []);

  /** Pick an image from gallery */
  const scanFromGallery = useCallback(async (): Promise<ReceiptResult | null> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      return processImage(result.assets[0].uri);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gallery error';
      setError(message);
      return null;
    }
  }, []);

  /** Send image to server for OCR */
  const processImage = async (uri: string): Promise<ReceiptResult | null> => {
    setIsScanning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      } as unknown as Blob);

      const result = await apiUpload<ReceiptResult>(
        '/api/ai/receipts/analyze',
        formData,
      );

      setIsScanning(false);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OCR failed';
      setError(message);
      setIsScanning(false);
      return null;
    }
  };

  return {
    isScanning,
    error,
    scanFromCamera,
    scanFromGallery,
  };
}
