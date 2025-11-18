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
 * "5,000" → 5000 (убирает запятые тысячных разделителей)
 */
function parsePrice(priceStr: string): number | null {
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
 * 3. "пепито\nхлеб 5,000\nмолоко 12,000" (без ":")
 * 
 * @param text - Текст сообщения пользователя
 * @returns Распарсенный список или null если не список
 */
export function parseShoppingList(text: string): ParsedShoppingList | null {
  if (!text || text.trim().length === 0) {
    return null;
  }
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 0) {
    return null;
  }
  
  const firstLine = lines[0];
  let merchant: string;
  let itemLines: string[];
  
  // Если первая строка содержит ":", это формат "Магазин: товары"
  if (firstLine.includes(':')) {
    const colonIndex = firstLine.indexOf(':');
    merchant = firstLine.substring(0, colonIndex).trim();
    const rest = firstLine.substring(colonIndex + 1).trim();
    
    // Товары могут быть на той же строке или на следующих
    if (rest.length > 0) {
      // Разделить по запятым если товары на одной строке
      const sameLineItems = rest.split(',').map(i => i.trim());
      itemLines = [...sameLineItems, ...lines.slice(1)];
    } else {
      itemLines = lines.slice(1);
    }
  } else if (!/\d/.test(firstLine)) {
    // Первая строка без цифр = магазин, остальные = товары
    merchant = firstLine;
    itemLines = lines.slice(1);
  } else {
    // Неправильный формат
    return null;
  }
  
  if (!merchant || itemLines.length === 0) {
    return null;
  }
  
  // Определить валюту из текста
  const currency = detectCurrency(text);
  
  // Парсить каждую строку товара
  const items: ShoppingItem[] = [];
  let total = 0;
  
  for (const line of itemLines) {
    const item = parseItemLine(line);
    
    if (item) {
      items.push(item);
      total += item.price;
    }
  }
  
  // Проверка: минимум 1 товар
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
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length < 2) {
    return false; // Нужно минимум 2 строки (магазин + товар)
  }
  
  const firstLine = lines[0];
  
  // Формат 1: "Магазин: товары" (с двоеточием)
  // Формат 2: "магазин\nтовар цена" (без двоеточия, первая строка без цифр)
  const hasColon = firstLine.includes(':');
  const firstLineHasNoDigits = !/\d/.test(firstLine);
  
  if (!hasColon && !firstLineHasNoDigits) {
    return false; // Не подходит ни под один формат
  }
  
  // Должен содержать числа (цены) хотя бы в одной строке
  if (!/\d/.test(text)) {
    return false;
  }
  
  return true;
}
