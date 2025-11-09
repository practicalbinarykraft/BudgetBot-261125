import { Router } from "express";
import { storage } from "../storage";
import { insertWalletSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";

const router = Router();

// GET /api/wallets
router.get("/", withAuth(async (req, res) => {
  try {
    const wallets = await storage.getWalletsByUserId(req.user.id);
    res.json(wallets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/wallets
router.post("/", withAuth(async (req, res) => {
  try {
    const data = insertWalletSchema.parse({
      ...req.body,
      userId: req.user.id,
    });
    const wallet = await storage.createWallet(data);
    res.json(wallet);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// DELETE /api/wallets/:id
router.delete("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const wallet = await storage.getWalletById(id);
    if (!wallet || wallet.userId !== req.user.id) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    await storage.deleteWallet(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

export default router;
