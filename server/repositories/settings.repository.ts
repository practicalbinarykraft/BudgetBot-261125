import { db } from "../db";
import { settings, InsertSettings, Settings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt, decryptIfNeeded } from "../lib/encryption";
import { logError } from '../lib/logger';

export class SettingsRepository {
    async getSettingsByUserId(userId: number): Promise<Settings | null> {
        const result = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
        return result[0] || null;
    }

    async createSettings(settingsData: InsertSettings): Promise<Settings> {
        const result = await db.insert(settings).values(settingsData).returning();
        return result[0];
    }

    async updateSettings(userId: number, settingsData: Partial<InsertSettings>): Promise<Settings> {
        const result = await db.update(settings).set(settingsData).where(eq(settings.userId, userId)).returning();
        return result[0];
    }

    /**
     * 🔐 Get decrypted Anthropic API key for user
     * Handles both legacy (unencrypted) and new (encrypted) formats
     */
    async getAnthropicApiKey(userId: number): Promise<string | null> {
        const setting = await this.getSettingsByUserId(userId);
        if (!setting) return null;

        // Priority: encrypted field first, then legacy field
        if (setting.anthropicApiKeyEncrypted) {
            try {
                return decrypt(setting.anthropicApiKeyEncrypted);
            } catch (err) {
                logError(`Failed to decrypt Anthropic API key for user ${userId}:`, err);
                return null;
            }
        }

        // Fallback to legacy unencrypted field (for backward compatibility during migration)
        if (setting.anthropicApiKey) {
            return decryptIfNeeded(setting.anthropicApiKey);
        }

        return null;
    }

    /**
     * 🔐 Get decrypted OpenAI API key for user
     * Handles both legacy (unencrypted) and new (encrypted) formats
     */
    async getOpenAiApiKey(userId: number): Promise<string | null> {
        const setting = await this.getSettingsByUserId(userId);
        if (!setting) return null;

        // Priority: encrypted field first, then legacy field
        if (setting.openaiApiKeyEncrypted) {
            try {
                return decrypt(setting.openaiApiKeyEncrypted);
            } catch (err) {
                logError(`Failed to decrypt OpenAI API key for user ${userId}:`, err);
                return null;
            }
        }

        // Fallback to legacy unencrypted field (for backward compatibility during migration)
        if (setting.openaiApiKey) {
            return decryptIfNeeded(setting.openaiApiKey);
        }

        return null;
    }

    /**
     * 🔐 Save Anthropic API key (encrypted)
     * Automatically encrypts the key before storing
     */
    async saveAnthropicApiKey(userId: number, apiKey: string): Promise<void> {
        const encrypted = encrypt(apiKey);
        await db.update(settings)
            .set({
                anthropicApiKeyEncrypted: encrypted,
                // Clear legacy field to avoid confusion
                anthropicApiKey: null
            })
            .where(eq(settings.userId, userId));
    }

    /**
     * 🔐 Save OpenAI API key (encrypted)
     * Automatically encrypts the key before storing
     */
    async saveOpenAiApiKey(userId: number, apiKey: string): Promise<void> {
        const encrypted = encrypt(apiKey);
        await db.update(settings)
            .set({
                openaiApiKeyEncrypted: encrypted,
                // Clear legacy field to avoid confusion
                openaiApiKey: null
            })
            .where(eq(settings.userId, userId));
    }

    /**
     * 🔐 Delete API keys (both encrypted and legacy)
     */
    async deleteApiKeys(userId: number): Promise<void> {
        await db.update(settings)
            .set({
                anthropicApiKeyEncrypted: null,
                anthropicApiKey: null,
                openaiApiKeyEncrypted: null,
                openaiApiKey: null
            })
            .where(eq(settings.userId, userId));
    }
}

export const settingsRepository = new SettingsRepository();
