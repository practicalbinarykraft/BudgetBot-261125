import { useState, useRef, useCallback, useEffect } from "react";
import { Alert, Animated } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { api } from "../lib/api-client";
import { fixVoiceParsedResult } from "../lib/voice-parse-utils";
import { useTranslation } from "../i18n";
import type { VoiceParsedResult } from "../types";

interface VoiceResult {
  amount: string;
  currency: string;
  description: string;
  category?: string;
  type: "income" | "expense";
}

/**
 * Inline voice recording on AddTransaction screen.
 * autoStart: if true, begins recording on mount (for mic button from main screen).
 */
export function useInlineVoice(autoStart: boolean, onResult: (r: VoiceResult) => void) {
  const { t, language } = useTranslation();

  const [isRecording, setIsRecording] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startRecording = useCallback(async () => {
    if (recordingRef.current) return; // already recording
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("voice_input.permission_required"), t("voice_input.mic_permission"));
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      startPulse();
    } catch (error: any) {
      Alert.alert(t("common.error"), error.message || t("voice_input.error_start"));
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
      stopPulse();
      setIsRecording(false);
      setIsParsing(true);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) { setIsParsing(false); return; }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || !("size" in fileInfo) || fileInfo.size === 0) {
        setIsParsing(false);
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const data = await api.post<VoiceParsedResult>("/api/ai/voice-parse", {
        audioBase64: base64,
        mimeType: "audio/mp4",
        language: language === "ru" ? "ru" : "en",
      });

      const fixed = fixVoiceParsedResult(data.parsed, data.transcription);
      onResultRef.current(fixed);
    } catch (error: any) {
      Alert.alert(t("common.error"), error.message || t("voice_input.error_process"));
    } finally {
      setIsParsing(false);
    }
  }, [language]);

  const toggle = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Auto-start recording on mount if requested
  useEffect(() => {
    if (autoStart) {
      startRecording();
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return { isRecording, isParsing, pulseAnim, toggle };
}
