/**
 * Hook для определения безопасных отступов в Telegram Mini App
 * 
 * Проблема: В Telegram Mini App системные элементы (шторка с названием бота)
 * перекрывают контент. Иногда Mini App развернут на весь экран, иногда нет.
 * В обычном браузере не должно быть большого отступа сверху.
 * 
 * Решение: Используем Telegram WebApp API для определения состояния и
 * правильных отступов. Для обычного браузера используем минимальные отступы.
 */

import { useEffect, useState } from 'react';
import type React from 'react';
import { useIsMobile } from './use-mobile';

interface SafeAreaInsets {
  top: number;
  bottom: number;
}

interface PaddingConfig {
  isTelegram: boolean;
  paddingTop: number;
}

const DEFAULT_SAFE_AREA: SafeAreaInsets = {
  top: 0,
  bottom: 0,
};

/**
 * Определяет, запущено ли приложение в Telegram Mini App
 */
function isTelegramMiniApp(): boolean {
  return typeof window !== 'undefined' && 
         !!window.Telegram?.WebApp?.initData;
}

/**
 * Определяет безопасные отступы для Telegram Mini App
 * 
 * @returns Объект с отступами top и bottom в пикселях
 */
export function useTelegramSafeArea(): SafeAreaInsets {
  const [safeArea, setSafeArea] = useState<SafeAreaInsets>(DEFAULT_SAFE_AREA);

  useEffect(() => {
    const updateSafeArea = () => {
      const webApp = window.Telegram?.WebApp;
      
      if (!webApp || !isTelegramMiniApp()) {
        // Не Telegram Mini App - нет дополнительных отступов
        setSafeArea(DEFAULT_SAFE_AREA);
        document.documentElement.style.removeProperty('--telegram-safe-area-top');
        return;
      }

      // Telegram Mini App
      const isExpanded = webApp.isExpanded;
      const viewportHeight = webApp.viewportHeight;
      const windowHeight = window.innerHeight;

      // Вычисляем высоту хедера Telegram
      let headerHeight = 0;
      
      if (!isExpanded) {
        // Не развернуто на весь экран - есть шторка
        if (viewportHeight > 0 && windowHeight > viewportHeight) {
          // Точное вычисление: разница между window и viewport
          headerHeight = windowHeight - viewportHeight;
        } else {
          // Fallback: стандартная высота шторки Telegram
          headerHeight = 56;
        }
      } else {
        // Развернуто на весь экран - нет шторки, но могут быть системные кнопки
        // Минимальный отступ для системных элементов (обычно 0-8px)
        headerHeight = 0;
      }

      // Устанавливаем CSS переменную
      document.documentElement.style.setProperty(
        '--telegram-safe-area-top',
        `${headerHeight}px`
      );

      setSafeArea({
        top: headerHeight,
        bottom: 0,
      });
    };

    // Обновляем при монтировании
    updateSafeArea();

    // Слушаем изменения viewport
    window.addEventListener('resize', updateSafeArea);
    
    // Для Telegram Mini App периодически проверяем изменения
    if (isTelegramMiniApp()) {
      const interval = setInterval(updateSafeArea, 500);
      
      return () => {
        window.removeEventListener('resize', updateSafeArea);
        clearInterval(interval);
      };
    }

    return () => {
      window.removeEventListener('resize', updateSafeArea);
    };
  }, []);

  return safeArea;
}

/**
 * Получить конфигурацию padding-top в зависимости от контекста
 * 
 * @param isMobile - флаг мобильного устройства
 * @returns Объект с информацией о контексте и нужном отступе
 */
function getPaddingConfig(isMobile: boolean): PaddingConfig {
  const isTelegram = isTelegramMiniApp();
  const webApp = window.Telegram?.WebApp;

  if (isTelegram && webApp) {
    // Telegram Mini App
    const isExpanded = webApp.isExpanded;
    const viewportHeight = webApp.viewportHeight;
    const windowHeight = window.innerHeight;
    
    let headerHeight = 0;
    if (!isExpanded) {
      // Есть шторка
      if (viewportHeight > 0 && windowHeight > viewportHeight) {
        headerHeight = windowHeight - viewportHeight;
      } else {
        headerHeight = 56; // Fallback
      }
    }
    
    // Для Telegram: headerHeight + базовый padding
    // На мобильных: header + 12px (компактный padding)
    // На десктопе: header + 16px (стандартный padding)
    const basePadding = isMobile ? 12 : 16;
    return {
      isTelegram: true,
      paddingTop: headerHeight + basePadding,
    };
  } else {
    // Обычный браузер
    // На мобильных: небольшой отступ для статус-бара (16-20px)
    // На десктопе: стандартный отступ (16px)
    return {
      isTelegram: false,
      paddingTop: isMobile ? 16 : 16, // Одинаковый для мобильных и десктопа в браузере
    };
  }
}

/**
 * Получить inline стиль для padding-top с учетом контекста
 * 
 * @returns Объект со стилями для использования в style prop
 */
export function useTelegramPaddingTopStyle(): React.CSSProperties {
  const isMobile = useIsMobile();
  const [paddingTop, setPaddingTop] = useState<number>(16);

  useEffect(() => {
    const updatePadding = () => {
      const config = getPaddingConfig(isMobile);
      setPaddingTop(config.paddingTop);
    };

    updatePadding();
    window.addEventListener('resize', updatePadding);

    // Для Telegram периодически обновляем
    if (isTelegramMiniApp()) {
      const interval = setInterval(updatePadding, 500);
      return () => {
        window.removeEventListener('resize', updatePadding);
        clearInterval(interval);
      };
    }

    return () => {
      window.removeEventListener('resize', updatePadding);
    };
  }, [isMobile]); // Зависимость от isMobile для реактивности

  return {
    paddingTop: `${paddingTop}px`,
  };
}

