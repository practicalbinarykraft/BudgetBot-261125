import { useState, useRef } from "react";
import { Animated, Platform } from "react-native";
import { uiAlert } from "@/lib/uiAlert";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { api } from "../lib/api-client";
import { fixVoiceParsedResult } from "../lib/voice-parse-utils";
import { useTranslation } from "../i18n";
import { useToast } from "../components/Toast";
import type { VoiceParsedResult } from "../types";
import type { RootStackParamList } from "../navigation/RootStackNavigator";

const isWeb = Platform.OS === "web";

export function useVoiceInputScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, language } = useTranslation();
  const toast = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: !isWeb,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: !isWeb,
        }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  // ===== Web: MediaRecorder API =====
  const startRecordingWeb = async () => {
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
  };

  const stopRecordingWeb = async () => {
    try {
      stopPulse();
      setIsRecording(false);
      setIsParsing(true);

      const { stopWebRecording } = await import("../lib/web-audio");
      const result = await stopWebRecording();
      if (!result) {
        toast.show(t("voice_input.error_empty"), "error");
        setIsParsing(false);
        return;
      }

      const data = await api.post<VoiceParsedResult>("/api/ai/voice-parse", {
        audioBase64: result.base64,
        mimeType: result.mimeType,
        language: language === "ru" ? "ru" : "en",
      });

      const fixed = fixVoiceParsedResult(data.parsed, data.transcription);

      navigation.replace("AddTransaction", {
        prefill: {
          amount: fixed.amount,
          description: fixed.description,
          type: fixed.type,
          currency: fixed.currency,
          category: fixed.category,
          tutorialSource: "voice" as const,
        },
      });
    } catch (error: any) {
      toast.show(error.message || t("voice_input.error_process"), "error");
    } finally {
      setIsParsing(false);
    }
  };

  // ===== Native: expo-av =====
  const startRecordingNative = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        uiAlert(t("voice_input.permission_required"), t("voice_input.mic_permission"));
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      startPulse();
    } catch (error: any) {
      toast.show(error.message || t("voice_input.error_start"), "error");
    }
  };

  const stopRecordingNative = async () => {
    if (!recordingRef.current) return;

    try {
      stopPulse();
      setIsRecording(false);
      setIsParsing(true);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        toast.show(t("voice_input.error_empty"), "error");
        setIsParsing(false);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || !("size" in fileInfo) || fileInfo.size === 0) {
        toast.show(t("voice_input.error_empty"), "error");
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

      // Client-side regex fix — overrides broken server parsing
      const fixed = fixVoiceParsedResult(data.parsed, data.transcription);

      navigation.replace("AddTransaction", {
        prefill: {
          amount: fixed.amount,
          description: fixed.description,
          type: fixed.type,
          currency: fixed.currency,
          category: fixed.category,
          tutorialSource: "voice" as const,
        },
      });
    } catch (error: any) {
      toast.show(error.message || t("voice_input.error_process"), "error");
    } finally {
      setIsParsing(false);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      isWeb ? stopRecordingWeb() : stopRecordingNative();
    } else {
      isWeb ? startRecordingWeb() : startRecordingNative();
    }
  };

  return {
    isRecording,
    isParsing,
    pulseAnim,
    handleToggleRecording,
    navigation,
  };
}
