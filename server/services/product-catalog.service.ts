import { productCatalogRepository } from '../repositories/product-catalog.repository';
import { productPriceHistoryRepository } from '../repositories/product-price-history.repository';

// Нормализация названия товара
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^а-яa-z0-9\s]/g, '') // убрать спецсимволы
    .replace(/\s+/g, ' '); // убрать лишние пробелы
}

// Извлечь бренд из названия (простая логика)
export function extractBrand(name: string): string | null {
  // Известные бренды (можно расширить)
  const brands = [
    'barilla', 'простоквашино', 'nestle', 'coca-cola', 
    'pepsi', 'danone', 'макфа', 'heinz', 'knorr'
  ];
  
  const normalized = name.toLowerCase();
  
  for (const brand of brands) {
    if (normalized.includes(brand)) {
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  }
  
  return null;
}

// Извлечь вес/объём из названия
export function extractWeight(name: string): string | null {
  // Паттерны: 500г, 1кг, 1л, 500мл
  const weightPattern = /(\d+(?:\.\d+)?)\s*(г|кг|л|мл|шт)/i;
  const match = name.match(weightPattern);
  
  if (match) {
    return match[0]; // "500г"
  }
  
  return null;
}

// Найти или создать товар в каталоге
export async function findOrCreateProduct(params: {
  name: string;
  userId: number;
  category?: string;
}): Promise<number> {
  const normalizedName = normalizeName(params.name);
  
  // Попытаться найти существующий
  let product = await productCatalogRepository.findByNormalizedName(
    normalizedName, 
    params.userId
  );
  
  if (product) {
    return product.id;
  }
  
  // Создать новый
  const brand = extractBrand(params.name);
  const weight = extractWeight(params.name);
  
  product = await productCatalogRepository.create({
    userId: params.userId,
    name: params.name,
    normalizedName,
    brand,
    weight,
    category: params.category,
    purchaseCount: 0
  });
  
  return product.id;
}

// Обновить лучшую цену товара
export async function updateBestPrice(productId: number): Promise<void> {
  // Получить все цены
  const prices = await productPriceHistoryRepository.findByProduct(productId);
  
  if (prices.length === 0) return;
  
  // Найти лучшую по USD (минимальную)
  const best = prices.reduce((min, p) => 
    parseFloat(p.price) < parseFloat(min.price) ? p : min
  );
  
  // Рассчитать среднюю
  const sum = prices.reduce((acc, p) => acc + parseFloat(p.price), 0);
  const avg = sum / prices.length;
  
  // Обновить товар (сохранить и USD и исходную валюту)
  await productCatalogRepository.update(productId, {
    bestPrice: best.price,
    bestStore: best.storeName,
    averagePrice: avg.toFixed(2),
    // Исходная валюта из чека (fallback к USD если нет)
    bestPriceOriginal: best.priceOriginal || best.price,
    bestCurrencyOriginal: best.currencyOriginal || best.currency || 'USD',
    bestExchangeRate: best.exchangeRate || '1'
  });
}

// AI категоризация товара (опционально, можно и без AI)
export async function categorizeProduct(
  name: string,
  anthropicApiKey?: string
): Promise<string> {
  // Простая rule-based категоризация (работает без AI)
  const categoryRules: Record<string, string[]> = {
    'Продукты питания': [
      'макароны', 'хлеб', 'молоко', 'сыр', 'масло', 
      'мясо', 'рыба', 'овощи', 'фрукты', 'крупа'
    ],
    'Напитки': [
      'вода', 'сок', 'чай', 'кофе', 'напиток', 
      'coca', 'pepsi', 'sprite'
    ],
    'Бытовая химия': [
      'порошок', 'мыло', 'шампунь', 'гель', 
      'средство', 'чистящее'
    ],
    'Косметика': [
      'крем', 'лосьон', 'маска', 'помада', 'тушь'
    ]
  };
  
  const normalized = name.toLowerCase();
  
  // Проверить по ключевым словам
  for (const [category, keywords] of Object.entries(categoryRules)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return category;
      }
    }
  }
  
  // Если не нашли - вернуть "Разное"
  return 'Разное';
  
  // TODO: Добавить AI категоризацию позже (опционально)
  // if (anthropicApiKey) {
  //   return await categorizeWithAI(name, anthropicApiKey);
  // }
}

interface ReceiptItem {
  name: string;
  price: number;
  currency: string;
  quantity?: number;
}

// Обработать товары из чека
export async function processReceiptItems(params: {
  receiptItems: ReceiptItem[];
  userId: number;
  storeName: string;
  purchaseDate: string; // YYYY-MM-DD
  exchangeRates: Record<string, number>; // Курсы валют для конвертации
  anthropicApiKey?: string;
}): Promise<void> {
  const { receiptItems, userId, storeName, purchaseDate, exchangeRates, anthropicApiKey } = params;
  
  for (const item of receiptItems) {
    try {
      // 1. Категоризировать товар
      const category = await categorizeProduct(item.name, anthropicApiKey);
      
      // 2. Найти или создать в каталоге
      const productId = await findOrCreateProduct({
        name: item.name,
        userId,
        category
      });
      
      // 3. Увеличить счётчик покупок
      await productCatalogRepository.incrementPurchaseCount(productId);
      
      // 4. Добавить цену в историю
      // Конвертировать в USD для сравнения
      const exchangeRate = exchangeRates[item.currency] || 1;
      const priceUsd = item.currency === 'USD' 
        ? item.price 
        : item.price / exchangeRate;
      
      await productPriceHistoryRepository.create({
        productId,
        storeName,
        price: priceUsd.toFixed(2),
        currency: 'USD',
        priceOriginal: item.price.toString(),
        currencyOriginal: item.currency,
        exchangeRate: exchangeRate.toString(),
        purchaseDate
      });
      
      // 5. Обновить лучшую цену
      await updateBestPrice(productId);
      
      console.log(`✅ Processed: ${item.name} → Product ID ${productId}`);
    } catch (error) {
      console.error(`❌ Failed to process item: ${item.name}`, error);
      // Продолжаем обработку остальных товаров
    }
  }
}
