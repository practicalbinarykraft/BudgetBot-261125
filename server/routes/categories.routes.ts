import { Router } from "express";
import { storage } from "../storage";
import { insertCategorySchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { cache, CACHE_TTL } from "../lib/redis";

const router = Router();

// GET /api/categories
router.get("/", withAuth(async (req, res) => {
  try {
    const { limit, offset } = req.query;

    const filters: {
      limit?: number;
      offset?: number;
    } = {};

    // Parse pagination parameters
    if (limit) {
      const limitNum = parseInt(String(limit));
      if (isNaN(limitNum) || limitNum <= 0) {
        return res.status(400).json({ error: "Invalid limit. Please provide a positive number." });
      }
      if (limitNum > 1000) {
        return res.status(400).json({ error: "Limit cannot exceed 1000 items." });
      }
      filters.limit = limitNum;
    }

    if (offset) {
      const offsetNum = parseInt(String(offset));
      if (isNaN(offsetNum) || offsetNum < 0) {
        return res.status(400).json({ error: "Invalid offset. Please provide a non-negative number." });
      }
      filters.offset = offsetNum;
    }

    // Build cache key based on pagination params
    const cacheKey = `categories:user:${req.user.id}:limit:${filters.limit || 'all'}:offset:${filters.offset || 0}`;

    // Try to get from cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // If not in cache, get from database
    const result = await storage.getCategoriesByUserId(req.user.id, filters);

    // Prepare response
    const response = filters.limit !== undefined || filters.offset !== undefined
      ? {
          data: result.categories,
          pagination: {
            total: result.total,
            limit: filters.limit,
            offset: filters.offset || 0,
          },
        }
      : result.categories; // Backward compatibility: return array if no pagination params

    // Store in cache for 30 minutes
    await cache.set(cacheKey, response, CACHE_TTL.LONG);

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/categories
router.post("/", withAuth(async (req, res) => {
  try {
    const data = insertCategorySchema.parse({
      ...req.body,
      userId: Number(req.user.id),
    });
    const category = await storage.createCategory(data);

    // Invalidate cache
    await cache.del(`categories:user:${req.user.id}`);

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

    // Invalidate cache
    await cache.del(`categories:user:${req.user.id}`);

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

export default router;
