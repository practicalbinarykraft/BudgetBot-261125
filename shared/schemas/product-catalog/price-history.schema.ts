import { pgTable, serial, text, varchar, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { productCatalog } from "./catalog.schema";
import { transactions } from "../../schema";

/**
 * Product Price History Table
 * Tracks price changes across different stores over time
 */
export const productPriceHistory = pgTable('product_price_history', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => productCatalog.id, { onDelete: 'cascade' }).notNull(),
  
  // Магазин
  storeName: text('store_name').notNull(),
  storeAddress: text('store_address'),
  
  // Цена (USD для сравнения)
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // Исходная цена из чека (мультивалютность)
  priceOriginal: decimal('price_original', { precision: 12, scale: 2 }),
  currencyOriginal: varchar('currency_original', { length: 3 }),
  exchangeRate: decimal('exchange_rate', { precision: 12, scale: 6 }),
  
  // Дата покупки
  purchaseDate: text('purchase_date').notNull(), // YYYY-MM-DD
  
  // Связь с транзакцией (опционально)
  transactionId: integer('transaction_id').references(() => transactions.id),
  
  createdAt: timestamp('created_at').defaultNow()
});

// TypeScript types
export type ProductPriceHistory = typeof productPriceHistory.$inferSelect;
export type InsertProductPriceHistory = typeof productPriceHistory.$inferInsert;
