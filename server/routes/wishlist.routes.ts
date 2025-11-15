import { Router } from "express";
import { storage } from "../storage";
import { insertWishlistSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { predictGoal, predictGoalWithStats } from "../services/goal-predictor.service";
import { getMonthlyStats, getTotalBudgetLimits } from "../services/budget-stats.service";

const router = Router();

// GET /api/wishlist
router.get("/", withAuth(async (req, res) => {
  try {
    const wishlist = await storage.getWishlistByUserId(req.user.id);
    
    // Compute stats ONCE for all items (avoid N+1 queries)
    const stats = await getMonthlyStats(req.user.id);
    const budgetLimits = await getTotalBudgetLimits(req.user.id);
    
    // Add AI predictions to each item using pre-computed stats
    const wishlistWithPredictions = wishlist.map((item) => {
      const amount = parseFloat(item.amount);
      
      // Guard: skip prediction if amount is invalid
      if (isNaN(amount) || amount <= 0) {
        return {
          ...item,
          prediction: null,
        };
      }
      
      const prediction = predictGoalWithStats(amount, stats, budgetLimits);
      return {
        ...item,
        prediction,
      };
    });
    
    res.json(wishlistWithPredictions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/wishlist
router.post("/", withAuth(async (req, res) => {
  try {
    const data = insertWishlistSchema.parse({
      ...req.body,
      userId: req.user.id,
    });
    const wishlistItem = await storage.createWishlist(data);
    
    // Add AI prediction to response (guard against invalid amount)
    const amount = parseFloat(wishlistItem.amount);
    const prediction = (!isNaN(amount) && amount > 0)
      ? await predictGoal(req.user.id, amount)
      : null;
    
    res.json({
      ...wishlistItem,
      prediction,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// PATCH /api/wishlist/:id
router.patch("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const wishlistItem = await storage.getWishlistById(id);
    if (!wishlistItem || wishlistItem.userId !== req.user.id) {
      return res.status(404).json({ error: "Wishlist item not found" });
    }
    
    // 🔒 Security: Strip userId from client payload
    const { userId, ...sanitizedBody } = req.body;
    
    // Validate update data
    const data = insertWishlistSchema.partial().parse(sanitizedBody);
    const updated = await storage.updateWishlist(id, data);
    
    // Add AI prediction to response (guard against invalid amount)
    const amount = parseFloat(updated.amount);
    const prediction = (!isNaN(amount) && amount > 0)
      ? await predictGoal(req.user.id, amount)
      : null;
    
    res.json({
      ...updated,
      prediction,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// DELETE /api/wishlist/:id
router.delete("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const wishlistItem = await storage.getWishlistById(id);
    if (!wishlistItem || wishlistItem.userId !== req.user.id) {
      return res.status(404).json({ error: "Wishlist item not found" });
    }
    await storage.deleteWishlist(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

export default router;
