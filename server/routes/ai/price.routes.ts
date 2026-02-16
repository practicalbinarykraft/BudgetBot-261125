import { Router } from "express";
import { storage } from "../../storage";
import { withAuth } from "../../middleware/auth-utils";
import { receiptItemsRepository } from "../../repositories/receipt-items.repository";
import { comparePrices, getAIPriceInsights } from "../../services/ai/price-comparison.service";
import { getErrorMessage } from "../../lib/errors";
import { logError } from '../../lib/logger';

const router = Router();

// GET /api/ai/price-recommendations
router.get("/price-recommendations", withAuth(async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const includeInsights = req.query.includeInsights === 'true';
    
    const allItems = await receiptItemsRepository.getAllByUserId(userId);
    
    if (allItems.length === 0) {
      return res.json({
        recommendations: [],
        totalPotentialSavings: 0,
        averageSavingsPercent: 0,
        aiInsights: null
      });
    }
    
    const comparisonResult = await comparePrices(allItems);
    
    let aiInsights = null;
    if (includeInsights && comparisonResult.recommendations.length > 0) {
      // Get API key from user settings (BYOK pattern)
      const settings = await storage.getSettingsByUserId(userId);
      const anthropicApiKey = settings?.anthropicApiKey;
      
      if (anthropicApiKey) {
        try {
          aiInsights = await getAIPriceInsights(
            comparisonResult.recommendations,
            anthropicApiKey
          );
        } catch (error) {
          logError("AI insights generation failed:", error);
        }
      }
    }
    
    res.json({
      ...comparisonResult,
      aiInsights
    });
  } catch (error: unknown) {
    logError("Price recommendations error:", error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

export default router;
