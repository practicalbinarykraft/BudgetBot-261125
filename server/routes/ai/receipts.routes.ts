import { Router } from "express";
import { storage } from "../../storage";
import { withAuth } from "../../middleware/auth-utils";
import { parseReceiptWithItems } from "../../services/ocr/receipt-parser.service";
import { receiptItemsRepository } from "../../repositories/receipt-items.repository";
import { processReceiptItems } from "../../services/product-catalog.service";
import { getErrorMessage } from "../../lib/errors";

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
 * 
 * Body:
 * - imageBase64: Base64-encoded image (without data:image prefix)
 * - mimeType: Image MIME type (image/jpeg, image/png, image/webp)
 * - transactionId: Optional - link items to existing transaction
 * 
 * Response:
 * - receipt: Parsed receipt data (total, merchant, date, items)
 * - itemsCount: Number of items extracted
 */
router.post("/receipt-with-items", withAuth(async (req, res) => {
  try {
    const { imageBase64, mimeType, transactionId } = req.body;
    const userId = req.user.id;
    
    if (!imageBase64) {
      return res.status(400).json({ 
        error: "imageBase64 is required" 
      });
    }
    
    const settings = await storage.getSettingsByUserId(userId);
    const anthropicApiKey = settings?.anthropicApiKey;
    
    if (!anthropicApiKey) {
      return res.status(400).json({
        error: "Anthropic API key not configured. Please add it in Settings."
      });
    }
    
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
    const parsed = await parseReceiptWithItems(imageBase64, anthropicApiKey, validMimeType);
    
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
        anthropicApiKey
      });
      
      console.log('✅ Product catalog updated from receipt');
    } catch (error) {
      console.error('❌ Failed to update product catalog:', error);
      // Не прерываем обработку чека, просто логируем
    }
    
    res.json({
      success: true,
      receipt: parsed,
      itemsCount: parsed.items.length
    });
    
  } catch (error: unknown) {
    console.error("Receipt parsing error:", error);
    res.status(500).json({
      error: "Failed to parse receipt",
      details: getErrorMessage(error)
    });
  }
}));

export default router;
