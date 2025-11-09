import { Router } from "express";
import { storage } from "../storage";
import { insertBudgetSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";

const router = Router();

// GET /api/budgets
router.get("/", withAuth(async (req, res) => {
  try {
    const budgets = await storage.getBudgetsByUserId(req.user.id);
    res.json(budgets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
      if (!category || category.userId !== req.user.id) {
        return res.status(400).json({ error: "Invalid category" });
      }
    }
    
    // Add userId from authenticated session (trusted source)
    const data = { ...validated, userId: req.user.id };
    
    const budget = await storage.createBudget(data);
    res.json(budget);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// PATCH /api/budgets/:id
router.patch("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // 🔒 Security: Verify ownership BEFORE allowing update
    const budget = await storage.getBudgetById(id);
    if (!budget || budget.userId !== req.user.id) {
      return res.status(404).json({ error: "Budget not found" });
    }
    
    // 🔒 Security: Remove userId from client payload BEFORE validation
    const { userId, ...sanitizedBody } = req.body;
    
    // Parse sanitized input (userId NOT in schema anymore)
    const data = insertBudgetSchema.partial().parse(sanitizedBody);
    
    // 🔒 Security: Verify categoryId ownership if being updated
    if (data.categoryId) {
      const category = await storage.getCategoryById(data.categoryId);
      if (!category || category.userId !== req.user.id) {
        return res.status(400).json({ error: "Invalid category" });
      }
    }
    
    // Update budget (userId already verified above, no need to pass it)
    const updated = await storage.updateBudget(id, data);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// DELETE /api/budgets/:id
router.delete("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const budget = await storage.getBudgetById(id);
    if (!budget || budget.userId !== req.user.id) {
      return res.status(404).json({ error: "Budget not found" });
    }
    
    await storage.deleteBudget(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

export default router;
