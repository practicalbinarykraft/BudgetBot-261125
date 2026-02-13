import { Router } from "express";
import { storage } from "../storage";
import { insertCategorySchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { cache, CACHE_TTL } from "../lib/redis";
import { getErrorMessage } from "../lib/errors";
import { db } from "../db";
import { assets } from "@shared/schemas/assets.schema";
import { eq, and } from "drizzle-orm";

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

    const userId = Number(req.user.id);

    // Build cache key based on pagination params
    const cacheKey = `categories:user:${userId}:limit:${filters.limit || 'all'}:offset:${filters.offset || 0}`;

    // Try to get from cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // If not in cache, get from database
    const result = await storage.getCategoriesByUserId(userId, filters);

    // Always return unified { data, pagination } shape
    const effectiveLimit = filters.limit ?? 100;
    const effectiveOffset = filters.offset ?? 0;
    const response = {
      data: result.categories,
      pagination: {
        total: result.total,
        limit: effectiveLimit,
        offset: effectiveOffset,
        hasMore: effectiveOffset + result.categories.length < result.total,
      },
    };

    // Store in cache for 30 minutes
    await cache.set(cacheKey, response, CACHE_TTL.LONG);

    res.json(response);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
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

    // Invalidate all cached category queries for this user
    await cache.delPattern(`categories:user:${Number(req.user.id)}:*`);

    res.json(category);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

// GET /api/categories/:id/assets-count - Count assets in category
router.get("/:id/assets-count", withAuth(async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const userId = Number(req.user.id);

    // Verify category belongs to user
    const category = await storage.getCategoryById(categoryId);
    if (!category || category.userId !== userId) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Count assets in this category
    const result = await db
      .select()
      .from(assets)
      .where(and(
        eq(assets.categoryId, categoryId),
        eq(assets.userId, userId)
      ));

    res.json({ count: result.length, categoryName: category.name });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// PATCH /api/categories/:id
router.patch("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = Number(req.user.id);
    const category = await storage.getCategoryById(id);
    if (!category || category.userId !== userId) {
      return res.status(404).json({ error: "Category not found" });
    }

    const { name, icon, color } = req.body;
    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;

    const updated = await storage.updateCategory(id, updateData);

    // Invalidate all cached category queries for this user
    await cache.delPattern(`categories:user:${userId}:*`);

    res.json(updated);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

// DELETE /api/categories/:id
router.delete("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const category = await storage.getCategoryById(id);
    if (!category || category.userId !== Number(req.user.id)) {
      return res.status(404).json({ error: "Category not found" });
    }
    await storage.deleteCategory(id);

    // Invalidate all cached category queries for this user
    await cache.delPattern(`categories:user:${Number(req.user.id)}:*`);

    res.json({ success: true });
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

export default router;
