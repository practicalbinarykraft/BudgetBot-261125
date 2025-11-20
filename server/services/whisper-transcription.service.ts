import OpenAI from "openai";
import https from "https";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { tmpdir } from "os";

/**
 * Whisper Transcription Service
 * Responsibility: Transcribe voice messages using OpenAI Whisper API
 * Junior-Friendly: <200 lines, one clear purpose
 */

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  errorCode?: string; // Structured error code for i18n
}

/**
 * Download file from URL to temporary location using streams
 */
async function downloadFile(fileUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tempFilePath = path.join(tmpdir(), `voice_${Date.now()}.ogg`);
    const fileStream = fs.createWriteStream(tempFilePath);

    https.get(fileUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${response.statusCode}`));
        return;
      }

      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve(tempFilePath);
      });

      fileStream.on('error', (err) => {
        fsp.unlink(tempFilePath).catch(() => {}); // Cleanup on error
        reject(err);
      });

      response.on('error', (err) => {
        fsp.unlink(tempFilePath).catch(() => {}); // Cleanup on error
        reject(err);
      });
    }).on('error', reject);
  });
}

/**
 * Clean up temporary file
 */
async function cleanupFile(filePath: string): Promise<void> {
  try {
    await fsp.unlink(filePath);
  } catch (err) {
    console.error('[Whisper] Failed to cleanup temp file:', err);
  }
}

/**
 * Transcribe audio file using OpenAI Whisper API
 * 
 * @param apiKey - User's OpenAI API key (BYOK pattern)
 * @param fileUrl - Direct URL to audio file (from Telegram)
 * @param language - Optional language code ('en' or 'ru')
 * @returns Transcription result with text or error
 */
export async function transcribeVoiceMessage(
  apiKey: string,
  fileUrl: string,
  language?: 'en' | 'ru'
): Promise<TranscriptionResult> {
  let tempFilePath: string | null = null;

  try {
    // Validate API key
    if (!apiKey || !apiKey.startsWith('sk-')) {
      return {
        success: false,
        errorCode: 'invalid_key',
      };
    }

    // Initialize OpenAI client with user's key (BYOK)
    const openai = new OpenAI({ apiKey });

    // Download voice file to temp location
    console.log('[Whisper] Downloading voice file...');
    tempFilePath = await downloadFile(fileUrl);

    // Create readable stream for OpenAI API (Node.js compatible)
    const audioStream = fs.createReadStream(tempFilePath);

    // Transcribe using Whisper API
    console.log('[Whisper] Transcribing with Whisper API...');
    const transcription = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      language: language || undefined, // Auto-detect if not specified
      response_format: 'text',
    });

    console.log('[Whisper] Transcription successful:', transcription);

    return {
      success: true,
      text: transcription.trim(),
    };
  } catch (err: any) {
    console.error('[Whisper] Transcription error:', err);

    // Return structured error codes for i18n
    if (err?.status === 401) {
      return {
        success: false,
        errorCode: 'invalid_key',
      };
    }

    if (err?.status === 429) {
      return {
        success: false,
        errorCode: 'rate_limit',
      };
    }

    if (err?.status === 413) {
      return {
        success: false,
        errorCode: 'file_too_large',
      };
    }

    return {
      success: false,
      errorCode: 'transcription_failed',
    };
  } finally {
    // Always cleanup temp file
    if (tempFilePath) {
      await cleanupFile(tempFilePath);
    }
  }
}

/**
 * Get Telegram file download URL
 * 
 * @param botToken - Telegram bot token
 * @param fileId - Telegram file ID
 * @returns Direct download URL or null
 */
export async function getTelegramFileUrl(
  botToken: string,
  fileId: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
    );

    if (!response.ok) {
      console.error('[Whisper] Failed to get Telegram file info:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.ok || !data.result?.file_path) {
      console.error('[Whisper] Invalid Telegram file response:', data);
      return null;
    }

    return `https://api.telegram.org/file/bot${botToken}/${data.result.file_path}`;
  } catch (err) {
    console.error('[Whisper] Error getting Telegram file URL:', err);
    return null;
  }
}
