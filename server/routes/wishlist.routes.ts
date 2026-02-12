import { Router } from "express";
import { storage } from "../storage";
import { insertWishlistSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { predictGoal, predictGoalWithStats } from "../services/goal-predictor.service";
import { getMonthlyStats, getTotalBudgetLimits } from "../services/budget-stats.service";
import { getErrorMessage } from "../lib/errors";

const router = Router();

// GET /api/wishlist
router.get("/", withAuth(async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const wishlist = await storage.getWishlistByUserId(userId);

    // Compute stats ONCE for all items (avoid N+1 queries)
    const stats = await getMonthlyStats(userId);
    const budgetLimits = await getTotalBudgetLimits(userId);
    
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
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// POST /api/wishlist
router.post("/", withAuth(async (req, res) => {
  try {
    const data = insertWishlistSchema.parse({
      ...req.body,
      userId: Number(req.user.id),
    });
    const wishlistItem = await storage.createWishlist(data);

    // Add AI prediction to response (guard against invalid amount)
    const amount = parseFloat(wishlistItem.amount);
    const prediction = (!isNaN(amount) && amount > 0)
      ? await predictGoal(Number(req.user.id), amount)
      : null;
    
    res.json({
      ...wishlistItem,
      prediction,
    });
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

// PATCH /api/wishlist/:id
router.patch("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const wishlistItem = await storage.getWishlistById(id);
    if (!wishlistItem || wishlistItem.userId !== Number(req.user.id)) {
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
      ? await predictGoal(Number(req.user.id), amount)
      : null;
    
    res.json({
      ...updated,
      prediction,
    });
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

// PATCH /api/wishlist/reorder
router.patch("/reorder", withAuth(async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const items = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Expected non-empty array of { id, sortOrder }" });
    }

    // Validate each item has id and sortOrder
    const sortOrders = new Set<number>();
    for (const item of items) {
      if (typeof item.id !== "number" || typeof item.sortOrder !== "number") {
        return res.status(400).json({ error: "Each item must have numeric id and sortOrder" });
      }
      if (item.sortOrder < 1) {
        return res.status(400).json({ error: "sortOrder must be >= 1" });
      }
      if (sortOrders.has(item.sortOrder)) {
        return res.status(400).json({ error: "Duplicate sortOrder values" });
      }
      sortOrders.add(item.sortOrder);
    }

    await storage.reorderWishlist(userId, items);

    // Return updated list with predictions
    const wishlist = await storage.getWishlistByUserId(userId);
    const stats = await getMonthlyStats(userId);
    const budgetLimits = await getTotalBudgetLimits(userId);

    const wishlistWithPredictions = wishlist.map((item) => {
      const amount = parseFloat(item.amount);
      if (isNaN(amount) || amount <= 0) {
        return { ...item, prediction: null };
      }
      const prediction = predictGoalWithStats(amount, stats, budgetLimits);
      return { ...item, prediction };
    });

    res.json(wishlistWithPredictions);
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg.includes("not found or not owned")) {
      return res.status(403).json({ error: msg });
    }
    res.status(400).json({ error: msg });
  }
}));

// DELETE /api/wishlist/:id
router.delete("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const wishlistItem = await storage.getWishlistById(id);
    if (!wishlistItem || wishlistItem.userId !== Number(req.user.id)) {
      return res.status(404).json({ error: "Wishlist item not found" });
    }
    await storage.deleteWishlist(id);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

export default router;
