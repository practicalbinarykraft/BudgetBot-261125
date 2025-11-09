import { Router } from "express";
import { storage } from "../storage";
import { insertSettingsSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";

const router = Router();

// GET /api/settings
router.get("/", withAuth(async (req, res) => {
  try {
    let settings = await storage.getSettingsByUserId(req.user.id);
    if (!settings) {
      // Create default settings if they don't exist
      settings = await storage.createSettings({
        userId: req.user.id,
        language: "en",
        currency: "USD",
        telegramNotifications: true,
      });
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

// PATCH /api/settings
router.patch("/", withAuth(async (req, res) => {
  try {
    // 🔒 Security: Strip userId from client payload
    const { userId, ...sanitizedBody } = req.body;
    
    const data = insertSettingsSchema.partial().parse(sanitizedBody);
    let settings = await storage.getSettingsByUserId(req.user.id);
    
    if (!settings) {
      settings = await storage.createSettings({
        userId: req.user.id,
        language: data.language || "en",
        currency: data.currency || "USD",
        telegramNotifications: data.telegramNotifications ?? true,
      });
    } else {
      settings = await storage.updateSettings(req.user.id, data);
    }
    
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

export default router;
