import { Router } from "express";
import { storage } from "../storage";
import { insertWishlistSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";

const router = Router();

// GET /api/wishlist
router.get("/", withAuth(async (req, res) => {
  try {
    const wishlist = await storage.getWishlistByUserId(req.user.id);
    res.json(wishlist);
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
    res.json(wishlistItem);
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
    res.json(updated);
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
