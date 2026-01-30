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
  onError?: (error: string) => void; // Callback для ошибок
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

export function VoiceRecorder({ onResult, onInterimResult, onRecordingChange, onError, className }: VoiceRecorderProps) {
  const { language } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState(""); // Текущий промежуточный текст
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Сообщение об ошибке
  const [audioLevel, setAudioLevel] = useState(0); // Уровень звука для визуализации (0-100)
  const finalTextRef = useRef(""); // Накопленный финальный текст (накапливается по мере распознавания)
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isManualStopRef = useRef(false); // Флаг ручной остановки (для различения от автоматического завершения)
  const hasErrorRef = useRef(false); // Флаг ошибки (предотвращает перезапуск после ошибки)
  const streamRef = useRef<MediaStream | null>(null); // Аудиопоток для визуализации
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false); // Ref для проверки состояния записи в анимации
  
  // Храним callback'и в ref, чтобы они не вызывали пересоздание recognition
  const onResultRef = useRef(onResult);
  const onInterimResultRef = useRef(onInterimResult);
  const onRecordingChangeRef = useRef(onRecordingChange);
  const onErrorRef = useRef(onError);
  
  // Обновляем ref'ы при изменении callback'ов (без пересоздания recognition)
  useEffect(() => {
    onResultRef.current = onResult;
    onInterimResultRef.current = onInterimResult;
    onRecordingChangeRef.current = onRecordingChange;
    onErrorRef.current = onError;
  });

  // Функция для визуализации звука (волны как в Telegram)
  const startAudioVisualization = async () => {
    try {
      // Получаем доступ к микрофону для визуализации (параллельно с Web Speech API)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });

      streamRef.current = stream;

      // Создаем AudioContext для визуализации звука
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
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateVisualization = () => {
        // Проверяем через ref, чтобы не зависеть от замыкания state
        if (!analyserRef.current || !streamRef.current || !isRecordingRef.current) {
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
      
      updateVisualization();
    } catch (error) {
      console.warn('Failed to create audio visualization:', error);
      // Продолжаем работу без визуализации
    }
  };

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);
    
    // Закрываем AudioContext и останавливаем поток
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      stopAudioVisualization();
    };
  }, []);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    // Определяем браузер для специальной обработки
    const isBrave = (navigator as any).brave && (navigator as any).brave.isBrave instanceof Function
      ? (navigator as any).brave.isBrave()
      : false;
    
    // Проверяем, что страница открыта через HTTPS или localhost
    // Web Speech API требует безопасный контекст (Secure Context)
    const isSecureContext = 
      window.isSecureContext || 
      window.location.protocol === 'https:' || 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]' || // IPv6 localhost
      window.location.hostname.endsWith('.localhost'); // Поддомены localhost
    
    if (SpeechRecognition && isSecureContext) {
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
              isRecordingRef.current = true;
              onRecordingChangeRef.current?.(true);
              // Запускаем визуализацию при перезапуске
              if (!streamRef.current) {
                startAudioVisualization();
              }
            } catch (e: any) {
              // Если ошибка "already started" - игнорируем, значит уже работает
              if (e?.message?.includes('already started')) {
                return;
              }
              setIsRecording(false);
              isRecordingRef.current = false;
              stopAudioVisualization();
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
          isRecordingRef.current = false;
          stopAudioVisualization();
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
          // Brave браузер может блокировать Web Speech API
          hasErrorRef.current = true; // Предотвращаем автоматический перезапуск
          
          // Определяем браузер для специального сообщения
          const isBrave = (navigator as any).brave && (navigator as any).brave.isBrave instanceof Function
            ? (navigator as any).brave.isBrave()
            : false;
          
          let errorMsg: string;
          if (isBrave) {
            errorMsg = language === 'ru'
              ? 'Brave браузер блокирует Web Speech API. Пожалуйста, используйте Chrome, Edge или Firefox, либо включите Web Speech API в настройках Brave (brave://settings/privacy).'
              : 'Brave browser blocks Web Speech API. Please use Chrome, Edge, or Firefox, or enable Web Speech API in Brave settings (brave://settings/privacy).';
          } else {
            errorMsg = language === 'ru'
              ? 'Ошибка подключения к сервису распознавания речи. Убедитесь, что страница открыта через localhost или HTTPS. Если проблема сохраняется, попробуйте другой браузер (Chrome, Edge).'
              : 'Speech recognition service connection error. Make sure the page is opened via localhost or HTTPS. If the problem persists, try another browser (Chrome, Edge).';
          }
          
          setErrorMessage(errorMsg);
          onErrorRef.current?.(errorMsg);
          setIsRecording(false);
          isRecordingRef.current = false;
          stopAudioVisualization();
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
          isRecordingRef.current = false;
          stopAudioVisualization();
          onRecordingChangeRef.current?.(false);
          return;
        }
        
        // Для других ошибок - останавливаем
        setIsRecording(false);
        isRecordingRef.current = false;
        stopAudioVisualization();
        onRecordingChangeRef.current?.(false);
        setInterimText("");
        finalTextRef.current = "";
      };

      recognition.onend = () => {
        // Если была ошибка - НЕ перезапускаем
        if (hasErrorRef.current) {
          hasErrorRef.current = false;
          setIsRecording(false);
          isRecordingRef.current = false;
          stopAudioVisualization();
          onRecordingChangeRef.current?.(false);
          return;
        }

        // Если была ручная остановка - завершаем и отправляем результат
        if (isManualStopRef.current) {
          isManualStopRef.current = false;
          setIsRecording(false);
          isRecordingRef.current = false;
          stopAudioVisualization();
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
                isRecordingRef.current = true;
                onRecordingChangeRef.current?.(true);
                // Запускаем визуализацию при перезапуске, если еще не запущена
                if (!streamRef.current) {
                  startAudioVisualization();
                }
              } catch (e: any) {
                // Если ошибка "already started" - игнорируем, значит уже работает
                if (e?.message?.includes('already started')) {
                  return;
                }
                setIsRecording(false);
                isRecordingRef.current = false;
                stopAudioVisualization();
                onRecordingChangeRef.current?.(false);
              }
            }
          }, 200); // Задержка для гарантии полной остановки
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      
      // Определяем браузер для специального сообщения
      const isBrave = (navigator as any).brave && (navigator as any).brave.isBrave instanceof Function
        ? (navigator as any).brave.isBrave()
        : false;
      
      if (isBrave && !isSecureContext) {
        // Brave может блокировать даже на localhost
        const errorMsg = language === 'ru'
          ? 'Brave браузер может блокировать Web Speech API. Попробуйте: 1) Откройте brave://settings/privacy и включите Web Speech API, 2) Используйте Chrome или Edge для голосового ввода.'
          : 'Brave browser may block Web Speech API. Try: 1) Open brave://settings/privacy and enable Web Speech API, 2) Use Chrome or Edge for voice input.';
        setErrorMessage(errorMsg);
        onErrorRef.current?.(errorMsg);
      } else if (!SpeechRecognition) {
        // API не поддерживается браузером
        const errorMsg = language === 'ru'
          ? 'Ваш браузер не поддерживает распознавание речи. Пожалуйста, используйте Chrome или Edge.'
          : 'Your browser does not support speech recognition. Please use Chrome or Edge.';
        setErrorMessage(errorMsg);
        onErrorRef.current?.(errorMsg);
      } else if (!isSecureContext) {
        // Небезопасный контекст
        const errorMsg = language === 'ru'
          ? 'Распознавание речи работает только через HTTPS или localhost. Пожалуйста, откройте страницу через http://localhost:5000'
          : 'Speech recognition works only via HTTPS or localhost. Please open the page via http://localhost:5000';
        setErrorMessage(errorMsg);
        onErrorRef.current?.(errorMsg);
      }
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
      if (errorMessage) {
        // Показываем сообщение об ошибке вместо alert
        return;
      }
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
      isRecordingRef.current = false;
      stopAudioVisualization();
      onRecordingChangeRef.current?.(false); // Уведомляем родителя об остановке
    } else {
      // Проверяем безопасный контекст перед запуском
      const isSecureContext = 
        window.isSecureContext || 
        window.location.protocol === 'https:' || 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '[::1]' || // IPv6 localhost
        window.location.hostname.endsWith('.localhost'); // Поддомены localhost
      
      if (!isSecureContext) {
        // Определяем браузер для специального сообщения
        const isBrave = (navigator as any).brave && (navigator as any).brave.isBrave instanceof Function
          ? (navigator as any).brave.isBrave()
          : false;
        
        let errorMsg: string;
        if (isBrave) {
          errorMsg = language === 'ru'
            ? 'Brave браузер может блокировать Web Speech API. Попробуйте: 1) Откройте brave://settings/privacy и включите Web Speech API, 2) Используйте Chrome или Edge, 3) Убедитесь, что страница открыта через http://localhost:5000'
            : 'Brave browser may block Web Speech API. Try: 1) Open brave://settings/privacy and enable Web Speech API, 2) Use Chrome or Edge, 3) Make sure the page is opened via http://localhost:5000';
        } else {
          errorMsg = language === 'ru'
            ? 'Распознавание речи работает только через HTTPS или localhost. Пожалуйста, откройте страницу через безопасное соединение (http://localhost:5000).'
            : 'Speech recognition works only via HTTPS or localhost. Please open the page via secure connection (http://localhost:5000).';
        }
        setErrorMessage(errorMsg);
        onErrorRef.current?.(errorMsg);
        return;
      }
      
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
        isRecordingRef.current = true;
        onRecordingChangeRef.current?.(true);
        // Запускаем визуализацию звука
        startAudioVisualization();
      } catch (e: any) {
        setIsRecording(false);
        isRecordingRef.current = false;
        stopAudioVisualization();
        onRecordingChangeRef.current?.(false);
        // Показываем ошибку, если не удалось запустить
        if (e?.message?.includes('not allowed') || e?.message?.includes('permission')) {
          const errorMsg = language === 'ru'
            ? 'Разрешение на использование микрофона не предоставлено. Пожалуйста, разрешите доступ в настройках браузера.'
            : 'Microphone permission not granted. Please allow access in browser settings.';
          setErrorMessage(errorMsg);
          onErrorRef.current?.(errorMsg);
        } else if (e?.message?.includes('network') || e?.message?.includes('service')) {
          const errorMsg = language === 'ru'
            ? 'Ошибка подключения к сервису распознавания речи. Убедитесь, что страница открыта через localhost или HTTPS.'
            : 'Speech recognition service connection error. Make sure the page is opened via localhost or HTTPS.';
          setErrorMessage(errorMsg);
          onErrorRef.current?.(errorMsg);
        }
      }
    }
  };

  // Показываем компонент даже если не поддерживается, чтобы показать ошибку
  if (!isSupported && !errorMessage) {
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
            ? "bg-red-500 text-white"
            : "bg-blue-500 text-white hover:bg-blue-600",
          className
        )}
        aria-label={language === 'ru' ? 'Запись голоса' : 'Record voice'}
      >
        <Mic className="h-6 w-6" />
      </button>
      
      {/* Визуализация звука (волны как в Telegram) */}
      {isRecording && (
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
