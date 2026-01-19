/**
 * Voice Recorder Component
 * 
 * Records audio using Web Speech API and converts to text.
 * Shows real-time transcription as user speaks (like Google Translate).
 * Accumulates final results and shows them together with interim results.
 * Supports Russian and English languages.
 */

import { useState, useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onResult: (text: string) => void;
  onInterimResult?: (text: string) => void; // Callback для промежуточных результатов (полный текст: накопленный + текущий промежуточный)
  onRecordingChange?: (isRecording: boolean) => void; // Callback для изменения состояния записи
  className?: string;
}

// Type definitions for Web Speech API
interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onaudioend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export function VoiceRecorder({ onResult, onInterimResult, onRecordingChange, className }: VoiceRecorderProps) {
  const { language } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState(""); // Текущий промежуточный текст
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Сообщение об ошибке
  const finalTextRef = useRef(""); // Накопленный финальный текст (накапливается по мере распознавания)
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isManualStopRef = useRef(false); // Флаг ручной остановки (для различения от автоматического завершения)
  const hasErrorRef = useRef(false); // Флаг ошибки (предотвращает перезапуск после ошибки)
  
  // Храним callback'и в ref, чтобы они не вызывали пересоздание recognition
  const onResultRef = useRef(onResult);
  const onInterimResultRef = useRef(onInterimResult);
  const onRecordingChangeRef = useRef(onRecordingChange);
  
  // Обновляем ref'ы при изменении callback'ов (без пересоздания recognition)
  useEffect(() => {
    onResultRef.current = onResult;
    onInterimResultRef.current = onInterimResult;
    onRecordingChangeRef.current = onRecordingChange;
  });

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Включаем непрерывное распознавание
      recognition.interimResults = true; // Включаем промежуточные результаты для транскрипции в реальном времени
      recognition.lang = language === 'ru' ? 'ru-RU' : 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let newFinalTranscript = "";
        let interimTranscript = "";

        // Обрабатываем все результаты (и финальные, и промежуточные)
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            // Финальный результат - добавляем к накопленному финальному тексту
            newFinalTranscript += transcript + " ";
          } else {
            // Промежуточный результат - показываем в реальном времени
            interimTranscript += transcript;
          }
        }

        // Накапливаем финальные результаты
        if (newFinalTranscript) {
          finalTextRef.current += newFinalTranscript;
        }

        // ВСЕГДА обновляем промежуточный текст (даже если пустой)
        // Это позволяет показывать накопленные финальные результаты, даже когда нет промежуточного текста
        setInterimText(interimTranscript);

        // Формируем полный текст: накопленный финальный + текущий промежуточный
        const fullText = (finalTextRef.current + interimTranscript).trim();
        
        // ВСЕГДА вызываем callback с полным текстом (как в Google Translate)
        // Это позволяет видеть весь текст в реальном времени, даже если промежуточный текст пустой
        onInterimResultRef.current?.(fullText);
      };

      // Функция безопасного перезапуска распознавания
      const restartRecognition = () => {
        if (!recognitionRef.current || isManualStopRef.current) return;
        
        // Используем abort() для полной остановки перед перезапуском
        try {
          recognitionRef.current.abort(); // Полная остановка вместо stop()
        } catch (e) {
          // Игнорируем ошибки при abort
        }
        
        setTimeout(() => {
          if (recognitionRef.current && !isManualStopRef.current) {
            try {
              recognitionRef.current.start();
              setIsRecording(true);
              onRecordingChangeRef.current?.(true);
            } catch (e: any) {
              // Если ошибка "already started" - игнорируем, значит уже работает
              if (e?.message?.includes('already started')) {
                return;
              }
              setIsRecording(false);
              onRecordingChangeRef.current?.(false);
            }
          }
        }, 300); // Увеличиваем задержку для гарантии остановки
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Handle specific errors
        if (event.error === 'no-speech') {
          // Пользователь не говорит - НЕ перезапускаем автоматически
          // Web Speech API сам перезапустится через onend
          return;
        }
        
        if (event.error === 'not-allowed') {
          // Разрешение не предоставлено
          setIsRecording(false);
          onRecordingChangeRef.current?.(false);
          setInterimText("");
          finalTextRef.current = "";
          alert(language === 'ru' 
            ? 'Разрешение на использование микрофона не предоставлено. Пожалуйста, разрешите доступ в настройках браузера.'
            : 'Microphone permission not granted. Please allow access in browser settings.');
          return;
        }
        
        if (event.error === 'network') {
          // Сетевая ошибка - показываем сообщение пользователю
          // Причины: нет HTTPS, страница не через localhost, rate limiting, региональные ограничения
          hasErrorRef.current = true; // Предотвращаем автоматический перезапуск
          setErrorMessage(language === 'ru'
            ? 'Ошибка подключения к сервису распознавания речи. Убедитесь, что страница открыта через localhost или HTTPS.'
            : 'Speech recognition service connection error. Make sure the page is opened via localhost or HTTPS.');
          setIsRecording(false);
          onRecordingChangeRef.current?.(false);
          return;
        }
        
        if (event.error === 'aborted') {
          // Распознавание было прервано - игнорируем если это была ручная остановка
          if (isManualStopRef.current) {
            return;
          }
          // Иначе просто останавливаем
          setIsRecording(false);
          onRecordingChangeRef.current?.(false);
          return;
        }
        
        // Для других ошибок - останавливаем
        setIsRecording(false);
        onRecordingChangeRef.current?.(false);
        setInterimText("");
        finalTextRef.current = "";
      };

      recognition.onend = () => {
        // Если была ошибка - НЕ перезапускаем
        if (hasErrorRef.current) {
          hasErrorRef.current = false;
          setIsRecording(false);
          onRecordingChangeRef.current?.(false);
          return;
        }

        // Если была ручная остановка - завершаем и отправляем результат
        if (isManualStopRef.current) {
          isManualStopRef.current = false;
          setIsRecording(false);
          onRecordingChangeRef.current?.(false);

          const completeText = finalTextRef.current.trim();
          if (completeText) {
            onResultRef.current(completeText);
          }

          setInterimText("");
          finalTextRef.current = "";
          return;
        }

        // Автоматическое завершение (пауза в речи) - перезапускаем распознавание
        // Но только если пользователь не остановил вручную и не было ошибки
        if (recognitionRef.current && !isManualStopRef.current && !hasErrorRef.current) {
          setTimeout(() => {
            if (recognitionRef.current && !isManualStopRef.current && !hasErrorRef.current) {
              try {
                recognitionRef.current.start();
                setIsRecording(true);
                onRecordingChangeRef.current?.(true);
              } catch (e: any) {
                // Если ошибка "already started" - игнорируем, значит уже работает
                if (e?.message?.includes('already started')) {
                  return;
                }
                setIsRecording(false);
                onRecordingChangeRef.current?.(false);
              }
            }
          }, 200); // Задержка для гарантии полной остановки
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, [language]); // Только language в зависимостях! Callback'и хранятся в ref

  const handleClick = () => {
    if (!isSupported) {
      alert(language === 'ru'
        ? 'Ваш браузер не поддерживает распознавание речи. Пожалуйста, используйте Chrome или Edge.'
        : 'Your browser does not support speech recognition. Please use Chrome or Edge.');
      return;
    }

    if (!recognitionRef.current) return;

    if (isRecording) {
      // Ручная остановка записи
      isManualStopRef.current = true;
      try {
        recognitionRef.current.stop();
        // onend вызовет onResult с полным текстом автоматически
      } catch (e) {
        // Ignore errors when stopping
      }
      setIsRecording(false);
      onRecordingChangeRef.current?.(false); // Уведомляем родителя об остановке
    } else {
      // Начинаем новую запись - сбрасываем накопленный текст и флаги
      isManualStopRef.current = false;
      hasErrorRef.current = false;
      finalTextRef.current = "";
      setInterimText("");
      setErrorMessage(null); // Сбрасываем предыдущую ошибку

      // Запускаем распознавание (Web Speech API сам запросит разрешение на микрофон)
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        onRecordingChangeRef.current?.(true);
      } catch (e) {
        setIsRecording(false);
        onRecordingChangeRef.current?.(false);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  // Формируем полный текст для отображения: накопленный финальный + текущий промежуточный
  const displayText = (finalTextRef.current + interimText).trim();

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-all",
          isRecording
            ? "bg-red-500 text-white animate-pulse"
            : "bg-blue-500 text-white hover:bg-blue-600",
          className
        )}
        aria-label={language === 'ru' ? 'Запись голоса' : 'Record voice'}
      >
        <Mic className="h-6 w-6" />
      </button>
      
      {/* Показываем полный текст в реальном времени (как в Google Translate!) */}
      {displayText && (
        <div className="text-sm max-w-xs text-center px-4 py-2 bg-muted rounded-lg border border-border">
          <span className="text-foreground">{finalTextRef.current}</span>
          {interimText && (
            <span className="text-muted-foreground italic">{interimText}</span>
          )}
        </div>
      )}
      
      {isRecording && !displayText && (
        <div className="text-sm text-muted-foreground">
          {language === 'ru' ? 'Говорите...' : 'Listening...'}
        </div>
      )}

      {/* Показываем ошибку */}
      {errorMessage && (
        <div className="text-sm text-red-500 text-center px-4 py-2 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
