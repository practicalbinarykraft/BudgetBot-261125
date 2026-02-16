import { Router } from "express";
import { storage } from "../../storage";
import { withAuth } from "../../middleware/auth-utils";
import { parseReceiptWithItems } from "../../services/ocr/receipt-parser.service";
import { receiptItemsRepository } from "../../repositories/receipt-items.repository";
import { processReceiptItems } from "../../services/product-catalog.service";
import { getErrorMessage } from "../../lib/errors";
import { logInfo, logError } from '../../lib/logger';

const router = Router();

/**
 * Определить валюту по названию магазина (аналогично Telegram боту)
 */
function detectCurrencyFromMerchant(merchantName: string): string {
  const lower = merchantName.toLowerCase();
  
  // Индонезийские магазины
  if (lower.includes('pepito') || lower.includes('indomaret') || lower.includes('alfamart')) {
    return 'IDR';
  }
  
  // Российские магазины
  if (lower.includes('пятёрочка') || lower.includes('магнит') || lower.includes('дикси')) {
    return 'RUB';
  }
  
  // По умолчанию IDR (т.к. основной пользователь в Индонезии)
  return 'IDR';
}

/**
 * POST /api/ai/receipt-with-items
 * Parse receipt and extract individual items with prices
 * Supports single image or multiple images (for long receipts)
 *
 * Body:
 * - imageBase64: string (single image) OR images: string[] (multiple images)
 * - mimeType: Image MIME type (image/jpeg, image/png, image/webp)
 * - transactionId: Optional - link items to existing transaction
 */
router.post("/receipt-with-items", withAuth(async (req, res) => {
  try {
    const { imageBase64, images, mimeType, transactionId } = req.body;
    const userId = Number(req.user.id);

    // Поддержка и одного фото (imageBase64) и нескольких (images[])
    const imageArray: string[] = images && Array.isArray(images) && images.length > 0
      ? images
      : imageBase64 ? [imageBase64] : [];

    if (imageArray.length === 0) {
      return res.status(400).json({
        error: "imageBase64 or images[] is required"
      });
    }

    // 🎯 Smart API key selection: BYOK or system key with credits
    const { getApiKey } = await import('../../services/api-key-manager');
    const { chargeCredits } = await import('../../services/billing.service');
    const { BillingError } = await import('../../types/billing');

    let apiKeyInfo;
    try {
      apiKeyInfo = await getApiKey(userId, 'ocr');
    } catch (error: any) {
      if (error instanceof BillingError && error.code === 'INSUFFICIENT_CREDITS') {
        return res.status(402).json({
          error: "You have insufficient credits to use this feature. Add credits or switch to another tier.",
          creditsExhausted: true
        });
      }
      throw error;
    }

    const settings = await storage.getSettingsByUserId(userId);

    // Получить курсы валют из настроек
    const exchangeRates: Record<string, number> = {
      'USD': 1,
      'RUB': parseFloat(settings?.exchangeRateRUB || '90'),
      'IDR': parseFloat(settings?.exchangeRateIDR || '16000'),
      'EUR': parseFloat(settings?.exchangeRateEUR || '0.95'),
    };

    // Определить валюту (из настроек или USD по умолчанию)
    const currency = settings?.currency || 'USD';

    const validMimeType = mimeType || 'image/jpeg';
    const parsed = await parseReceiptWithItems(imageArray, apiKeyInfo.key, validMimeType);
    
    // Получить валюту транзакции (если привязан)
    let transactionCurrency: string | null = null;
    
    if (transactionId) {
      const txId = parseInt(transactionId);
      if (isNaN(txId)) {
        return res.status(400).json({ error: "Invalid transactionId" });
      }
      
      const transaction = await storage.getTransactionById(txId);
      if (!transaction || transaction.userId !== userId) {
        return res.status(403).json({ error: "Transaction not found or access denied" });
      }
      
      transactionCurrency = transaction.currency;
    }
    
    // Функция определения валюты для каждого товара (приоритет):
    // 1. Per-item currency (если Claude извлек для конкретного товара) - HIGHEST
    // 2. Receipt-level currency (если Claude извлек для всего чека)
    // 3. Transaction currency (если привязан к существующей транзакции)
    // 4. User settings
    // 5. Merchant heuristic - LAST FALLBACK
    const getItemCurrency = (item: any): string => {
      return item.currency 
        || parsed.currency 
        || transactionCurrency 
        || currency 
        || detectCurrencyFromMerchant(parsed.merchant || '');
    };
    
    // Сохранить items в БД (если привязан к транзакции)
    if (transactionId) {
      const txId = parseInt(transactionId);
      const items = parsed.items.map(item => ({
        transactionId: txId,
        itemName: item.name,
        normalizedName: item.normalizedName || item.name,
        quantity: (item.quantity ?? 1).toString(),
        pricePerUnit: (item.pricePerUnit ?? 0).toString(),
        totalPrice: (item.totalPrice ?? 0).toString(),
        currency: getItemCurrency(item), // Per-item currency с правильным приоритетом
        merchantName: parsed.merchant || '',
      }));
      
      await receiptItemsRepository.createBulk(items);
    }
    
    // Обработать товары для Product Catalog
    try {
      await processReceiptItems({
        receiptItems: parsed.items.map(item => ({
          name: item.name,
          price: item.totalPrice,
          currency: getItemCurrency(item), // Per-item currency с правильным приоритетом
          quantity: item.quantity || 1
        })),
        userId,
        storeName: parsed.merchant || 'Unknown Store',
        purchaseDate: parsed.date,
        exchangeRates,
        anthropicApiKey: apiKeyInfo.key
      });

      logInfo('✅ Product catalog updated from receipt');
    } catch (error) {
      logError('❌ Failed to update product catalog:', error);
      // Не прерываем обработку чека, просто логируем
    }

    // 💳 Charge credits if using system key
    if (apiKeyInfo.shouldCharge) {
      await chargeCredits(
        userId,
        'ocr',
        apiKeyInfo.provider,
        { input: 1500, output: 500 },
        apiKeyInfo.billingMode === 'free'
      );
    }

    res.json({
      success: true,
      receipt: parsed,
      itemsCount: parsed.items.length
    });
    
  } catch (error: unknown) {
    logError("Receipt parsing error:", error);
    res.status(500).json({
      error: "Failed to parse receipt",
      details: getErrorMessage(error)
    });
  }
}));

export default router;
