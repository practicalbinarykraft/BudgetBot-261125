import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { 
  priceSearchReports, 
  type InsertPriceSearchReport, 
  type PriceSearchReport 
} from '@shared/schema';

class PriceSearchReportsRepository {
  // Найти отчёты товара
  async findByProduct(productId: number): Promise<PriceSearchReport[]> {
    return await db
      .select()
      .from(priceSearchReports)
      .where(eq(priceSearchReports.productId, productId))
      .orderBy(desc(priceSearchReports.searchDate));
  }

  // Найти последний отчёт
  async findLatest(productId: number): Promise<PriceSearchReport | null> {
    const results = await db
      .select()
      .from(priceSearchReports)
      .where(
        and(
          eq(priceSearchReports.productId, productId),
          eq(priceSearchReports.status, 'completed')
        )
      )
      .orderBy(desc(priceSearchReports.searchDate))
      .limit(1);
    
    return results[0] || null;
  }

  // Создать отчёт
  async create(data: InsertPriceSearchReport): Promise<PriceSearchReport> {
    const results = await db
      .insert(priceSearchReports)
      .values(data)
      .returning();
    
    return results[0];
  }

  // Обновить отчёт
  async update(id: number, data: Partial<InsertPriceSearchReport>): Promise<PriceSearchReport> {
    const results = await db
      .update(priceSearchReports)
      .set(data)
      .where(eq(priceSearchReports.id, id))
      .returning();
    
    return results[0];
  }

  // Проверить есть ли свежий отчёт (< 3 дней)
  async hasRecentReport(productId: number, daysAgo: number = 3): Promise<boolean> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    const results = await db
      .select()
      .from(priceSearchReports)
      .where(
        and(
          eq(priceSearchReports.productId, productId),
          eq(priceSearchReports.status, 'completed')
        )
      )
      .orderBy(desc(priceSearchReports.searchDate))
      .limit(1);
    
    if (!results[0] || !results[0].searchDate) return false;
    
    return new Date(results[0].searchDate) > cutoffDate;
  }
}

export const priceSearchReportsRepository = new PriceSearchReportsRepository();
