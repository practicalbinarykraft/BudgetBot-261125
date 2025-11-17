import { Router } from "express";
import { withAuth } from "../../middleware/auth-utils";
import { receiptItemsRepository } from "../../repositories/receipt-items.repository";
import { comparePrices, getAIPriceInsights } from "../../services/ai/price-comparison.service";

const router = Router();

// GET /api/ai/price-recommendations
router.get("/price-recommendations", withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
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
      const anthropicApiKey = req.headers['x-anthropic-key'] as string;
      if (anthropicApiKey) {
        try {
          aiInsights = await getAIPriceInsights(
            comparisonResult.recommendations,
            anthropicApiKey
          );
        } catch (error) {
          console.error("AI insights generation failed:", error);
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
