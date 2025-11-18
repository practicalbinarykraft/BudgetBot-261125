/**
 * Shopping List Parser
 * Парсит текстовые списки покупок в формате:
 * - "Магазин: товар цена, товар цена"
 * - Многострочный список с дефисами
 * - Сокращения: "22к" = 22000
 * 
 * Junior-Friendly: <200 строк, одна ответственность
 */

export interface ShoppingItem {
  name: string;
  price: number;
  normalizedName: string;
}

export interface ParsedShoppingList {
  merchant: string;
  items: ShoppingItem[];
  total: number;
  currency: 'USD' | 'RUB' | 'IDR';
}

/**
 * Нормализовать название товара для сравнения цен
 * Приводит к lowercase, убирает цифры и спецсимволы
 */
function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\d+/g, '') // Удалить цифры
    .replace(/[^a-zа-яё\s]/gi, '') // Только буквы и пробелы
    .trim()
    .replace(/\s+/g, ' '); // Множественные пробелы → один
}

/**
 * Определить валюту по тексту
 */
function detectCurrency(text: string): 'USD' | 'RUB' | 'IDR' {
  const lower = text.toLowerCase();
  
  if (lower.includes('₽') || lower.includes('руб') || lower.includes('rub')) {
    return 'RUB';
  }
  
  if (lower.includes('$') || lower.includes('usd')) {
    return 'USD';
  }
  
  // По умолчанию IDR (Индонезия)
  return 'IDR';
}

/**
 * Парсить цену с поддержкой сокращений
 * "22к" → 22000
 * "15.5к" → 15500
 * "189000" → 189000
 */
function parsePrice(priceStr: string): number | null {
  const cleaned = priceStr.toLowerCase().replace(/\s+/g, '').replace(',', '.');
  
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

/**
 * Парсить одну строку товара
 * Форматы:
 * - "арбуз 22000"
 * - "арбуз: 22000"
 * - "- арбуз 22к"
 * - "• мыло: 189к"
 */
function parseItemLine(line: string): ShoppingItem | null {
  // Убрать префиксы "- " или "• "
  const cleaned = line.replace(/^[-•]\s*/, '').trim();
  
  if (!cleaned) return null;
  
  // Формат: "товар цена" или "товар: цена"
  const match = cleaned.match(/^(.+?)\s*:?\s*(\d+(?:[.,]\d+)?[кk]?)$/i);
  
  if (!match) return null;
  
  const name = match[1].trim();
  const priceStr = match[2];
  
  const price = parsePrice(priceStr);
  
  if (!price || !name) return null;
  
  return {
    name,
    price,
    normalizedName: normalizeItemName(name)
  };
}

/**
 * Основная функция парсинга списка покупок
 * 
 * Примеры входных данных:
 * 1. "Pepito: арбуз 22к, мыло 189к, сок 32к"
 * 2. "Покупки Moris:\n- арбуз 22000\n- мыло 189000"
 * 3. "Indomaret: хлеб 5к, молоко 12к, яйца 18к"
 * 
 * @param text - Текст сообщения пользователя
 * @returns Распарсенный список или null если не список
 */
export function parseShoppingList(text: string): ParsedShoppingList | null {
  if (!text || text.trim().length === 0) {
    return null;
  }
  
  // 1. Извлечь магазин (всё до первого ":")
  const merchantMatch = text.match(/^([^:\n]+):/i);
  
  if (!merchantMatch) {
    return null; // Не список покупок
  }
  
  const merchant = merchantMatch[1].trim();
  
  // 2. Извлечь текст с товарами (всё после ":")
  const itemsText = text.substring(merchantMatch[0].length).trim();
  
  if (!itemsText) {
    return null;
  }
  
  // 3. Определить валюту из текста
  const currency = detectCurrency(text);
  
  // 4. Разделить на строки (поддержка запятых и новых строк)
  const itemLines = itemsText
    .split(/[,\n]/) // Разделить по запятым или переносам
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // 5. Парсить каждую строку
  const items: ShoppingItem[] = [];
  let total = 0;
  
  for (const line of itemLines) {
    const item = parseItemLine(line);
    
    if (item) {
      items.push(item);
      total += item.price;
    }
  }
  
  // 6. Проверка: минимум 1 товар
  if (items.length === 0) {
    return null;
  }
  
  return {
    merchant,
    items,
    total,
    currency
  };
}

/**
 * Проверить является ли текст списком покупок
 * Быстрая проверка без полного парсинга
 */
export function isShoppingList(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }
  
  // Должен содержать ":" в первой строке
  const firstLine = text.split('\n')[0];
  if (!firstLine.includes(':')) {
    return false;
  }
  
  // Должен содержать числа (цены)
  if (!/\d/.test(text)) {
    return false;
  }
  
  return true;
}
