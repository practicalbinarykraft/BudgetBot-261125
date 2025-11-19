import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { 
  productPriceHistory, 
  type InsertProductPriceHistory, 
  type ProductPriceHistory 
} from '@shared/schema';

class ProductPriceHistoryRepository {
  // Найти все цены товара
  async findByProduct(productId: number): Promise<ProductPriceHistory[]> {
    return await db
      .select()
      .from(productPriceHistory)
      .where(eq(productPriceHistory.productId, productId))
      .orderBy(desc(productPriceHistory.purchaseDate));
  }

  // Найти цены по магазину
  async findByStore(productId: number, storeName: string): Promise<ProductPriceHistory[]> {
    return await db
      .select()
      .from(productPriceHistory)
      .where(
        and(
          eq(productPriceHistory.productId, productId),
          eq(productPriceHistory.storeName, storeName)
        )
      )
      .orderBy(desc(productPriceHistory.purchaseDate));
  }

  // Добавить цену
  async create(data: InsertProductPriceHistory): Promise<ProductPriceHistory> {
    const results = await db
      .insert(productPriceHistory)
      .values(data)
      .returning();
    
    return results[0];
  }

  // Получить лучшую цену (минимальную)
  async getBestPrice(productId: number): Promise<ProductPriceHistory | null> {
    const results = await db
      .select()
      .from(productPriceHistory)
      .where(eq(productPriceHistory.productId, productId))
      .orderBy(productPriceHistory.price) // ASC - от меньшего к большему
      .limit(1);
    
    return results[0] || null;
  }

  // Получить среднюю цену
  async getAveragePrice(productId: number): Promise<number> {
    const prices = await this.findByProduct(productId);
    
    if (prices.length === 0) return 0;
    
    const sum = prices.reduce((acc, p) => acc + parseFloat(p.price), 0);
    return sum / prices.length;
  }

  // Получить последнюю цену
  async getLatestPrice(productId: number): Promise<ProductPriceHistory | null> {
    const results = await db
      .select()
      .from(productPriceHistory)
      .where(eq(productPriceHistory.productId, productId))
      .orderBy(desc(productPriceHistory.purchaseDate))
      .limit(1);
    
    return results[0] || null;
  }
}

export const productPriceHistoryRepository = new ProductPriceHistoryRepository();
