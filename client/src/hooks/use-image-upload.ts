/**
 * Хук для загрузки изображений (OCR чеков)
 *
 * Для джуна: Этот хук обрабатывает загрузку фото чеков:
 * 1. Валидация файла (тип, размер)
 * 2. Отправка на сервер для OCR
 * 3. Управление состоянием загрузки
 * 4. Показ уведомлений об успехе/ошибке
 *
 * @example
 * const { uploadImage, isUploading, selectedFile, clearFile } = useImageUpload();
 *
 * // В input onChange:
 * <input type="file" onChange={(e) => uploadImage(e.target.files?.[0])} />
 */

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

/**
 * Максимальный размер файла (10 МБ)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Результат валидации файла
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Хук для загрузки изображений
 *
 * Для джуна: Принимает callback onSuccess, который вызывается после успешной загрузки
 */
export function useImageUpload(onSuccess?: () => void) {
  const { toast } = useToast();

  // Состояние
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Ref для input элемента
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Валидировать файл перед загрузкой
   *
   * Для джуна: Проверяем что:
   * - Файл существует
   * - Это изображение
   * - Размер не больше 10 МБ
   */
  function validateFile(file: File | undefined): ValidationResult {
    if (!file) {
      return { valid: false, error: 'Файл не выбран' };
    }

    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Пожалуйста, загрузите изображение' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'Файл слишком большой (максимум 10 МБ)' };
    }

    return { valid: true };
  }

  /**
   * Загрузить изображение на сервер
   *
   * Для джуна: Шаги:
   * 1. Валидация файла
   * 2. Создание FormData
   * 3. Отправка POST запроса
   * 4. Обработка результата
   */
  async function uploadImage(file: File | undefined): Promise<boolean> {
    const validation = validateFile(file);

    if (!validation.valid) {
      toast({
        title: 'Ошибка',
        description: validation.error,
        variant: 'destructive',
      });
      return false;
    }

    setIsUploading(true);
    setSelectedFile(file!);

    try {
      const formData = new FormData();
      formData.append('image', file!);

      const response = await fetch('/api/ai/scan-receipt', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Не удалось отсканировать чек');
      }

      // Обновить историю чата
      queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/history'] });

      toast({
        title: 'Чек отсканирован!',
        description: 'AI проанализировал ваш чек',
      });

      // Очистить выбранный файл
      clearFile();

      // Вызвать callback успеха
      onSuccess?.();

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка при сканировании';
      toast({
        title: 'Ошибка сканирования',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  /**
   * Обработчик изменения input[type=file]
   *
   * Для джуна: Удобный хелпер для привязки к onChange
   */
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  }

  /**
   * Очистить выбранный файл
   */
  function clearFile() {
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  /**
   * Программно открыть диалог выбора файла
   */
  function openFilePicker() {
    inputRef.current?.click();
  }

  return {
    // Состояние
    isUploading,
    selectedFile,

    // Методы
    uploadImage,
    handleFileChange,
    clearFile,
    openFilePicker,

    // Ref для input
    inputRef,
  };
}
