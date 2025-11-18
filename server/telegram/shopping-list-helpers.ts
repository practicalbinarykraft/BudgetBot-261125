/**
 * Shopping List Helpers
 * Утилиты для парсинга списков покупок
 * 
 * Junior-Friendly: <200 строк, вспомогательные функции
 */

/**
 * Нормализовать название товара для сравнения цен
 * Приводит к lowercase, убирает цифры и спецсимволы
 */
export function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\d+/g, '') // Удалить цифры
    .replace(/[^a-zа-яё\s]/gi, '') // Только буквы и пробелы
    .trim()
    .replace(/\s+/g, ' '); // Множественные пробелы → один
}

/**
 * Определить валюту по тексту
 * Возвращает null если явных маркеров не найдено
 */
export function detectCurrency(text: string): 'USD' | 'RUB' | 'IDR' | null {
  const lower = text.toLowerCase();
  
  if (lower.includes('₽') || lower.includes('руб') || lower.includes('rub')) {
    return 'RUB';
  }
  
  if (lower.includes('$') || lower.includes('usd')) {
    return 'USD';
  }
  
  // Check for explicit Indonesian Rupiah markers
  if (lower.includes('rp') || lower.includes('idr') || lower.includes('₹')) {
    return 'IDR';
  }
  
  // If no explicit currency found, return null to use default
  return null;
}

/**
 * Парсить цену с поддержкой сокращений
 * "22к" → 22000
 * "15.5к" → 15500
 * "189000" → 189000
 * "5,000" → 5000 (убирает запятые тысячных разделителей)
 */
export function parsePrice(priceStr: string): number | null {
  // Убрать ВСЕ запятые и пробелы (тысячные разделители)
  const cleaned = priceStr.toLowerCase().replace(/\s+/g, '').replace(/,/g, '');
  
  // Формат "22к" или "22k"
  if (cleaned.endsWith('к') || cleaned.endsWith('k')) {
    const num = parseFloat(cleaned.slice(0, -1));
    if (!isNaN(num)) {
      return num * 1000;
    }
  }
  
  // Обычное число
  const num = parseFloat(cleaned);
  if (!isNaN(num) && num > 0) {
    return num;
  }
  
  return null;
}
