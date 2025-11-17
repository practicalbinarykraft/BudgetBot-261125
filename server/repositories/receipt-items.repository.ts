import { db } from '../db';
import { 
  receiptItems, 
  transactions,
  type InsertReceiptItem, 
  type ReceiptItem 
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Repository для работы с товарами из чеков
 * 
 * Ответственность:
 * - CRUD операции для receipt_items
 * - Поиск товаров по транзакции
 * - Поиск похожих товаров для сравнения цен
 * 
 * Junior-friendly: <100 строк, понятные методы
 */
export class ReceiptItemsRepository {
  /**
   * Создать один товар из чека
   */
  async create(item: InsertReceiptItem): Promise<ReceiptItem> {
    const result = await db
      .insert(receiptItems)
      .values(item)
      .returning();
    return result[0];
  }
  
  /**
   * Создать несколько товаров за раз
   * Используется при парсинге чека с множеством позиций
   */
  async createBulk(items: InsertReceiptItem[]): Promise<ReceiptItem[]> {
    if (items.length === 0) return [];
    
    return await db
      .insert(receiptItems)
      .values(items)
      .returning();
  }
  
  /**
   * Найти все товары по ID транзакции
   * Используется для показа деталей чека
   */
  async findByTransaction(transactionId: number): Promise<ReceiptItem[]> {
    return await db
      .select()
      .from(receiptItems)
      .where(eq(receiptItems.transactionId, transactionId));
  }
  
  /**
   * Получить все товары пользователя из всех чеков
   * Используется для price recommendations
   */
  async getAllByUserId(userId: number): Promise<ReceiptItem[]> {
    const items = await db
      .select({
        item: receiptItems,
      })
      .from(receiptItems)
      .innerJoin(
        transactions,
        eq(receiptItems.transactionId, transactions.id)
      )
      .where(eq(transactions.userId, userId));
    
    return items.map(row => row.item);
  }
  
  /**
   * Найти все покупки похожего товара пользователем
   * Используется для сравнения цен между магазинами
   * 
   * @param normalizedName - нормализованное имя товара (например "orange juice")
   * @param userId - ID пользователя
   * @returns Список всех покупок этого товара
   */
  async findSimilarItems(
    normalizedName: string, 
    userId: number
  ): Promise<ReceiptItem[]> {
    const items = await db
      .select({
        item: receiptItems,
      })
      .from(receiptItems)
      .innerJoin(
        transactions,
        eq(receiptItems.transactionId, transactions.id)
      )
      .where(
        and(
          eq(receiptItems.normalizedName, normalizedName),
          eq(transactions.userId, userId)
        )
      );
    
    return items.map(row => row.item);
  }
  
  /**
   * Удалить товар по ID
   */
  async delete(id: number): Promise<void> {
    await db
      .delete(receiptItems)
      .where(eq(receiptItems.id, id));
  }
  
  /**
   * Удалить все товары транзакции
   * Автоматически вызывается при удалении транзакции (cascade)
   */
  async deleteByTransaction(transactionId: number): Promise<void> {
    await db
      .delete(receiptItems)
      .where(eq(receiptItems.transactionId, transactionId));
  }
}

// Экспорт singleton для удобного использования
export const receiptItemsRepository = new ReceiptItemsRepository();
