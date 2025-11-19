import { priceSearchReportsRepository } from '../repositories/price-search-reports.repository';
import { productCatalogRepository } from '../repositories/product-catalog.repository';

interface SearchResult {
  store: string;
  price: number;
  url: string;
  availability: string;
}

/**
 * AI поиск лучших цен на товар (пока заглушка)
 * 
 * В будущем (Stage 7) будет интегрирован реальный AI поиск:
 * - Claude API для парсинга результатов
 * - Web scraping маркетплейсов
 * - Автоматическое сравнение цен
 * 
 * Пока возвращает mock данные для тестирования UI
 */
export async function searchBestPrice(params: {
  productId: number;
  userApiKey?: string;
}): Promise<number> {
  const { productId, userApiKey } = params;
  
  const product = await productCatalogRepository.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  // Нормализовать текущую цену (единый baseline для mock данных)
  const baselinePrice = product.bestPrice || '100';
  const currentPrice = parseFloat(baselinePrice);
  
  // Создать отчёт со статусом pending
  const report = await priceSearchReportsRepository.create({
    productId,
    userId: product.userId,
    status: 'pending',
    searchQuery: product.name,
    searchMethod: 'ai',
    currentPrice: baselinePrice
  });
  
  // TODO: В Stage 7 добавим реальный AI поиск цен
  // Пока возвращаем mock данные для демонстрации функционала
  const mockResults: SearchResult[] = [
    {
      store: 'Озон',
      price: currentPrice * 0.9,
      url: 'https://ozon.ru',
      availability: 'В наличии'
    },
    {
      store: 'Wildberries',
      price: currentPrice * 0.95,
      url: 'https://wildberries.ru',
      availability: 'В наличии'
    },
    {
      store: 'Яндекс.Маркет',
      price: currentPrice * 0.92,
      url: 'https://market.yandex.ru',
      availability: 'В наличии'
    }
  ];
  
  // Найти лучшую цену
  const best = mockResults.reduce((min, r) => 
    r.price < min.price ? r : min
  );
  
  // Рассчитать экономию
  const savings = currentPrice - best.price;
  const savingsPercent = currentPrice > 0 
    ? (savings / currentPrice) * 100 
    : 0;
  
  // Обновить отчёт со статусом completed
  await priceSearchReportsRepository.update(report.id, {
    status: 'completed',
    results: mockResults,
    bestPrice: best.price.toString(),
    bestStore: best.store,
    bestUrl: best.url,
    savings: savings.toString(),
    savingsPercent: savingsPercent.toString()
  });
  
  return report.id;
}
