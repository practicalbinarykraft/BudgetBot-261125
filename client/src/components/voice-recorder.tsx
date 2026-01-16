/**
 * Voice Recorder Component
 * 
 * Records audio using Web Speech API and converts to text.
 * Supports Russian and English languages.
 */

import { useState, useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onResult: (text: string) => void;
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

export function VoiceRecorder({ onResult, className }: VoiceRecorderProps) {
  const { language } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'ru' ? 'ru-RU' : 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[event.resultIndex][0].transcript;
        onResult(transcript.trim());
        setIsRecording(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        
        // Handle specific errors
        if (event.error === 'no-speech') {
          // User didn't speak, just stop recording
          setIsRecording(false);
        } else if (event.error === 'not-allowed') {
          alert(language === 'ru' 
            ? 'Разрешение на использование микрофона не предоставлено. Пожалуйста, разрешите доступ в настройках браузера.'
            : 'Microphone permission not granted. Please allow access in browser settings.');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
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
  }, [language, onResult]);

  const handleClick = () => {
    if (!isSupported) {
      alert(language === 'ru'
        ? 'Ваш браузер не поддерживает распознавание речи. Пожалуйста, используйте Chrome или Edge.'
        : 'Your browser does not support speech recognition. Please use Chrome or Edge.');
      return;
    }

    if (!recognitionRef.current) return;

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error('Error starting recognition:', e);
        setIsRecording(false);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
        isRecording
          ? "bg-red-500 text-white animate-pulse"
          : "bg-blue-500 text-white hover:bg-blue-600",
        className
      )}
      aria-label={language === 'ru' ? 'Запись голоса' : 'Record voice'}
    >
      <Mic className="h-5 w-5" />
    </button>
  );
}
