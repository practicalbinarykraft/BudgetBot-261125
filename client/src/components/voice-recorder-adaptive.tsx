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

  /**
   * Callback for interim results (real-time transcription)
   * Shows text as user speaks (like competitors)
   */
  onInterimResult?: (text: string) => void;

  /**
   * Callback for recording state changes
   * Used to show/hide transcription area
   */
  onRecordingChange?: (isRecording: boolean) => void;

  className?: string;
}

export function VoiceRecorderAdaptive({
  onResult,
  onParsedResult,
  onInterimResult,
  onRecordingChange,
  className,
}: VoiceRecorderAdaptiveProps) {
  const { isMiniApp } = useTelegramMiniApp();

  // Проверяем, доступен ли Web Speech API (для real-time транскрипции)
  const isWebSpeechAvailable = typeof window !== 'undefined' && 
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  // ПРИОРИТЕТ: Если Web Speech API доступен И нужна real-time транскрипция (onInterimResult)
  // → используем Web Speech API даже если есть onParsedResult
  // Это дает real-time транскрипцию в обычном браузере
  if (isWebSpeechAvailable && onResult && onInterimResult) {
    return (
      <VoiceRecorder
        onResult={onResult}
        onInterimResult={onInterimResult}
        onRecordingChange={onRecordingChange}
        className={className}
      />
    );
  }

  // In Mini App - use MediaRecorder + server-side Whisper + AI parsing
  if (isMiniApp && onParsedResult) {
    return (
      <VoiceRecorderMiniApp
        onParsedResult={onParsedResult}
        className={className}
      />
    );
  }

  // In regular browser - use Web Speech API (faster, free) with real-time transcription
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
    // Regular browser: use Web Speech API with real-time transcription
    return (
      <VoiceRecorder
        onResult={onResult}
        onInterimResult={onInterimResult}
        onRecordingChange={onRecordingChange}
        className={className}
      />
    );
  }

  // No callbacks provided
  return null;
}

export type { ParsedVoiceResult };
