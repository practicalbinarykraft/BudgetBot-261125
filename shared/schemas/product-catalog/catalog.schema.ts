import { pgTable, serial, text, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { users } from "../../schema";

/**
 * Product Catalog Table
 * Stores user's frequently purchased products with price tracking
 */
export const productCatalog = pgTable('product_catalog', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Основная информация
  name: text('name').notNull(), // "Макароны Barilla № 5"
  normalizedName: text('normalized_name').notNull(), // "макароны barilla 5"
  
  // Детали товара
  brand: text('brand'), // "Barilla"
  weight: text('weight'), // "500г"
  unit: text('unit'), // "шт", "кг", "л"
  
  // Категоризация
  category: text('category'), // "Продукты питания"
  subcategory: text('subcategory'), // "Макароны"
  
  // Статистика покупок
  purchaseCount: integer('purchase_count').default(0),
  lastPurchaseDate: text('last_purchase_date'), // YYYY-MM-DD
  
  // Цены (денормализация для скорости)
  averagePrice: decimal('average_price', { precision: 10, scale: 2 }),
  bestPrice: decimal('best_price', { precision: 10, scale: 2 }),
  bestStore: text('best_store'),
  
  // Метаданные
  imageUrl: text('image_url'),
  barcode: text('barcode'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// TypeScript types
export type ProductCatalog = typeof productCatalog.$inferSelect;
export type InsertProductCatalog = typeof productCatalog.$inferInsert;
