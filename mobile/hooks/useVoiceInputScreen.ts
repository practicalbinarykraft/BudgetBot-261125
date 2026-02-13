import { useState, useRef } from "react";
import { Alert, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { api } from "../lib/api-client";
import { fixVoiceParsedResult } from "../lib/voice-parse-utils";
import { useTranslation } from "../i18n";
import type { VoiceParsedResult } from "../types";
import type { RootStackParamList } from "../navigation/RootStackNavigator";

export function useVoiceInputScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, language } = useTranslation();

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
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("voice_input.permission_required"), t("voice_input.mic_permission"));
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
      Alert.alert(t("common.error"), error.message || t("voice_input.error_start"));
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      stopPulse();
      setIsRecording(false);
      setIsParsing(true);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        Alert.alert(t("common.error"), t("voice_input.error_empty"));
        setIsParsing(false);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || !("size" in fileInfo) || fileInfo.size === 0) {
        Alert.alert(t("common.error"), t("voice_input.error_empty"));
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
      // Detects currency from transcription text (рублей→RUB, долларов→USD etc.)
      // Cleans description (removes amount + currency words)
      const fixed = fixVoiceParsedResult(data.parsed, data.transcription);

      navigation.replace("AddTransaction", {
        prefill: {
          amount: fixed.amount,
          description: fixed.description,
          type: fixed.type,
          currency: fixed.currency,
          category: fixed.category,
        },
      });
    } catch (error: any) {
      const message = error.message || t("voice_input.error_process");
      Alert.alert(t("common.error"), message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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
