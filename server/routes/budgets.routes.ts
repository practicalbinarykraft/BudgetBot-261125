import { Router } from "express";
import { storage } from "../storage";
import { insertBudgetSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { getErrorMessage } from "../lib/errors";

const router = Router();

// GET /api/budgets
// Supports pagination: ?limit=100&offset=0
router.get("/", withAuth(async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const filters: { limit?: number; offset?: number } = {};

    // Parse and validate pagination parameters
    if (limit) {
      const limitNum = parseInt(String(limit));
      if (isNaN(limitNum) || limitNum <= 0) {
        return res.status(400).json({ error: "Invalid limit parameter. Must be a positive integer." });
      }
      if (limitNum > 1000) {
        return res.status(400).json({ error: "Limit cannot exceed 1000. Please use pagination for large datasets." });
      }
      filters.limit = limitNum;
    }

    if (offset) {
      const offsetNum = parseInt(String(offset));
      if (isNaN(offsetNum) || offsetNum < 0) {
        return res.status(400).json({ error: "Invalid offset parameter. Must be a non-negative integer." });
      }
      filters.offset = offsetNum;
    }

    const result = await storage.getBudgetsByUserId(Number(req.user.id), filters);

    // Unified response: always { data, pagination }
    const effectiveLimit = filters.limit ?? 100;
    const effectiveOffset = filters.offset ?? 0;
    const response = {
      data: result.budgets,
      pagination: {
        total: result.total,
        limit: effectiveLimit,
        offset: effectiveOffset,
        hasMore: effectiveOffset + result.budgets.length < result.total,
      },
    };

    res.json(response);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// POST /api/budgets
router.post("/", withAuth(async (req, res) => {
  try {
    // 🔒 Security: Remove userId from client payload BEFORE validation
    const { userId, ...sanitizedBody } = req.body;
    
    // Parse sanitized input (userId NOT in schema anymore)
    const validated = insertBudgetSchema.parse(sanitizedBody);
    
    // 🔒 Security: Verify categoryId ownership if provided
    if (validated.categoryId) {
      const category = await storage.getCategoryById(validated.categoryId);
      if (!category || category.userId !== Number(req.user.id)) {
        return res.status(400).json({ error: "Invalid category" });
      }
    }

    // Add userId from authenticated session (trusted source)
    const data = { ...validated, userId: Number(req.user.id) };
    
    const budget = await storage.createBudget(data);
    res.json(budget);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

// PATCH /api/budgets/:id
router.patch("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // 🔒 Security: Verify ownership BEFORE allowing update
    const budget = await storage.getBudgetById(id);
    if (!budget || budget.userId !== Number(req.user.id)) {
      return res.status(404).json({ error: "Budget not found" });
    }

    // 🔒 Security: Remove userId from client payload BEFORE validation
    const { userId, ...sanitizedBody } = req.body;

    // Parse sanitized input (userId NOT in schema anymore)
    const data = insertBudgetSchema.partial().parse(sanitizedBody);

    // 🔒 Security: Verify categoryId ownership if being updated
    if (data.categoryId) {
      const category = await storage.getCategoryById(data.categoryId);
      if (!category || category.userId !== Number(req.user.id)) {
        return res.status(400).json({ error: "Invalid category" });
      }
    }
    
    // Update budget (userId already verified above, no need to pass it)
    const updated = await storage.updateBudget(id, data);
    res.json(updated);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

// DELETE /api/budgets/:id
router.delete("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const budget = await storage.getBudgetById(id);
    if (!budget || budget.userId !== Number(req.user.id)) {
      return res.status(404).json({ error: "Budget not found" });
    }

    await storage.deleteBudget(id);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

export default router;
