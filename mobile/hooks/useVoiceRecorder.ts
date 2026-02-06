/**
 * Real-time speech recognition hook using expo-speech-recognition.
 *
 * Uses native on-device engines:
 *   - iOS: Apple Speech (SFSpeechRecognizer)
 *   - Android: Google SpeechRecognizer
 *
 * Text appears instantly as the user speaks — no server round-trip.
 * Requires a development build (not Expo Go) because of native modules.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export interface SpeechRecognitionState {
  /** Whether the recognizer is actively listening */
  isListening: boolean;
  /** Interim (partial) transcript — updates in real time as user speaks */
  interimText: string;
  /** Final confirmed transcript */
  finalText: string;
  /** Error message if something went wrong */
  error: string | null;
  /** Whether speech recognition is available on this device */
  isAvailable: boolean;
}

export function useVoiceRecorder(locale: string = 'en-US') {
  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    interimText: '',
    finalText: '',
    error: null,
    isAvailable: false,
  });

  // Track accumulated final text across multiple "result" events
  const accumulatedFinalRef = useRef('');

  // Check availability on mount
  useEffect(() => {
    async function check() {
      try {
        const available =
          await ExpoSpeechRecognitionModule.isRecognitionAvailable();
        setState((s) => ({ ...s, isAvailable: available }));
      } catch {
        setState((s) => ({ ...s, isAvailable: false }));
      }
    }
    check();
  }, []);

  // ── Event handlers (from expo-speech-recognition) ──

  /** Fires when partial or final results arrive */
  useSpeechRecognitionEvent('result', (ev) => {
    const transcript = ev.results[0]?.transcript ?? '';

    if (ev.isFinal) {
      // Append to accumulated final text
      const sep = accumulatedFinalRef.current ? ' ' : '';
      accumulatedFinalRef.current += sep + transcript;

      setState((s) => ({
        ...s,
        finalText: accumulatedFinalRef.current,
        interimText: '',
      }));
    } else {
      // Interim result — show live preview
      setState((s) => ({
        ...s,
        interimText: transcript,
      }));
    }
  });

  /** Fires when the recognizer encounters an error */
  useSpeechRecognitionEvent('error', (ev) => {
    // "no-speech" is not a real error — user just didn't say anything
    if (ev.error === 'no-speech') {
      setState((s) => ({ ...s, isListening: false }));
      return;
    }
    setState((s) => ({
      ...s,
      isListening: false,
      error: ev.error ?? 'Speech recognition error',
    }));
  });

  /** Fires when the recognizer stops */
  useSpeechRecognitionEvent('end', () => {
    setState((s) => ({ ...s, isListening: false }));
  });

  // ── Public API ──

  /** Request permissions and start listening */
  const startListening = useCallback(async () => {
    try {
      // Request permissions (mic + speech recognition)
      const permResult =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permResult.granted) {
        setState((s) => ({
          ...s,
          error: 'Speech recognition permission denied',
        }));
        return;
      }

      // Reset state
      accumulatedFinalRef.current = '';
      setState({
        isListening: true,
        interimText: '',
        finalText: '',
        error: null,
        isAvailable: true,
      });

      // Start the native recognizer
      ExpoSpeechRecognitionModule.start({
        lang: locale,
        interimResults: true,    // stream partial results in real time
        continuous: true,        // keep listening until explicitly stopped
        maxAlternatives: 1,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to start speech recognition';
      setState((s) => ({ ...s, error: message, isListening: false }));
    }
  }, [locale]);

  /** Stop listening and return the final transcript */
  const stopListening = useCallback((): string => {
    ExpoSpeechRecognitionModule.stop();
    setState((s) => ({ ...s, isListening: false }));

    // Combine accumulated final + any leftover interim
    const full = accumulatedFinalRef.current
      ? accumulatedFinalRef.current +
        (state.interimText ? ' ' + state.interimText : '')
      : state.interimText;

    return full.trim();
  }, [state.interimText]);

  /** Cancel — stop without returning any result */
  const cancelListening = useCallback(() => {
    ExpoSpeechRecognitionModule.abort();
    accumulatedFinalRef.current = '';
    setState((s) => ({
      ...s,
      isListening: false,
      interimText: '',
      finalText: '',
      error: null,
    }));
  }, []);

  /** The full live text (final + interim combined) shown to the user */
  const liveText = state.finalText
    ? state.finalText + (state.interimText ? ' ' + state.interimText : '')
    : state.interimText;

  return {
    ...state,
    liveText,
    startListening,
    stopListening,
    cancelListening,
  };
}
