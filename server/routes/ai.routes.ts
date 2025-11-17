import { Router } from "express";
import { storage } from "../storage";
import { analyzeSpending, scanReceipt } from "../services/ai-service";
import { withAuth } from "../middleware/auth-utils";
import { predictForTransaction, enrichPrediction } from "../services/ai/prediction.service";
import { getTrainingStats, saveTrainingExample } from "../services/ai/training.service";
import { getTrainingHistory } from "../services/ai/training-history.service";
import { insertAiTrainingExampleSchema, type TrainingStats } from "@shared/schema";
import { parseReceiptWithItems } from "../services/ocr/receipt-parser.service";
import { receiptItemsRepository } from "../repositories/receipt-items.repository";
import { comparePrices, getAIPriceInsights } from "../services/ai/price-comparison.service";

const router = Router();

// POST /api/ai/analyze
router.post("/analyze", withAuth(async (req, res) => {
  try {
    const transactions = await storage.getTransactionsByUserId(req.user.id);
    const analysis = await analyzeSpending(transactions);
    res.json({ analysis });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/ai/scan-receipt
router.post("/scan-receipt", withAuth(async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image required" });
    }
    
    const result = await scanReceipt(image);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

// GET /api/ai/predict/:transactionId
router.get("/predict/:transactionId", withAuth(async (req, res) => {
  try {
    const transactionId = parseInt(req.params.transactionId);
    if (isNaN(transactionId)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const prediction = await predictForTransaction(transactionId, req.user.id);
    const enriched = await enrichPrediction(prediction, req.user.id);
    
    res.json(enriched);
  } catch (error: any) {
    console.error("AI prediction error:", error);
    res.status(500).json({ error: error.message });
  }
}));

// GET /api/ai/training-stats
router.get("/training-stats", withAuth(async (req, res) => {
  try {
    const stats: TrainingStats = await getTrainingStats(req.user.id);
    res.json(stats);
  } catch (error: any) {
    console.error("Training stats error:", error);
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/ai/training
router.post("/training", withAuth(async (req, res) => {
  try {
    const validated = insertAiTrainingExampleSchema.parse(req.body);

    await saveTrainingExample({
      userId: req.user.id,
      transactionDescription: validated.transactionDescription,
      transactionAmount: validated.transactionAmount ? parseFloat(validated.transactionAmount) : undefined,
      merchantName: validated.merchantName || undefined,
      aiSuggestedCategoryId: validated.aiSuggestedCategoryId || undefined,
      aiSuggestedTagId: validated.aiSuggestedTagId || undefined,
      aiConfidence: validated.aiConfidence || undefined,
      userChosenCategoryId: validated.userChosenCategoryId || undefined,
      userChosenTagId: validated.userChosenTagId || undefined,
      userChosenType: validated.userChosenType || "discretionary",
    });

    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error("Save training example error:", error);
    res.status(400).json({ error: error.message });
  }
}));

// GET /api/ai/training/history
router.get("/training/history", withAuth(async (req, res) => {
  try {
    const rawLimit = parseInt(req.query.limit as string);
    const rawOffset = parseInt(req.query.offset as string);

    const limit = Math.min(Math.max(isNaN(rawLimit) ? 50 : rawLimit, 1), 100);
    const offset = Math.max(isNaN(rawOffset) ? 0 : rawOffset, 0);

    const history = await getTrainingHistory(req.user.id, limit, offset);
    res.json(history);
  } catch (error: any) {
    console.error("Training history error:", error);
    res.status(500).json({ error: error.message });
  }
}));

// ========== RECEIPT WITH ITEMS ==========

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
    
    // Валидация
    if (!imageBase64) {
      return res.status(400).json({ 
        error: "imageBase64 is required" 
      });
    }
    
    // Получить API ключ пользователя
    const settings = await storage.getSettingsByUserId(userId);
    const anthropicApiKey = settings?.anthropicApiKey;
    
    if (!anthropicApiKey) {
      return res.status(400).json({
        error: "Anthropic API key not configured. Please add it in Settings."
      });
    }
    
    // Парсить чек с поддержкой разных форматов изображений
    const validMimeType = mimeType || 'image/jpeg';
    const parsed = await parseReceiptWithItems(imageBase64, anthropicApiKey, validMimeType);
    
    // Если transactionId указан - привязать товары к транзакции
    if (transactionId) {
      const txId = parseInt(transactionId);
      if (isNaN(txId)) {
        return res.status(400).json({ error: "Invalid transactionId" });
      }
      
      // Verify transaction ownership
      const transaction = await storage.getTransactionById(txId);
      if (!transaction || transaction.userId !== userId) {
        return res.status(403).json({ error: "Transaction not found or access denied" });
      }
      
      // Use transaction's currency for items (receipt amounts are in same currency as transaction)
      const items = parsed.items.map(item => ({
        transactionId: txId,
        itemName: item.name,
        normalizedName: item.normalizedName || item.name, // Fallback to original name if normalization failed
        quantity: (item.quantity ?? 1).toString(), // Default to 1 if not specified
        pricePerUnit: (item.pricePerUnit ?? 0).toString(), // Prevent crashes if missing
        totalPrice: (item.totalPrice ?? 0).toString(), // Prevent crashes if missing
        currency: transaction.currency, // Use transaction's currency
        merchantName: parsed.merchant || '', // Default to empty string if parser didn't find merchant
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

// GET /api/ai/price-recommendations
router.get("/price-recommendations", withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    const includeInsights = req.query.includeInsights === 'true';
    
    // Get all receipt items for this user
    const allItems = await receiptItemsRepository.getAllByUserId(userId);
    
    if (allItems.length === 0) {
      return res.json({
        recommendations: [],
        totalPotentialSavings: 0,
        averageSavingsPercent: 0,
        aiInsights: null
      });
    }
    
    // Compare prices (no API key needed for local comparison)
    const comparisonResult = await comparePrices(allItems);
    
    // Optionally generate AI insights
    let aiInsights = null;
    if (includeInsights && comparisonResult.recommendations.length > 0) {
      const anthropicApiKey = req.headers['x-anthropic-key'] as string;
      if (anthropicApiKey) {
        try {
          aiInsights = await getAIPriceInsights(
            comparisonResult.recommendations,
            anthropicApiKey
          );
        } catch (error) {
          console.error("AI insights generation failed:", error);
          // Don't fail the whole request if insights fail
        }
      }
    }
    
    res.json({
      ...comparisonResult,
      aiInsights
    });
  } catch (error: any) {
    console.error("Price recommendations error:", error);
    res.status(500).json({ error: error.message });
  }
}));

export default router;
