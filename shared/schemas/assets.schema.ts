import { pgTable, serial, integer, decimal, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from '../schema';

/**
 * Assets Table
 * Stores user's assets (income-generating items) and liabilities (depreciating items)
 * Examples: real estate, vehicles, investments, tech gadgets
 */
export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Основная информация
  name: text('name').notNull(), // "Квартира Москва", "Toyota Camry"
  type: text('type').notNull(), // 'asset' или 'liability'
  categoryId: integer('category_id'), // FK к categories (nullable)
  
  // Стоимость покупки (мультивалюта)
  purchasePrice: decimal('purchase_price', { precision: 12, scale: 2 }), // USD
  purchasePriceOriginal: decimal('purchase_price_original', { precision: 12, scale: 2 }), // RUB/IDR
  purchaseCurrency: varchar('purchase_currency', { length: 3 }), // RUB/IDR/EUR
  purchaseDate: text('purchase_date'), // YYYY-MM-DD
  
  // Текущая стоимость (мультивалюта как в транзакциях)
  currentValue: decimal('current_value', { precision: 12, scale: 2 }).notNull(), // USD
  currentValueOriginal: decimal('current_value_original', { precision: 12, scale: 2 }), // RUB/IDR
  currency: varchar('currency', { length: 3 }).default('USD'),
  currencyOriginal: varchar('currency_original', { length: 3 }),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }),
  lastValuationDate: text('last_valuation_date'), // YYYY-MM-DD
  
  // Cashflow (доходы и расходы в месяц)
  monthlyIncome: decimal('monthly_income', { precision: 10, scale: 2 }).default('0'), // +800 (аренда)
  monthlyExpense: decimal('monthly_expense', { precision: 10, scale: 2 }).default('0'), // -200 (обслуживание)
  
  // Изменение цены (% в год)
  depreciationRate: decimal('depreciation_rate', { precision: 5, scale: 2 }), // -8% (машина)
  appreciationRate: decimal('appreciation_rate', { precision: 5, scale: 2 }), // +8% (недвижимость)
  
  // Медиа и детали
  imageUrl: text('image_url'),
  location: text('location'), // "Москва", "Бали"
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

/**
 * Asset Valuations Table
 * History of asset price changes (для графика изменения цены)
 */
export const assetValuations = pgTable('asset_valuations', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  
  // Стоимость на момент оценки
  value: decimal('value', { precision: 12, scale: 2 }).notNull(), // USD
  valueOriginal: decimal('value_original', { precision: 12, scale: 2 }), // RUB/IDR
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // Источник оценки
  source: text('source'), // 'manual', 'ai_estimate', 'initial'
  notes: text('notes'),
  
  // Дата оценки
  valuationDate: text('valuation_date').notNull(), // YYYY-MM-DD
  createdAt: timestamp('created_at').defaultNow()
});

// TypeScript типы
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;
export type AssetValuation = typeof assetValuations.$inferSelect;
export type InsertAssetValuation = typeof assetValuations.$inferInsert;

// Zod schemas
export const insertAssetSchema = createInsertSchema(assets, {
  currentValue: z.string().regex(/^\d+(\.\d{1,2})?$/),
  purchasePrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  type: z.enum(['asset', 'liability']),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertAssetValuationSchema = createInsertSchema(assetValuations, {
  value: z.string().regex(/^\d+(\.\d{1,2})?$/),
  source: z.enum(['manual', 'ai_estimate', 'initial']).optional(),
}).omit({ id: true, createdAt: true });
