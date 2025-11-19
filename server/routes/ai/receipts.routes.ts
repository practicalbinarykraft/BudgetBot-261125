import { Router } from "express";
import { storage } from "../../storage";
import { withAuth } from "../../middleware/auth-utils";
import { parseReceiptWithItems } from "../../services/ocr/receipt-parser.service";
import { receiptItemsRepository } from "../../repositories/receipt-items.repository";
import { processReceiptItems } from "../../services/product-catalog.service";

const router = Router();

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
    
    const validMimeType = mimeType || 'image/jpeg';
    const parsed = await parseReceiptWithItems(imageBase64, anthropicApiKey, validMimeType);
    
    if (transactionId) {
      const txId = parseInt(transactionId);
      if (isNaN(txId)) {
        return res.status(400).json({ error: "Invalid transactionId" });
      }
      
      const transaction = await storage.getTransactionById(txId);
      if (!transaction || transaction.userId !== userId) {
        return res.status(403).json({ error: "Transaction not found or access denied" });
      }
      
      const items = parsed.items.map(item => ({
        transactionId: txId,
        itemName: item.name,
        normalizedName: item.normalizedName || item.name,
        quantity: (item.quantity ?? 1).toString(),
        pricePerUnit: (item.pricePerUnit ?? 0).toString(),
        totalPrice: (item.totalPrice ?? 0).toString(),
        currency: transaction.currency,
        merchantName: parsed.merchant || '',
      }));
      
      await receiptItemsRepository.createBulk(items);
    }
    
    res.json({
      success: true,
      receipt: parsed,
      itemsCount: parsed.items.length
    });
    
  } catch (error: any) {
    console.error("Receipt parsing error:", error);
    res.status(500).json({
      error: "Failed to parse receipt",
      details: error.message || "Unknown error"
    });
  }
}));

export default router;
