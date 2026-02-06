/**
 * Voice recording hook using expo-av.
 * Records audio and sends it to the server for transcription via OpenAI Whisper.
 * This is the killer feature that solves the web browser limitation.
 */

import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { apiUpload } from '@/lib/api';

interface VoiceRecorderState {
  isRecording: boolean;
  isProcessing: boolean;
  duration: number;
  error: string | null;
}

interface ParsedTransaction {
  amount?: string;
  description?: string;
  type?: 'income' | 'expense';
  category?: string;
}

interface VoiceParseResponse {
  text: string;
  parsed?: ParsedTransaction;
}

export function useVoiceRecorder() {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    isProcessing: false,
    duration: 0,
    error: null,
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Request microphone permissions */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }, []);

  /** Start recording audio */
  const startRecording = useCallback(async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setState((s) => ({ ...s, error: 'Microphone permission denied' }));
        return;
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      await recording.startAsync();

      recordingRef.current = recording;
      setState({
        isRecording: true,
        isProcessing: false,
        duration: 0,
        error: null,
      });

      // Track duration
      durationIntervalRef.current = setInterval(() => {
        setState((s) => ({ ...s, duration: s.duration + 1 }));
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setState((s) => ({ ...s, error: message, isRecording: false }));
    }
  }, []);

  /** Stop recording and send to server for transcription */
  const stopRecording = useCallback(async (): Promise<VoiceParseResponse | null> => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (!recordingRef.current) {
      return null;
    }

    try {
      setState((s) => ({ ...s, isRecording: false, isProcessing: true }));

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('No recording URI');
      }

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // Prepare form data for upload
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Recording file not found');
      }

      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as unknown as Blob);
      formData.append('language', 'en');

      // Send to BudgetBot API for Whisper transcription + transaction parsing
      const result = await apiUpload<VoiceParseResponse>(
        '/api/ai/voice-parse',
        formData,
      );

      setState((s) => ({ ...s, isProcessing: false }));
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process recording';
      setState((s) => ({ ...s, isProcessing: false, error: message }));
      return null;
    }
  }, []);

  /** Cancel recording without processing */
  const cancelRecording = useCallback(async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        // Ignore cleanup errors
      }
      recordingRef.current = null;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    setState({
      isRecording: false,
      isProcessing: false,
      duration: 0,
      error: null,
    });
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
