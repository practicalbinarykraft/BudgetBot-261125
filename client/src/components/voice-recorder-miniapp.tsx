/**
 * Voice Recorder Component for Telegram Mini App and iOS
 *
 * Uses MediaRecorder API instead of Web Speech API for compatibility
 * with iframe restrictions in Telegram Mini App and iOS Safari.
 * Sends audio to server for Whisper transcription + AI parsing.
 * Includes audio visualization (waveform) during recording.
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
  onInterimResult?: (text: string) => void; // Для показа состояния записи
  onRecordingChange?: (isRecording: boolean) => void; // Для изменения состояния записи
  onError?: (error: string) => void; // Для ошибок
  className?: string;
}

type RecordingState = "idle" | "recording" | "processing";

export function VoiceRecorderMiniApp({ 
  onParsedResult, 
  onInterimResult,
  onRecordingChange,
  onError,
  className 
}: VoiceRecorderMiniAppProps) {
  const { language, t } = useTranslation();
  const { toast } = useToast();
  const [state, setState] = useState<RecordingState>("idle");
  const [isSupported, setIsSupported] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // Уровень звука для визуализации (0-100)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false); // Ref для проверки состояния записи в анимации

  useEffect(() => {
    // Feature detection для MediaRecorder
    setIsSupported(
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices !== "undefined" &&
      typeof MediaRecorder !== "undefined"
    );
    
    // Cleanup при размонтировании
    return () => {
      stopAudioVisualization();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Функция для визуализации звука (волны как в Telegram)
  const startAudioVisualization = () => {
    if (!analyserRef.current || !streamRef.current) {
      console.warn('[VoiceRecorder] Cannot start visualization: missing analyser or stream');
      return;
    }
    
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateVisualization = () => {
      // Проверяем через ref, чтобы не зависеть от замыкания state
      if (!analyserRef.current || !streamRef.current) {
        animationFrameRef.current = null;
        setAudioLevel(0);
        return;
      }
      
      analyser.getByteFrequencyData(dataArray);
      
      // Вычисляем RMS (Root Mean Square) для более точного уровня звука
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const normalizedLevel = Math.min(100, (rms / 255) * 100);
      
      setAudioLevel(normalizedLevel);
      
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };
    
    console.log('[VoiceRecorder] Starting audio visualization');
    updateVisualization();
  };

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);
    
    // Закрываем AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  // Определение правильного формата аудио (приоритет для iOS)
  const getSupportedMimeType = (): string => {
    // Порядок приоритета согласно ТЗ
    const mimeTypes = [
      'audio/mp4;codecs=mp4a.40.2', // AAC в MP4 контейнере (iOS)
      'audio/mp4', // MP4 без указания кодека
      'audio/aac', // Чистый AAC
      'audio/wav', // WAV как fallback
    ];

    // Для не-iOS устройств также проверяем webm (но не используем на iOS)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    if (!isIOS) {
      // Для не-iOS добавляем webm в начало списка (меньший размер)
      mimeTypes.unshift('audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus');
    }

    // Возвращаем первый поддерживаемый формат
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    // Если ничего не поддерживается - возвращаем wav (должен работать везде)
    return 'audio/wav';
  };

  // Получение расширения файла из mimeType
  const getFileExtension = (mimeType: string): string => {
    if (mimeType.includes('mp4') || mimeType.includes('aac')) {
      return 'm4a';
    }
    if (mimeType.includes('webm')) {
      return 'webm';
    }
    if (mimeType.includes('ogg')) {
      return 'ogg';
    }
    return 'wav';
  };

  const startRecording = async () => {
    try {
      // Проверка HTTPS для iOS (MediaRecorder требует безопасный контекст)
      const isSecureContext = window.isSecureContext || 
        window.location.protocol === 'https:' || 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1';
      
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      if (isIOS && !isSecureContext) {
        const errorMsg = language === 'ru'
          ? 'Для записи голоса на iPhone требуется HTTPS соединение. Пожалуйста, откройте приложение через безопасное соединение.'
          : 'Voice recording on iPhone requires HTTPS connection. Please open the app via secure connection.';
        onError?.(errorMsg);
        toast({
          title: language === 'ru' ? 'Требуется HTTPS' : 'HTTPS Required',
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });

      streamRef.current = stream;

      // Выбираем правильный формат согласно ТЗ
      const mimeType = getSupportedMimeType();
      console.log(`[VoiceRecorder] Selected mimeType: ${mimeType}`);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Создаем AudioContext для визуализации звука (волны как в Telegram)
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        
        // На iOS нужно явно возобновить AudioContext после user gesture
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        // Запускаем анимацию для визуализации
        startAudioVisualization();
      } catch (error) {
        console.warn('Failed to create audio visualization:', error);
        // Продолжаем работу без визуализации
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stopAudioVisualization();
        onRecordingChange?.(false);
        onInterimResult?.(language === 'ru' ? 'Обработка...' : 'Processing...');
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        if (chunksRef.current.length === 0) {
          setState("idle");
          isRecordingRef.current = false;
          isRecordingRef.current = false;
          return;
        }

        setState("processing");
        isRecordingRef.current = false;

        try {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          
          // Проверяем размер файла (максимум 25MB для Whisper API)
          const maxSize = 25 * 1024 * 1024; // 25MB
          if (audioBlob.size > maxSize) {
            throw new Error(language === 'ru'
              ? `Файл слишком большой (${Math.round(audioBlob.size / 1024 / 1024)}MB). Максимальный размер: 25MB. Попробуйте записать более короткое сообщение.`
              : `File too large (${Math.round(audioBlob.size / 1024 / 1024)}MB). Maximum size: 25MB. Try recording a shorter message.`);
          }

          console.log(`[VoiceRecorder] Sending audio: ${audioBlob.size} bytes, type: ${mimeType}, extension: ${getFileExtension(mimeType)}`);

          // Convert to base64
          const base64String = await blobToBase64(audioBlob);
          
          console.log(`[VoiceRecorder] Base64 length: ${base64String.length} chars`);

          // Send to server for transcription + parsing
          const response = await apiRequest("POST", "/api/ai/voice-parse", {
            audioBase64: base64String,
            mimeType: mimeType,
            language: language === 'ru' ? 'ru' : 'en',
          });
          
          console.log(`[VoiceRecorder] Response status: ${response.status}`);

          const data = await response.json();

          if (data.success) {
            onParsedResult({
              transcription: data.transcription,
              parsed: data.parsed,
              creditsUsed: data.creditsUsed,
            });
            onInterimResult?.("");
          } else {
            throw new Error(data.error || "Failed to process voice");
          }

          setState("idle");
          isRecordingRef.current = false;

        } catch (error: any) {
          console.error("Voice parse error:", error);
          console.error("Error details:", {
            message: error.message,
            name: error.name,
            stack: error.stack,
            response: error.response,
          });

          // Определяем тип ошибки
          const isNetworkError = error instanceof TypeError && 
            (error.message.includes('fetch') || error.message.includes('network'));
          const isServerError = error.message?.includes('Внутренняя ошибка') || 
            error.message?.includes('Internal server error') ||
            error.message?.includes('500');
          const isCreditsError = error.message?.includes("INSUFFICIENT_CREDITS") || 
            error.code === "INSUFFICIENT_CREDITS";
          const isFileTooLarge = error.message?.includes('слишком большой') || 
            error.message?.includes('too large');

          let errorMessage: string;
          let errorTitle: string;

          if (isCreditsError) {
            errorTitle = t("voice.no_credits_title") || (language === 'ru' ? "Нет кредитов" : "No Credits");
            errorMessage = t("voice.no_credits") || (language === 'ru'
              ? "У вас закончились кредиты. Пожалуйста, пополните баланс или добавьте свой API ключ."
              : "You need credits for voice input. Add your OpenAI API key or purchase credits.");
          } else if (isFileTooLarge) {
            errorTitle = t("common.error_occurred") || (language === 'ru' ? "Файл слишком большой" : "File Too Large");
            errorMessage = error.message || (language === 'ru'
              ? "Запись слишком длинная. Максимальный размер: 25MB. Попробуйте записать более короткое сообщение."
              : "Recording too long. Maximum size: 25MB. Try recording a shorter message.");
          } else if (isNetworkError) {
            errorTitle = t("common.error_occurred") || (language === 'ru' ? "Ошибка сети" : "Network Error");
            errorMessage = language === 'ru'
              ? "Ошибка подключения к серверу. Проверьте подключение к интернету и попробуйте еще раз."
              : "Network connection error. Check your internet connection and try again.";
          } else if (isServerError) {
            errorTitle = t("common.error_occurred") || (language === 'ru' ? "Ошибка сервера" : "Server Error");
            errorMessage = error.message || (language === 'ru'
              ? "Внутренняя ошибка сервера. Пожалуйста, попробуйте позже или обратитесь в поддержку."
              : "Internal server error. Please try again later or contact support.");
          } else {
            errorTitle = t("common.error_occurred") || (language === 'ru' ? "Ошибка" : "Error");
            errorMessage = error.message || t("voice.error_unexpected") || "Unexpected error occurred";
          }

          toast({
            title: errorTitle,
            description: errorMessage,
            variant: "destructive",
          });

          setState("idle");
          isRecordingRef.current = false;
          stopAudioVisualization();
          onInterimResult?.("");
          onRecordingChange?.(false);
          
          // Показываем ошибку через callback для отображения в диалоге
          if (onError) {
            onError(errorMessage);
          }
        }
      };

      mediaRecorder.start();
      setState("recording");
      isRecordingRef.current = true;
      onRecordingChange?.(true);
      onInterimResult?.(language === 'ru' ? 'Запись...' : 'Recording...');

    } catch (error: any) {
      console.error("Failed to start recording:", error);
      console.error("Recording error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      let errorMessage: string;
      let errorTitle: string;

      if (error.name === "NotAllowedError") {
        errorTitle = t("voice.permission_denied_title") || (language === 'ru' ? "Доступ запрещён" : "Permission Denied");
        errorMessage = t("voice.permission_denied") || (language === 'ru'
          ? "Пожалуйста, разрешите доступ к микрофону для использования голосового ввода. Проверьте настройки браузера."
          : "Please allow microphone access to use voice input. Check browser settings.");
      } else if (error.name === "NotFoundError") {
        errorTitle = t("common.error_occurred") || (language === 'ru' ? "Микрофон не найден" : "Microphone Not Found");
        errorMessage = language === 'ru'
          ? "Микрофон не найден. Убедитесь, что микрофон подключен и доступен."
          : "Microphone not found. Make sure your microphone is connected and available.";
      } else {
        errorTitle = t("common.error_occurred") || (language === 'ru' ? "Ошибка" : "Error");
        errorMessage = error.message || (language === 'ru'
          ? "Не удалось начать запись. Попробуйте еще раз или используйте другой браузер."
          : "Failed to start recording. Try again or use another browser.");
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });

      setState("idle");
      stopAudioVisualization();
      onRecordingChange?.(false);
      onInterimResult?.("");

      // Показываем ошибку через callback
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const stopRecording = () => {
    stopAudioVisualization();
    onRecordingChange?.(false);
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
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={state === "processing"}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-all relative",
          state === "recording"
            ? "bg-red-500 text-white"
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
          <Square className="h-6 w-6" />
        ) : state === "processing" ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </button>
      
      {/* Визуализация звука (волны как в Telegram) */}
      {state === "recording" && (
        <div className="flex items-center justify-center gap-1 h-8 w-40">
          {Array.from({ length: 20 }).map((_, i) => {
            // Вычисляем высоту каждой волны на основе уровня звука и позиции
            const baseHeight = 4;
            const maxHeight = 24;
            const waveIndex = i;
            const centerIndex = 10;
            const distanceFromCenter = Math.abs(waveIndex - centerIndex);
            
            // Создаем волновой эффект: волны выше в центре, ниже по краям
            const waveMultiplier = 1 - (distanceFromCenter / centerIndex) * 0.5;
            const height = baseHeight + (audioLevel / 100) * maxHeight * waveMultiplier;
            
            return (
              <div
                key={i}
                className="bg-blue-500 rounded-full transition-all duration-75"
                style={{
                  width: '3px',
                  height: `${Math.max(baseHeight, height)}px`,
                  opacity: 0.6 + (audioLevel / 100) * 0.4,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
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
