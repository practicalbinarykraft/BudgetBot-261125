import { Router } from "express";
import { storage } from "../storage";
import { settingsRepository } from "../repositories/settings.repository";
import { insertSettingsSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { invalidateUserRateCache } from "../services/currency-service";
import { updateScheduleForUser } from "../services/notification-scheduler.service";
import { getErrorMessage } from "../lib/errors";

const router = Router();

// GET /api/settings
router.get("/", withAuth(async (req, res) => {
  try {
    let settings = await storage.getSettingsByUserId(Number(req.user.id));
    if (!settings) {
      // Create default settings if they don't exist
      settings = await storage.createSettings({
        userId: Number(req.user.id),
        language: "en",
        currency: "USD",
        telegramNotifications: true,
      });
    }

    // 🔐 Decrypt API keys before sending to client (for display purposes)
    // Frontend needs to know if key exists, but we send masked version
    const response = {
      ...settings,
      // Return decrypted keys so frontend can check if they exist
      // User will see masked input like "sk-ant-...****"
      anthropicApiKey: settings.anthropicApiKeyEncrypted
        ? await settingsRepository.getAnthropicApiKey(Number(req.user.id))
        : settings.anthropicApiKey, // Fallback for legacy unencrypted keys
      openaiApiKey: settings.openaiApiKeyEncrypted
        ? await settingsRepository.getOpenAiApiKey(Number(req.user.id))
        : settings.openaiApiKey, // Fallback for legacy unencrypted keys
    };

    res.json(response);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// PATCH /api/settings
router.patch("/", withAuth(async (req, res) => {
  try {
    // 🔒 Security: Strip userId from client payload
    const { userId, anthropicApiKey, openaiApiKey, ...sanitizedBody } = req.body;

    const data = insertSettingsSchema.partial().parse(sanitizedBody);

    // Update exchangeRatesUpdatedAt if any exchange rate is being changed
    if (
      data.exchangeRateRUB !== undefined ||
      data.exchangeRateIDR !== undefined ||
      data.exchangeRateKRW !== undefined ||
      data.exchangeRateEUR !== undefined ||
      data.exchangeRateCNY !== undefined
    ) {
      (data as any).exchangeRatesUpdatedAt = new Date();
    }

    let settings = await storage.getSettingsByUserId(Number(req.user.id));

    if (!settings) {
      settings = await storage.createSettings({
        userId: Number(req.user.id),
        language: data.language || "en",
        currency: data.currency || "USD",
        telegramNotifications: data.telegramNotifications ?? true,
      });
    } else {
      settings = await storage.updateSettings(Number(req.user.id), data);
    }

    // 🔐 Handle API keys separately with encryption
    if (anthropicApiKey !== undefined) {
      if (anthropicApiKey === "" || anthropicApiKey === null) {
        // Delete key if empty
        await settingsRepository.deleteApiKeys(Number(req.user.id));
      } else {
        // Encrypt and save
        await settingsRepository.saveAnthropicApiKey(Number(req.user.id), anthropicApiKey);
      }
    }

    if (openaiApiKey !== undefined) {
      if (openaiApiKey === "" || openaiApiKey === null) {
        // Clear only OpenAI key (keep Anthropic if exists)
        await storage.updateSettings(Number(req.user.id), {
          openaiApiKeyEncrypted: null,
          openaiApiKey: null,
        });
      } else {
        // Encrypt and save
        await settingsRepository.saveOpenAiApiKey(Number(req.user.id), openaiApiKey);
      }
    }

    // Refresh settings after API key updates
    settings = await storage.getSettingsByUserId(Number(req.user.id));

    // Invalidate exchange rate cache if any rate was updated
    if (
      data.exchangeRateRUB !== undefined ||
      data.exchangeRateIDR !== undefined ||
      data.exchangeRateKRW !== undefined ||
      data.exchangeRateEUR !== undefined ||
      data.exchangeRateCNY !== undefined
    ) {
      invalidateUserRateCache(Number(req.user.id));
    }

    // Update notification schedule if notification settings were changed
    if (data.timezone !== undefined || data.notificationTime !== undefined || data.telegramNotifications !== undefined) {
      await updateScheduleForUser(Number(req.user.id));
    }

    // 🔐 Return decrypted keys in response (for frontend display)
    const response = {
      ...settings!,
      anthropicApiKey: settings!.anthropicApiKeyEncrypted
        ? await settingsRepository.getAnthropicApiKey(Number(req.user.id))
        : settings!.anthropicApiKey,
      openaiApiKey: settings!.openaiApiKeyEncrypted
        ? await settingsRepository.getOpenAiApiKey(Number(req.user.id))
        : settings!.openaiApiKey,
    };

    res.json(response);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

export default router;
