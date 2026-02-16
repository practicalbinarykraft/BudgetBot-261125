import { useState, useRef, useCallback, useEffect } from "react";
import { Animated, Platform } from "react-native";
import { uiAlert } from "@/lib/uiAlert";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { api } from "../lib/api-client";
import { fixVoiceParsedResult } from "../lib/voice-parse-utils";
import { useTranslation } from "../i18n";
import { useToast } from "../components/Toast";
import type { VoiceParsedResult } from "../types";

const isWeb = Platform.OS === "web";

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
  const toast = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: !isWeb }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: !isWeb }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const sendAndParse = useCallback(async (base64: string, mimeType: string) => {
    const data = await api.post<VoiceParsedResult>("/api/ai/voice-parse", {
      audioBase64: base64,
      mimeType,
      language: language === "ru" ? "ru" : "en",
    });
    const fixed = fixVoiceParsedResult(data.parsed, data.transcription);
    onResultRef.current(fixed);
  }, [language]);

  // ===== Web: MediaRecorder =====
  const startRecordingWeb = useCallback(async () => {
    try {
      const { startWebRecording, requestWebMicPermission } = await import("../lib/web-audio");
      const granted = await requestWebMicPermission();
      if (!granted) {
        uiAlert(t("voice_input.permission_required"), t("voice_input.mic_permission"));
        return;
      }
      await startWebRecording();
      setIsRecording(true);
      startPulse();
    } catch (error: any) {
      toast.show(error.message || t("voice_input.error_start"), "error");
    }
  }, []);

  const stopRecordingWeb = useCallback(async () => {
    try {
      stopPulse();
      setIsRecording(false);
      setIsParsing(true);

      const { stopWebRecording } = await import("../lib/web-audio");
      const result = await stopWebRecording();
      if (!result) { setIsParsing(false); return; }

      await sendAndParse(result.base64, result.mimeType);
    } catch (error: any) {
      toast.show(error.message || t("voice_input.error_process"), "error");
    } finally {
      setIsParsing(false);
    }
  }, [language, sendAndParse]);

  // ===== Native: expo-av =====
  const startRecordingNative = useCallback(async () => {
    if (recordingRef.current) return;
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        uiAlert(t("voice_input.permission_required"), t("voice_input.mic_permission"));
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
      toast.show(error.message || t("voice_input.error_start"), "error");
    }
  }, []);

  const stopRecordingNative = useCallback(async () => {
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

      await sendAndParse(base64, "audio/mp4");
    } catch (error: any) {
      toast.show(error.message || t("voice_input.error_process"), "error");
    } finally {
      setIsParsing(false);
    }
  }, [language, sendAndParse]);

  const startRecording = isWeb ? startRecordingWeb : startRecordingNative;
  const stopRecording = isWeb ? stopRecordingWeb : stopRecordingNative;

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
