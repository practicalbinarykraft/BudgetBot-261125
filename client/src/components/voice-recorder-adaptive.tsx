/**
 * Adaptive Voice Recorder
 *
 * Automatically selects between:
 * - Web Speech API (fast, free) for regular browsers
 * - MediaRecorder + Whisper API (reliable) for Telegram Mini App
 *
 * This ensures voice input works in all environments.
 */

import { useTelegramMiniApp } from "@/hooks/use-telegram-miniapp";
import { VoiceRecorder } from "./voice-recorder";
import { VoiceRecorderMiniApp, ParsedVoiceResult } from "./voice-recorder-miniapp";

interface VoiceRecorderAdaptiveProps {
  /**
   * Callback for Web Speech API result (plain text)
   * Used in regular browsers
   */
  onResult?: (text: string) => void;

  /**
   * Callback for server-side parsed result
   * Used in Telegram Mini App (includes amount, currency, category, etc.)
   */
  onParsedResult?: (result: ParsedVoiceResult) => void;

  className?: string;
}

export function VoiceRecorderAdaptive({
  onResult,
  onParsedResult,
  className,
}: VoiceRecorderAdaptiveProps) {
  const { isMiniApp } = useTelegramMiniApp();

  // In Mini App - use MediaRecorder + server-side Whisper + AI parsing
  if (isMiniApp && onParsedResult) {
    return (
      <VoiceRecorderMiniApp
        onParsedResult={onParsedResult}
        className={className}
      />
    );
  }

  // In regular browser - use Web Speech API (faster, free)
  // In Mini App with only onResult - use server transcription but return just text
  if (onResult) {
    if (isMiniApp) {
      // Mini App: use server transcription, extract just the text
      return (
        <VoiceRecorderMiniApp
          onParsedResult={(result) => onResult(result.transcription)}
          className={className}
        />
      );
    }
    // Regular browser: use Web Speech API
    return (
      <VoiceRecorder
        onResult={onResult}
        className={className}
      />
    );
  }

  // No callbacks provided
  return null;
}

export type { ParsedVoiceResult };
