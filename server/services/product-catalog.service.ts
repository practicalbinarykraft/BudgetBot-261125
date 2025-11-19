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
  
  // Найти лучшую (минимальную)
  const best = prices.reduce((min, p) => 
    parseFloat(p.price) < parseFloat(min.price) ? p : min
  );
  
  // Рассчитать среднюю
  const sum = prices.reduce((acc, p) => acc + parseFloat(p.price), 0);
  const avg = sum / prices.length;
  
  // Обновить товар
  await productCatalogRepository.update(productId, {
    bestPrice: best.price,
    bestStore: best.storeName,
    averagePrice: avg.toFixed(2)
  });
}
