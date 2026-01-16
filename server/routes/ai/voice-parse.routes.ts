/**
 * Voice Parse Routes
 *
 * Combines audio transcription (Whisper) + AI parsing (DeepSeek/Claude)
 * for structured transaction extraction from voice input
 */

import { Router } from "express";
import { withAuth } from "../../middleware/auth-utils";
import { getApiKey } from "../../services/api-key-manager";
import { chargeCredits } from "../../services/billing.service";
import { parseTransactionWithDeepSeek } from "../../services/deepseek.service";
import { BillingError } from "../../types/billing";
import { getErrorMessage } from "../../lib/errors";
import { settingsRepository } from "../../repositories/settings.repository";
import OpenAI from "openai";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { tmpdir } from "os";

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

/**
 * POST /api/ai/voice-parse
 *
 * Transcribe audio and parse into structured transaction data
 *
 * Body:
 * - audioBase64: Base64-encoded audio data
 * - mimeType: Audio MIME type (audio/webm, audio/ogg, audio/wav)
 * - language?: Optional language code ('en' or 'ru')
 *
 * Response:
 * {
 *   success: true,
 *   transcription: "Пицца 50 000 рупий",
 *   parsed: {
 *     amount: "50000",
 *     currency: "IDR",
 *     description: "Пицца",
 *     category: "Food & Dining",
 *     type: "expense",
 *     confidence: "high"
 *   },
 *   creditsUsed: 2
 * }
 */
router.post("/voice-parse", withAuth(async (req, res) => {
  let tempFilePath: string | null = null;

  try {
    const { audioBase64, mimeType, language } = req.body as VoiceParseRequest;
    const userId = Number(req.user.id);

    if (!audioBase64) {
      return res.status(400).json({
        success: false,
        error: "audioBase64 is required"
      });
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
          success: false,
          error: "Insufficient credits for voice transcription",
          code: "INSUFFICIENT_CREDITS"
        });
      }
      throw error;
    }

    // ========== STEP 2: Decode and save audio file ==========
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const extension = mimeType?.includes('webm') ? 'webm' :
                      mimeType?.includes('ogg') ? 'ogg' :
                      mimeType?.includes('mp3') ? 'mp3' : 'wav';
    tempFilePath = path.join(tmpdir(), `voice_web_${Date.now()}.${extension}`);
    await fsp.writeFile(tempFilePath, audioBuffer);

    console.log(`📁 [User ${userId}] Saved audio file: ${tempFilePath} (${audioBuffer.length} bytes)`);

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

      console.log(`🎤 [User ${userId}] Transcription: "${transcription}"`);
    } catch (error: any) {
      console.error(`❌ [User ${userId}] Whisper error:`, error);

      // Handle specific OpenAI errors
      if (error?.status === 401) {
        return res.status(401).json({
          success: false,
          error: "Invalid OpenAI API key",
          code: "INVALID_API_KEY"
        });
      }

      return res.status(500).json({
        success: false,
        error: "Failed to transcribe audio",
        details: getErrorMessage(error)
      });
    }

    // Charge for transcription
    let creditsUsed = 0;
    if (whisperApiKey.shouldCharge) {
      const durationEstimate = Math.max(audioBuffer.length / 16000, 1); // Rough estimate
      await chargeCredits(
        userId,
        'voice_transcription',
        whisperApiKey.provider,
        { input: Math.ceil(durationEstimate * 100), output: 0 },
        whisperApiKey.billingMode === 'free'
      );
      creditsUsed += 1;
    }

    // ========== STEP 4: Parse with AI (DeepSeek - 12x cheaper) ==========
    let parsed: ParsedTransaction;

    try {
      // Get API key for parsing (uses DeepSeek by default - much cheaper)
      const parseApiKey = await getApiKey(userId, 'voice_normalization');

      const parseResult = await parseTransactionWithDeepSeek(
        parseApiKey.key,
        transcription,
        userCurrency
      );

      parsed = {
        amount: String(parseResult.amount || 0),
        currency: parseResult.currency || userCurrency,
        description: parseResult.description || transcription,
        category: parseResult.category,
        type: 'expense', // Default to expense
        confidence: parseResult.amount > 0 ? 'high' : 'low',
      };

      // Detect income keywords
      const incomeKeywords = /получил|зарплата|доход|income|salary|received|earned/i;
      if (incomeKeywords.test(transcription)) {
        parsed.type = 'income';
      }

      // Charge for parsing
      if (parseApiKey.shouldCharge) {
        await chargeCredits(
          userId,
          'voice_normalization',
          parseApiKey.provider,
          { input: transcription.length * 4, output: 200 },
          parseApiKey.billingMode === 'free'
        );
        creditsUsed += 1;
      }

      console.log(`✅ [User ${userId}] Parsed:`, parsed);

    } catch (parseError) {
      console.error(`⚠️ [User ${userId}] Parse error, using fallback:`, parseError);

      // Fallback: use transcription as description, try to extract amount
      const amountMatch = transcription.match(/(\d+[\s.,]?\d*)/);
      const amount = amountMatch ? amountMatch[1].replace(/\s/g, '').replace(',', '.') : '0';

      parsed = {
        amount,
        currency: userCurrency,
        description: transcription,
        type: 'expense',
        confidence: 'low',
      };
    }

    // ========== STEP 5: Return result ==========
    res.json({
      success: true,
      transcription,
      parsed,
      creditsUsed,
    });

  } catch (error: unknown) {
    console.error("💥 Voice parse error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process voice input",
      details: getErrorMessage(error)
    });
  } finally {
    // Cleanup temp file
    if (tempFilePath) {
      try {
        await fsp.unlink(tempFilePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}));

export default router;
