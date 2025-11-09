import { sql } from "drizzle-orm";
import { pgTable, serial, text, varchar, decimal, date, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  telegramId: text("telegram_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  type: text("type").notNull(), // 'income' or 'expense'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category"),
  currency: text("currency").default("USD"),
  amountUsd: decimal("amount_usd", { precision: 10, scale: 2 }).notNull(),
  source: text("source").default("manual"), // 'manual', 'telegram', 'ocr'
  walletId: integer("wallet_id").references(() => wallets.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Wallets table
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'card', 'cash', 'crypto'
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  currency: text("currency").default("USD"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'income' or 'expense'
  icon: text("icon").default("Tag"),
  color: text("color").default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Recurring payments table
export const recurring = pgTable("recurring", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'income' or 'expense'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category"),
  frequency: text("frequency").notNull(), // 'monthly', 'weekly', 'yearly'
  nextDate: date("next_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Wishlist table
export const wishlist = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  targetDate: date("target_date"),
  priority: text("priority").default("medium"), // 'low', 'medium', 'high'
  isPurchased: boolean("is_purchased").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  language: text("language").default("en"),
  currency: text("currency").default("USD"),
  telegramNotifications: boolean("telegram_notifications").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Budgets table
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  limitAmount: decimal("limit_amount", { precision: 10, scale: 2 }).notNull(),
  period: text("period").notNull(), // 'week', 'month', 'year'
  startDate: date("start_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  transactions: many(transactions),
  wallets: many(wallets),
  categories: many(categories),
  recurring: many(recurring),
  wishlist: many(wishlist),
  budgets: many(budgets),
  settings: one(settings),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
}));

export const recurringRelations = relations(recurring, ({ one }) => ({
  user: one(users, {
    fields: [recurring.userId],
    references: [users.id],
  }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(users, {
    fields: [wishlist.userId],
    references: [users.id],
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.userId],
    references: [users.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
}));

// Zod Schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
}).omit({ id: true, createdAt: true });

export const insertTransactionSchema = createInsertSchema(transactions, {
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  amountUsd: z.string().regex(/^\d+(\.\d{1,2})?$/),
  type: z.enum(["income", "expense"]),
  source: z.enum(["manual", "telegram", "ocr"]).optional(),
}).omit({ id: true, createdAt: true });

export const insertWalletSchema = createInsertSchema(wallets, {
  balance: z.string().regex(/^\d+(\.\d{1,2})?$/),
  type: z.enum(["card", "cash", "crypto"]),
}).omit({ id: true, createdAt: true });

export const insertCategorySchema = createInsertSchema(categories, {
  type: z.enum(["income", "expense"]),
}).omit({ id: true, createdAt: true });

export const insertRecurringSchema = createInsertSchema(recurring, {
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  type: z.enum(["income", "expense"]),
  frequency: z.enum(["monthly", "weekly", "yearly"]),
}).omit({ id: true, createdAt: true });

export const insertWishlistSchema = createInsertSchema(wishlist, {
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  priority: z.enum(["low", "medium", "high"]),
}).omit({ id: true, createdAt: true });

export const insertSettingsSchema = createInsertSchema(settings, {
  language: z.enum(["en", "ru"]),
  currency: z.enum(["USD", "RUB", "IDR"]),
}).omit({ id: true, createdAt: true });

export const insertBudgetSchema = createInsertSchema(budgets, {
  limitAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  period: z.enum(["week", "month", "year"]),
}).omit({ id: true, createdAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertRecurring = z.infer<typeof insertRecurringSchema>;
export type Recurring = typeof recurring.$inferSelect;

export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type WishlistItem = typeof wishlist.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;
