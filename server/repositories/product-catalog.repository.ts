import { eq, and, like, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { productCatalog, type InsertProductCatalog, type ProductCatalog } from '@shared/schema';

class ProductCatalogRepository {
  // Найти все товары пользователя
  async findByUser(userId: number): Promise<ProductCatalog[]> {
    return await db
      .select()
      .from(productCatalog)
      .where(eq(productCatalog.userId, userId))
      .orderBy(desc(productCatalog.purchaseCount));
  }

  // Найти товар по ID
  async findById(id: number): Promise<ProductCatalog | null> {
    const results = await db
      .select()
      .from(productCatalog)
      .where(eq(productCatalog.id, id))
      .limit(1);
    
    return results[0] || null;
  }

  // Найти по нормализованному имени
  async findByNormalizedName(normalizedName: string, userId: number): Promise<ProductCatalog | null> {
    const results = await db
      .select()
      .from(productCatalog)
      .where(
        and(
          eq(productCatalog.normalizedName, normalizedName),
          eq(productCatalog.userId, userId)
        )
      )
      .limit(1);
    
    return results[0] || null;
  }

  // Создать товар
  async create(data: InsertProductCatalog): Promise<ProductCatalog> {
    const results = await db
      .insert(productCatalog)
      .values(data)
      .returning();
    
    return results[0];
  }

  // Обновить товар
  async update(id: number, data: Partial<InsertProductCatalog>): Promise<ProductCatalog> {
    const results = await db
      .update(productCatalog)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productCatalog.id, id))
      .returning();
    
    return results[0];
  }

  // Удалить товар
  async delete(id: number): Promise<void> {
    await db
      .delete(productCatalog)
      .where(eq(productCatalog.id, id));
  }

  // Увеличить счётчик покупок
  async incrementPurchaseCount(id: number): Promise<void> {
    await db
      .update(productCatalog)
      .set({
        purchaseCount: sql`${productCatalog.purchaseCount} + 1`,
        lastPurchaseDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date()
      })
      .where(eq(productCatalog.id, id));
  }

  // Поиск товаров
  async search(userId: number, query: string): Promise<ProductCatalog[]> {
    const searchPattern = `%${query.toLowerCase()}%`;
    
    return await db
      .select()
      .from(productCatalog)
      .where(
        and(
          eq(productCatalog.userId, userId),
          like(productCatalog.normalizedName, searchPattern)
        )
      )
      .orderBy(desc(productCatalog.purchaseCount));
  }

  // Фильтр по категории
  async findByCategory(userId: number, category: string): Promise<ProductCatalog[]> {
    return await db
      .select()
      .from(productCatalog)
      .where(
        and(
          eq(productCatalog.userId, userId),
          eq(productCatalog.category, category)
        )
      )
      .orderBy(desc(productCatalog.purchaseCount));
  }
}

export const productCatalogRepository = new ProductCatalogRepository();
