/**
 * Voice Recorder Component for Telegram Mini App
 *
 * Uses MediaRecorder API instead of Web Speech API for compatibility
 * with iframe restrictions in Telegram Mini App.
 * Sends audio to server for Whisper transcription + AI parsing.
 */

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface ParsedVoiceResult {
  transcription: string;
  parsed: {
    amount: string;
    currency: string;
    description: string;
    category?: string;
    type: 'income' | 'expense';
    confidence: 'high' | 'medium' | 'low';
  };
  creditsUsed: number;
}

interface VoiceRecorderMiniAppProps {
  onParsedResult: (result: ParsedVoiceResult) => void;
  className?: string;
}

type RecordingState = "idle" | "recording" | "processing";

export function VoiceRecorderMiniApp({ onParsedResult, className }: VoiceRecorderMiniAppProps) {
  const { language, t } = useTranslation();
  const { toast } = useToast();
  const [state, setState] = useState<RecordingState>("idle");
  const [isSupported, setIsSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Check if MediaRecorder is supported
    setIsSupported(
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices !== "undefined" &&
      typeof MediaRecorder !== "undefined"
    );
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });

      streamRef.current = stream;

      // Prefer webm/opus for smaller file size, fallback to other formats
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/wav';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        if (chunksRef.current.length === 0) {
          setState("idle");
          return;
        }

        setState("processing");

        try {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });

          // Convert to base64
          const base64String = await blobToBase64(audioBlob);

          // Send to server for transcription + parsing
          const response = await apiRequest("POST", "/api/ai/voice-parse", {
            audioBase64: base64String,
            mimeType: mimeType,
            language: language === 'ru' ? 'ru' : 'en',
          });

          const data = await response.json();

          if (data.success) {
            onParsedResult({
              transcription: data.transcription,
              parsed: data.parsed,
              creditsUsed: data.creditsUsed,
            });
          } else {
            throw new Error(data.error || "Failed to process voice");
          }

          setState("idle");

        } catch (error: any) {
          console.error("Voice parse error:", error);

          if (error.message?.includes("INSUFFICIENT_CREDITS") || error.code === "INSUFFICIENT_CREDITS") {
            toast({
              title: t("voice.no_credits_title") || (language === 'ru' ? "Нет кредитов" : "No Credits"),
              description: t("voice.no_credits") || (language === 'ru'
                ? "У вас закончились кредиты. Пожалуйста, пополните баланс или добавьте свой API ключ."
                : "You need credits for voice input. Add your OpenAI API key or purchase credits."),
              variant: "destructive",
            });
          } else {
            toast({
              title: t("common.error_occurred") || (language === 'ru' ? "Ошибка" : "Error"),
              description: error.message || t("voice.error_unexpected") || "Unexpected error occurred",
              variant: "destructive",
            });
          }

          setState("idle");
        }
      };

      mediaRecorder.start();
      setState("recording");

    } catch (error: any) {
      console.error("Failed to start recording:", error);

      if (error.name === "NotAllowedError") {
        toast({
          title: t("voice.permission_denied_title") || (language === 'ru' ? "Доступ запрещён" : "Permission Denied"),
          description: t("voice.permission_denied") || (language === 'ru'
            ? "Пожалуйста, разрешите доступ к микрофону для использования голосового ввода."
            : "Please allow microphone access to use voice input."),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("common.error_occurred") || (language === 'ru' ? "Ошибка" : "Error"),
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleClick = () => {
    if (state === "idle") {
      startRecording();
    } else if (state === "recording") {
      stopRecording();
    }
    // Do nothing if processing
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "processing"}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
        state === "recording"
          ? "bg-red-500 text-white animate-pulse"
          : state === "processing"
          ? "bg-gray-400 text-white cursor-wait"
          : "bg-blue-500 text-white hover:bg-blue-600",
        className
      )}
      aria-label={
        state === "recording"
          ? (language === 'ru' ? 'Остановить запись' : 'Stop recording')
          : state === "processing"
          ? (language === 'ru' ? 'Обработка...' : 'Processing...')
          : (language === 'ru' ? 'Начать запись' : 'Start recording')
      }
    >
      {state === "recording" ? (
        <Square className="h-4 w-4" />
      ) : state === "processing" ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  );
}

/**
 * Convert Blob to base64 string (without data URL prefix)
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Remove data URL prefix (e.g., "data:audio/webm;base64,")
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
