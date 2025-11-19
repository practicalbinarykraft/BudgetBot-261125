import { pgTable, serial, text, integer, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { productCatalog } from "./catalog.schema";
import { users } from "../../schema";

/**
 * Price Search Reports Table
 * Stores AI-powered price search results for products
 */
export const priceSearchReports = pgTable('price_search_reports', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => productCatalog.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Когда искали
  searchDate: timestamp('search_date').defaultNow(),
  
  // Статус поиска
  status: text('status').default('pending'), // 'pending' | 'completed' | 'failed'
  
  // Результаты (JSON массив магазинов)
  results: jsonb('results'), // [{ store, price, url, availability }]
  
  // Лучшая найденная цена
  bestPrice: decimal('best_price', { precision: 10, scale: 2 }),
  bestStore: text('best_store'),
  bestUrl: text('best_url'),
  
  // Сравнение с текущей ценой
  currentPrice: decimal('current_price', { precision: 10, scale: 2 }),
  savings: decimal('savings', { precision: 10, scale: 2 }),
  savingsPercent: decimal('savings_percent', { precision: 5, scale: 2 }),
  
  // Метаданные
  searchQuery: text('search_query'),
  searchMethod: text('search_method'), // 'ai' | 'api' | 'scraping'
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow()
});

// TypeScript types
export type PriceSearchReport = typeof priceSearchReports.$inferSelect;
export type InsertPriceSearchReport = typeof priceSearchReports.$inferInsert;
