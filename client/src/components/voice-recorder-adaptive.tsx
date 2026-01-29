/**
 * Adaptive Voice Recorder
 *
 * Автоматически выбирает между:
 * - Web Speech API (быстро, бесплатно) для Chrome/Edge на десктопе
 * - MediaRecorder + Whisper API (надёжно) для iOS, Brave, Telegram Mini App
 *
 * Использует feature detection вместо userAgent для надёжного определения.
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

  /**
   * Callback for errors
   * Used to show error messages in parent components
   */
  onError?: (error: string) => void;

  className?: string;
}

export function VoiceRecorderAdaptive({
  onResult,
  onParsedResult,
  onInterimResult,
  onRecordingChange,
  onError,
  className,
}: VoiceRecorderAdaptiveProps) {
  const { isMiniApp } = useTelegramMiniApp();

  // Feature detection согласно ТЗ (НЕ userAgent!)
  const isWebSpeechAvailable = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition) &&
    window.isSecureContext; // Web Speech API требует безопасный контекст

  const isMediaRecorderAvailable = typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined';

  // Определяем, какой режим использовать
  // ПРИОРИТЕТ 1: Telegram Mini App - всегда используем Whisper
  if (isMiniApp && onParsedResult) {
    return (
      <VoiceRecorderMiniApp
        onParsedResult={onParsedResult}
        onInterimResult={onInterimResult}
        onRecordingChange={onRecordingChange}
        onError={onError}
        className={className}
      />
    );
  }

  // ПРИОРИТЕТ 2: Web Speech API доступен - используем его (Chrome/Edge на десктопе)
  // Это дает моментальную транскрипцию в реальном времени
  if (isWebSpeechAvailable && onResult && onInterimResult) {
    return (
      <VoiceRecorder
        onResult={onResult}
        onInterimResult={onInterimResult}
        onRecordingChange={onRecordingChange}
        onError={onError}
        className={className}
      />
    );
  }

  // ПРИОРИТЕТ 3: Web Speech недоступен, но MediaRecorder доступен - используем Whisper
  // Это работает для iOS, Brave и других браузеров без Web Speech API
  if (!isWebSpeechAvailable && isMediaRecorderAvailable) {
    if (onParsedResult) {
      return (
        <VoiceRecorderMiniApp
          onParsedResult={onParsedResult}
          onInterimResult={onInterimResult}
          onRecordingChange={onRecordingChange}
          onError={onError}
          className={className}
        />
      );
    }
    
    if (onResult) {
      // Fallback: если только onResult без onParsedResult
      return (
        <VoiceRecorderMiniApp
          onParsedResult={(result) => onResult(result.transcription)}
          onInterimResult={onInterimResult}
          onRecordingChange={onRecordingChange}
          onError={onError}
          className={className}
        />
      );
    }
  }

  // ПРИОРИТЕТ 4: Fallback для обычных браузеров с Web Speech API (без onInterimResult)
  if (isWebSpeechAvailable && onResult) {
    return (
      <VoiceRecorder
        onResult={onResult}
        onInterimResult={onInterimResult}
        onRecordingChange={onRecordingChange}
        onError={onError}
        className={className}
      />
    );
  }

  // ОШИБКА: Ни Web Speech, ни MediaRecorder не доступны
  if (!isWebSpeechAvailable && !isMediaRecorderAvailable) {
    const errorMsg = typeof window !== 'undefined' && window.navigator
      ? (window.navigator.language === 'ru' || window.navigator.language.startsWith('ru')
          ? 'Голосовой ввод не поддерживается на этом устройстве. Пожалуйста, используйте Chrome, Edge или Safari на iOS.'
          : 'Voice input is not supported on this device. Please use Chrome, Edge, or Safari on iOS.')
      : 'Voice input not supported';
    
    // Показываем ошибку через callback
    if (onError) {
      onError(errorMsg);
    }
    
    // Возвращаем null - ошибка будет показана через onError callback
    return null;
  }

  // No callbacks provided
  return null;
}

export type { ParsedVoiceResult };
