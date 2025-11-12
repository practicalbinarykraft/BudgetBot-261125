import { Router } from "express";
import { storage } from "../storage";
import { insertSettingsSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { invalidateUserRateCache } from "../services/currency-service";
import { updateScheduleForUser } from "../services/notification-scheduler.service";

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
    
    // Update exchangeRatesUpdatedAt if rates are being changed
    if (data.exchangeRateRUB !== undefined || data.exchangeRateIDR !== undefined) {
      (data as any).exchangeRatesUpdatedAt = new Date();
    }
    
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
    
    // Invalidate exchange rate cache if rates were updated
    if (data.exchangeRateRUB !== undefined || data.exchangeRateIDR !== undefined) {
      invalidateUserRateCache(req.user.id);
    }
    
    // Update notification schedule if notification settings were changed
    if (data.timezone !== undefined || data.notificationTime !== undefined || data.telegramNotifications !== undefined) {
      await updateScheduleForUser(req.user.id);
    }
    
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

export default router;
