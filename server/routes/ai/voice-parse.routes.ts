/**
 * Voice Parse Routes
 *
 * Combines audio transcription (Whisper) + deterministic parsing + AI parsing (DeepSeek)
 * for structured transaction extraction from voice input.
 *
 * Currency & amount are detected deterministically (regex) — LLM only fills gaps.
 */

import { Router } from "express";
import { withAuth } from "../../middleware/auth-utils";
import { getApiKey } from "../../services/api-key-manager";
import { chargeCredits } from "../../services/billing.service";
import { parseTransactionWithDeepSeek } from "../../services/deepseek.service";
import {
  detectCurrencyFromText,
  extractAmountFromText,
  cleanDescription,
  detectTypeFromText,
} from "../../services/voice-parse-utils";
import { BillingError } from "../../types/billing";
import { getErrorMessage } from "../../lib/errors";
import { settingsRepository } from "../../repositories/settings.repository";
import OpenAI from "openai";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { tmpdir } from "os";
import { logInfo, logError } from '../../lib/logger';

const router = Router();

interface VoiceParseRequest {
  audioBase64: string;
  mimeType?: string;
  language?: 'en' | 'ru';
}

interface ParsedTransaction {
  amount: string;
  currency: string;
  description: string;
  category?: string;
  type: 'income' | 'expense';
  confidence: 'high' | 'medium' | 'low';
}

router.post("/voice-parse", withAuth(async (req, res) => {
  let tempFilePath: string | null = null;

  try {
    const { audioBase64, mimeType, language } = req.body as VoiceParseRequest;
    const userId = Number(req.user.id);

    if (!audioBase64) {
      return res.status(400).json({ success: false, error: "audioBase64 is required" });
    }

    // Get user's preferred currency
    const userSettings = await settingsRepository.getSettingsByUserId(userId);
    const userCurrency = userSettings?.currency || 'USD';

    // ========== STEP 1: Get API key for transcription ==========
    let whisperApiKey;
    try {
      whisperApiKey = await getApiKey(userId, 'voice_transcription');
    } catch (error) {
      if (error instanceof BillingError && error.code === 'INSUFFICIENT_CREDITS') {
        return res.status(402).json({
          success: false, error: "Insufficient credits", code: "INSUFFICIENT_CREDITS"
        });
      }
      throw error;
    }

    // ========== STEP 2: Decode and save audio file ==========
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    let extension = 'wav';
    if (mimeType) {
      if (mimeType.includes('mp4') || mimeType.includes('m4a') || mimeType.includes('aac')) {
        extension = 'm4a';
      } else if (mimeType.includes('webm')) {
        extension = 'webm';
      } else if (mimeType.includes('ogg')) {
        extension = 'ogg';
      } else if (mimeType.includes('mp3')) {
        extension = 'mp3';
      }
    }

    tempFilePath = path.join(tmpdir(), `voice_web_${Date.now()}.${extension}`);
    await fsp.writeFile(tempFilePath, audioBuffer);

    logInfo(`📁 [User ${userId}] Saved audio:`, {
      size: `${Math.round(audioBuffer.length / 1024)}KB`,
      mimeType: mimeType || 'unknown', extension,
    });

    // ========== STEP 3: Transcribe with Whisper ==========
    const openai = new OpenAI({ apiKey: whisperApiKey.key });
    const audioStream = fs.createReadStream(tempFilePath);

    let transcription: string;
    try {
      const result = await openai.audio.transcriptions.create({
        file: audioStream,
        model: 'whisper-1',
        language: language || undefined,
        response_format: 'text',
      });
      transcription = typeof result === 'string' ? result : String(result);
      transcription = transcription.trim();
      logInfo(`🎤 [User ${userId}] Transcription: "${transcription}"`);
    } catch (error: any) {
      logError(`❌ [User ${userId}] Whisper error:`, error);
      if (error?.status === 401) {
        return res.status(401).json({ success: false, error: "Invalid OpenAI API key", code: "INVALID_API_KEY" });
      }
      return res.status(500).json({ success: false, error: "Failed to transcribe audio", details: getErrorMessage(error) });
    }

    // Charge for transcription
    let creditsUsed = 0;
    if (whisperApiKey.shouldCharge) {
      const durationEstimate = Math.max(audioBuffer.length / 16000, 1);
      await chargeCredits(userId, 'voice_transcription', whisperApiKey.provider,
        { input: Math.ceil(durationEstimate * 100), output: 0 }, whisperApiKey.billingMode === 'free');
      creditsUsed += 1;
    }

    // ========== STEP 4: Deterministic parsing (regex) ==========
    const detectedCurrency = detectCurrencyFromText(transcription);
    const detectedAmount = extractAmountFromText(transcription);
    const detectedDescription = cleanDescription(transcription);
    const detectedType = detectTypeFromText(transcription);

    logInfo(`🔍 [User ${userId}] Deterministic:`, {
      currency: detectedCurrency, amount: detectedAmount,
      description: detectedDescription, type: detectedType,
    });

    // ========== STEP 5: AI parsing (fills gaps: category, better description) ==========
    let parsed: ParsedTransaction;

    try {
      const parseApiKey = await getApiKey(userId, 'voice_normalization');
      const parseResult = await parseTransactionWithDeepSeek(parseApiKey.key, transcription, userCurrency);

      parsed = {
        // Deterministic values OVERRIDE LLM when available
        amount: String(detectedAmount ?? parseResult.amount ?? 0),
        currency: detectedCurrency || parseResult.currency || userCurrency,
        description: detectedDescription || parseResult.description || transcription,
        category: parseResult.category,
        type: detectedType,
        confidence: (detectedAmount && detectedAmount > 0) ? 'high' : (parseResult.amount > 0 ? 'medium' : 'low'),
      };

      if (parseApiKey.shouldCharge) {
        await chargeCredits(userId, 'voice_normalization', parseApiKey.provider,
          { input: transcription.length * 4, output: 200 }, parseApiKey.billingMode === 'free');
        creditsUsed += 1;
      }

    } catch (parseError) {
      logError(`⚠️ [User ${userId}] LLM parse failed, using deterministic only:`, parseError);

      parsed = {
        amount: String(detectedAmount ?? 0),
        currency: detectedCurrency || userCurrency,
        description: detectedDescription || transcription,
        type: detectedType,
        confidence: detectedAmount ? 'medium' : 'low',
      };
    }

    logInfo(`✅ [User ${userId}] Final parsed:`, parsed);

    // ========== STEP 6: Return result ==========
    res.json({ success: true, transcription, parsed, creditsUsed });

  } catch (error: unknown) {
    logError("💥 Voice parse error:", error);
    if (error instanceof BillingError) {
      return res.status(402).json({ success: false, error: error.message, code: error.code });
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false, error: "Failed to process voice input",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    });
  } finally {
    if (tempFilePath) {
      fsp.unlink(tempFilePath).catch(() => {});
    }
  }
}));

/**
 * POST /api/ai/parse-text — same logic for text input
 */
router.post("/parse-text", withAuth(async (req, res) => {
  try {
    const { text } = req.body as { text: string };
    const userId = Number(req.user.id);

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: "text is required" });
    }

    const userSettings = await settingsRepository.getSettingsByUserId(userId);
    const userCurrency = userSettings?.currency || 'USD';

    // Deterministic first
    const detectedCurrency = detectCurrencyFromText(text);
    const detectedAmount = extractAmountFromText(text);
    const detectedDescription = cleanDescription(text);
    const detectedType = detectTypeFromText(text);

    let parseApiKey;
    try {
      parseApiKey = await getApiKey(userId, 'voice_normalization');
    } catch (error) {
      if (error instanceof BillingError && error.code === 'INSUFFICIENT_CREDITS') {
        return res.status(402).json({ success: false, error: "Insufficient credits", code: "INSUFFICIENT_CREDITS" });
      }
      throw error;
    }

    let parsed: ParsedTransaction;
    let creditsUsed = 0;

    try {
      const parseResult = await parseTransactionWithDeepSeek(parseApiKey.key, text, userCurrency);

      parsed = {
        amount: String(detectedAmount ?? parseResult.amount ?? 0),
        currency: detectedCurrency || parseResult.currency || userCurrency,
        description: detectedDescription || parseResult.description || text,
        category: parseResult.category,
        type: detectedType,
        confidence: (detectedAmount && detectedAmount > 0) ? 'high' : (parseResult.amount > 0 ? 'medium' : 'low'),
      };

      if (parseApiKey.shouldCharge) {
        await chargeCredits(userId, 'voice_normalization', parseApiKey.provider,
          { input: text.length * 4, output: 200 }, parseApiKey.billingMode === 'free');
        creditsUsed = 1;
      }
    } catch (parseError) {
      logError(`⚠️ [User ${userId}] AI parse error:`, parseError);
      return res.status(500).json({ success: false, error: "AI parsing failed", details: getErrorMessage(parseError) });
    }

    res.json({ success: true, parsed, creditsUsed });

  } catch (error: unknown) {
    logError("💥 Parse text error:", error);
    if (error instanceof BillingError) {
      return res.status(402).json({ success: false, error: error.message, code: error.code });
    }
    res.status(500).json({
      success: false, error: "Failed to parse text",
      details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined,
    });
  }
}));

export default router;
