/**
 * Поле ввода сообщений AI чата
 *
 * Для джуна: Компонент содержит:
 * - Textarea с авто-ресайзом
 * - Кнопку загрузки фото (OCR)
 * - Кнопку отправки
 * - Превью выбранного изображения
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/i18n/context';

interface ChatInputProps {
  onSend: (message: string) => void;
  onImageUpload: (file: File) => void;
  isSending: boolean;
  isUploading: boolean;
}

export function ChatInput({
  onSend,
  onImageUpload,
  isSending,
  isUploading,
}: ChatInputProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Авто-ресайз textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [message]);

  /**
   * Обработать отправку сообщения
   */
  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed) {
      onSend(trimmed);
      setMessage('');
    }
  };

  /**
   * Обработать нажатие Enter
   *
   * Для джуна: Enter — отправить, Shift+Enter — новая строка
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Обработать выбор файла
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Показать превью
      setPreviewUrl(URL.createObjectURL(file));
      // Загрузить файл
      onImageUpload(file);
    }
  };

  /**
   * Очистить превью
   */
  const clearPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isDisabled = isSending || isUploading;

  return (
    <div className="p-3 sm:p-4 border-t border-border">
      {/* Превью изображения */}
      {previewUrl && (
        <div className="mb-2 relative inline-block">
          <img
            src={previewUrl}
            alt="Upload preview"
            className="max-h-20 rounded border"
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background"
            onClick={clearPreview}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Поле ввода */}
      <div className="flex gap-2 items-end">
        {/* Скрытый input для файлов */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isDisabled}
        />

        {/* Кнопка загрузки фото */}
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          size="icon"
          variant="ghost"
          className="shrink-0 min-h-[44px]"
          data-testid="button-upload-image"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
        </Button>

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={t('ai_tools.input_placeholder')}
          className="resize-none overflow-hidden"
          style={{ minHeight: '44px', maxHeight: '120px' }}
          rows={1}
          disabled={isDisabled}
          data-testid="input-chat-message"
        />

        {/* Кнопка отправки */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isDisabled}
          size="icon"
          className="shrink-0 min-h-[44px]"
          data-testid="button-send-message"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
