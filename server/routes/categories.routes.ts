import { Router } from "express";
import { storage } from "../storage";
import { insertCategorySchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";

const router = Router();

// GET /api/categories
router.get("/", withAuth(async (req, res) => {
  try {
    const categories = await storage.getCategoriesByUserId(req.user.id);
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/categories
router.post("/", withAuth(async (req, res) => {
  try {
    const data = insertCategorySchema.parse({
      ...req.body,
      userId: req.user.id,
    });
    const category = await storage.createCategory(data);
    res.json(category);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// DELETE /api/categories/:id
router.delete("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const category = await storage.getCategoryById(id);
    if (!category || category.userId !== req.user.id) {
      return res.status(404).json({ error: "Category not found" });
    }
    await storage.deleteCategory(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

export default router;
