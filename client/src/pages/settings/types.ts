/**
 * Settings Page Types
 *
 * Shared types and interfaces for settings components
 * Junior-Friendly: <50 lines, centralized types
 */

import { insertSettingsSchema } from "@shared/schema";
import { z } from "zod";

export type FormData = z.infer<typeof insertSettingsSchema>;

export interface TelegramStatus {
  connected: boolean;
  username: string | null;
}

export interface VerificationCodeResponse {
  code: string;
  expiresAt: string;
  ttlMinutes: number;
}
