import { useState, useRef } from "react";
import { Alert, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { api } from "../lib/api-client";
import type { VoiceParsedResult } from "../types";

export function useVoiceInputScreen() {
  const navigation = useNavigation();

  const [isRecording, setIsRecording] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<VoiceParsedResult | null>(null);
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
        Alert.alert("Permission Required", "Microphone permission is needed");
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
      setResult(null);
      startPulse();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to start recording");
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
        Alert.alert("Error", "No recording found");
        setIsParsing(false);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || !("size" in fileInfo) || fileInfo.size === 0) {
        Alert.alert("Error", "Recording file is empty or missing");
        setIsParsing(false);
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const data = await api.post<VoiceParsedResult>("/api/ai/voice-parse", {
        audioBase64: base64,
        mimeType: "audio/mp4",
      });

      setResult(data);
    } catch (error: any) {
      const message = error.message || "Failed to process recording";
      Alert.alert("Voice Error", message);
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
    result,
    pulseAnim,
    handleToggleRecording,
    navigation,
  };
}
