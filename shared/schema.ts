import { sql } from "drizzle-orm";
import { pgTable, serial, text, varchar, decimal, date, boolean, timestamp, integer, pgEnum, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const financialTypeEnum = pgEnum('financial_type', [
  'essential',      // Обязательные расходы (rent, groceries, utilities)
  'discretionary',  // Необязательные расходы (entertainment, restaurants)
  'asset',          // Активы (courses, investments, income-generating)
  'liability'       // Пассивы (loans, depreciating purchases)
]);

export const toolExecutionStatusEnum = pgEnum('tool_execution_status', [
  'pending',    // Waiting for user confirmation
  'confirmed',  // User confirmed, executing
  'executed',   // Successfully executed
  'cancelled'   // User cancelled
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  telegramId: text("telegram_id").unique(),
  telegramUsername: text("telegram_username"),
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
  // 🔄 Hybrid migration: new transactions use categoryId, legacy uses text category
  category: text("category"), // Legacy field - will be deprecated
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }), // Nullable for backward compat
  currency: text("currency").default("USD"),
  amountUsd: decimal("amount_usd", { precision: 10, scale: 2 }).notNull(),
  // 💱 Multi-currency support: preserve original values for history
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }),
  originalCurrency: text("original_currency"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
  source: text("source").default("manual"), // 'manual', 'telegram', 'ocr'
  walletId: integer("wallet_id").references(() => wallets.id, { onDelete: "set null" }),
  // 👥 Personal Tags: WHO is this transaction for?
  personalTagId: integer("personal_tag_id").references(() => personalTags.id, { onDelete: "set null" }),
  // 🎯 Financial Classification: WHY was this spent? (Essential/Discretionary/Asset/Liability)
  financialType: financialTypeEnum("financial_type").default("discretionary"),
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
  // 💱 Multi-currency: auto-converted balance in USD for aggregations
  balanceUsd: decimal("balance_usd", { precision: 10, scale: 2 }),
  isPrimary: integer("is_primary").default(0).notNull(), // 1 for primary wallet, 0 otherwise
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
  frequency: text("frequency").notNull(), // 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  nextDate: date("next_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  // 💱 Multi-currency support: same as transactions
  currency: text("currency").default("USD"),
  amountUsd: decimal("amount_usd", { precision: 10, scale: 2 }).notNull().default("0"),
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }),
  originalCurrency: text("original_currency"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
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

// Planned Transactions table
export const plannedTransactions = pgTable("planned_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category"),
  targetDate: date("target_date").notNull(),
  source: text("source").default("manual"), // 'manual' | 'wishlist'
  wishlistId: integer("wishlist_id").references(() => wishlist.id, { onDelete: "set null" }),
  status: text("status").default("planned"), // 'planned' | 'purchased' | 'cancelled'
  purchasedAt: timestamp("purchased_at"),
  transactionId: integer("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Planned Income table (one-time expected income)
export const plannedIncome = pgTable("planned_income", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Basic fields
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  amountUsd: decimal("amount_usd", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  
  // Expected date
  expectedDate: date("expected_date").notNull(),
  
  // Status tracking
  status: text("status").default("pending"), // 'pending' | 'received' | 'cancelled'
  
  // Link to actual transaction when received
  transactionId: integer("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  receivedAt: timestamp("received_at"),
  
  // Metadata
  source: text("source").default("manual"), // 'manual' | 'ai' | 'telegram'
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  language: text("language").default("en"),
  currency: text("currency").default("USD"),
  telegramNotifications: boolean("telegram_notifications").default(true).notNull(),
  timezone: text("timezone").default("UTC"), // User's timezone (IANA format, e.g., "Europe/Moscow", "Asia/Jakarta")
  notificationTime: text("notification_time").default("09:00"), // Time for daily notifications in HH:MM format
  anthropicApiKey: text("anthropic_api_key"), // User's BYOK for AI features (forecast, analysis)
  exchangeRateRUB: decimal("exchange_rate_rub", { precision: 10, scale: 4 }), // Custom exchange rate: 1 USD = X RUB
  exchangeRateIDR: decimal("exchange_rate_idr", { precision: 10, scale: 2 }), // Custom exchange rate: 1 USD = X IDR
  exchangeRateKRW: decimal("exchange_rate_krw", { precision: 10, scale: 2 }), // Custom exchange rate: 1 USD = X KRW
  exchangeRateEUR: decimal("exchange_rate_eur", { precision: 10, scale: 4 }), // Custom exchange rate: 1 USD = X EUR
  exchangeRateCNY: decimal("exchange_rate_cny", { precision: 10, scale: 4 }), // Custom exchange rate: 1 USD = X CNY
  exchangeRatesUpdatedAt: timestamp("exchange_rates_updated_at"), // Last time exchange rates were modified
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Budgets table
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  limitAmount: decimal("limit_amount", { precision: 10, scale: 2 }).notNull(),
  period: text("period").notNull(), // 'week', 'month', 'year'
  startDate: date("start_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Merchant Categories table (ML auto-categorization)
export const merchantCategories = pgTable("merchant_categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  merchantName: text("merchant_name").notNull(), // Normalized merchant/description
  categoryName: text("category_name").notNull(), // Learned category
  usageCount: integer("usage_count").default(1).notNull(), // How many times this pairing was used
  lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Calibrations table (Wallet balance calibration)
export const calibrations = pgTable("calibrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  walletId: integer("wallet_id").notNull().references(() => wallets.id, { onDelete: "cascade" }),
  actualBalance: decimal("actual_balance", { precision: 10, scale: 2 }).notNull(),
  expectedBalance: decimal("expected_balance", { precision: 10, scale: 2 }).notNull(),
  difference: decimal("difference", { precision: 10, scale: 2 }).notNull(),
  transactionId: integer("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Telegram Verification Codes table
export const telegramVerificationCodes = pgTable("telegram_verification_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 6 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Personal Tags table (WHO classification)
export const personalTags = pgTable("personal_tags", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),         // "Маша", "Дима", "Personal", "Shared"
  icon: text("icon").default("User"),   // Lucide icon name
  color: text("color").default("#3b82f6"),
  // Type: 'personal' = me, 'shared' = shared, 'person' = other person
  type: text("type").notNull().default("person"),
  isDefault: boolean("is_default").default(false).notNull(), // Cannot delete default tags
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sorting Progress table (Gamification state - 1 row per user)
export const sortingProgress = pgTable("sorting_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").default(0).notNull(), // Days in a row
  longestStreak: integer("longest_streak").default(0).notNull(), // Best streak record
  totalPoints: integer("total_points").default(0).notNull(), // Lifetime points
  totalSorted: integer("total_sorted").default(0).notNull(), // Total transactions sorted
  lastSessionDate: date("last_session_date"), // Last time user played
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sorting Sessions table (History of sorting game sessions)
export const sortingSessions = pgTable("sorting_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionDate: date("session_date").notNull(), // Normalized date (timezone-aware)
  transactionsSorted: integer("transactions_sorted").default(0).notNull(),
  pointsEarned: integer("points_earned").default(0).notNull(), // 10 points per transaction
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Prevent duplicate sessions per user per day
  uniqueUserDate: unique().on(table.userId, table.sessionDate),
}));

// AI Training Examples table (ML for category/tag prediction)
export const aiTrainingExamples = pgTable("ai_training_examples", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Input data (transaction details)
  transactionDescription: text("transaction_description").notNull(),
  transactionAmount: decimal("transaction_amount", { precision: 10, scale: 2 }),
  merchantName: text("merchant_name"),
  
  // AI predictions (what AI suggested)
  aiSuggestedCategoryId: integer("ai_suggested_category_id"),
  aiSuggestedTagId: integer("ai_suggested_tag_id"),
  aiConfidence: integer("ai_confidence").default(0),
  
  // User choices (what user actually selected)
  userChosenCategoryId: integer("user_chosen_category_id"),
  userChosenTagId: integer("user_chosen_tag_id"),
  userChosenType: text("user_chosen_type"),
  
  // Feedback (was AI correct?)
  aiWasCorrect: boolean("ai_was_correct").notNull().default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Receipt Items table (items parsed from receipts with OCR)
export const receiptItems = pgTable("receipt_items", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id")
    .references(() => transactions.id, { onDelete: "cascade" })
    .notNull(),
  
  // Item details
  itemName: text("item_name").notNull(),
  normalizedName: text("normalized_name"), // "orange juice" for comparison
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  unit: text("unit"), // 'pcs', 'kg', 'L'
  
  // Price
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("IDR"),
  amountUsd: decimal("amount_usd", { precision: 10, scale: 2 }), // USD for analytics
  
  // Metadata
  merchantName: text("merchant_name"),
  category: text("category"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Chat Messages table (chat history with AI financial advisor)
export const aiChatMessages = pgTable("ai_chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  
  // Source of the message (web app or telegram bot)
  source: text("source").default("web").notNull(), // 'web' | 'telegram'
  
  // Context
  contextType: text("context_type"), // e.g., 'budget', 'spending', 'goal'
  contextData: text("context_data"), // JSON string with relevant data
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Tool Executions table (history of AI agent tool calls)
export const aiToolExecutions = pgTable("ai_tool_executions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  
  sessionId: text("session_id"), // Group related tool calls
  toolName: text("tool_name").notNull(), // e.g., 'get_balance', 'add_transaction'
  params: text("params").notNull(), // JSON string with tool parameters
  result: text("result"), // JSON string with execution result
  status: toolExecutionStatusEnum("status").default("pending").notNull(),
  
  executedAt: timestamp("executed_at"),
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
  merchantCategories: many(merchantCategories),
  calibrations: many(calibrations),
  telegramVerificationCodes: many(telegramVerificationCodes),
  personalTags: many(personalTags),
  sortingSessions: many(sortingSessions),
  sortingProgress: one(sortingProgress),
  settings: one(settings),
  aiTrainingExamples: many(aiTrainingExamples),
  aiChatMessages: many(aiChatMessages),
  aiToolExecutions: many(aiToolExecutions),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
  personalTag: one(personalTags, {
    fields: [transactions.personalTagId],
    references: [personalTags.id],
  }),
  receiptItems: many(receiptItems),
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
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const merchantCategoriesRelations = relations(merchantCategories, ({ one }) => ({
  user: one(users, {
    fields: [merchantCategories.userId],
    references: [users.id],
  }),
}));

export const calibrationsRelations = relations(calibrations, ({ one }) => ({
  user: one(users, {
    fields: [calibrations.userId],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [calibrations.walletId],
    references: [wallets.id],
  }),
  transaction: one(transactions, {
    fields: [calibrations.transactionId],
    references: [transactions.id],
  }),
}));

export const personalTagsRelations = relations(personalTags, ({ one, many }) => ({
  user: one(users, {
    fields: [personalTags.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const sortingProgressRelations = relations(sortingProgress, ({ one }) => ({
  user: one(users, {
    fields: [sortingProgress.userId],
    references: [users.id],
  }),
}));

export const sortingSessionsRelations = relations(sortingSessions, ({ one }) => ({
  user: one(users, {
    fields: [sortingSessions.userId],
    references: [users.id],
  }),
}));

export const aiTrainingExamplesRelations = relations(aiTrainingExamples, ({ one }) => ({
  user: one(users, {
    fields: [aiTrainingExamples.userId],
    references: [users.id],
  }),
}));

export const receiptItemsRelations = relations(receiptItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [receiptItems.transactionId],
    references: [transactions.id],
  }),
}));

export const aiChatMessagesRelations = relations(aiChatMessages, ({ one }) => ({
  user: one(users, {
    fields: [aiChatMessages.userId],
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
  originalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  originalCurrency: z.string().optional(),
  exchangeRate: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  type: z.enum(["income", "expense"]),
  source: z.enum(["manual", "telegram", "ocr"]).optional(),
}).omit({ id: true, createdAt: true });

export const insertWalletSchema = createInsertSchema(wallets, {
  balance: z.string().regex(/^\d+(\.\d{1,2})?$/),
  balanceUsd: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  type: z.enum(["card", "cash", "crypto"]),
}).omit({ id: true, createdAt: true });

export const insertCategorySchema = createInsertSchema(categories, {
  type: z.enum(["income", "expense"]),
}).omit({ id: true, createdAt: true });

export const insertRecurringSchema = createInsertSchema(recurring, {
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  type: z.enum(["income", "expense"]),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
  currency: z.string().default("USD"),
  amountUsd: z.string().regex(/^\d+(\.\d{1,2})?$/),
}).omit({ id: true, createdAt: true });

export const insertWishlistSchema = createInsertSchema(wishlist, {
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  priority: z.enum(["low", "medium", "high"]),
}).omit({ id: true, createdAt: true });

export const insertPlannedTransactionSchema = createInsertSchema(plannedTransactions, {
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  source: z.enum(["manual", "wishlist"]).optional(),
  status: z.enum(["planned", "purchased", "cancelled"]).optional(),
}).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
});

export const insertPlannedIncomeSchema = createInsertSchema(plannedIncome, {
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  expectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  currency: z.string().optional(),
  categoryId: z.number().optional(),
  source: z.enum(["manual", "ai", "telegram"]).optional(),
  status: z.enum(["pending", "received", "cancelled"]).optional(),
  notes: z.string().optional(),
}).omit({
  id: true,
  userId: true,
  amountUsd: true,
  createdAt: true,
  updatedAt: true,
  receivedAt: true,
  transactionId: true,
});

const VALID_TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Toronto", "America/Mexico_City", "America/Sao_Paulo",
  "Europe/London", "Europe/Paris", "Europe/Moscow", "Asia/Dubai", "Asia/Kolkata",
  "Asia/Singapore", "Asia/Shanghai", "Asia/Tokyo", "Asia/Seoul", "Asia/Jakarta",
  "Australia/Sydney", "Pacific/Auckland"
] as const;

export const insertSettingsSchema = createInsertSchema(settings, {
  language: z.enum(["en", "ru"]),
  currency: z.enum(["USD", "RUB", "IDR", "KRW", "EUR", "CNY"]),
  timezone: z.string().refine(
    (tz) => !tz || VALID_TIMEZONES.includes(tz as any),
    { message: "Invalid timezone" }
  ).optional(),
  notificationTime: z.string().regex(
    /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    { message: "Invalid time format. Use HH:MM (24-hour)" }
  ).optional(),
}).omit({ id: true, createdAt: true });

// 🔒 Security: userId must come from session, NOT from client
// Omitting userId prevents client from hijacking budgets
export const insertBudgetSchema = createInsertSchema(budgets, {
  // ✅ Validation: limitAmount must be > 0 (coerces string to number)
  limitAmount: z.coerce.number().gt(0, "Limit amount must be greater than 0"),
  period: z.enum(["week", "month", "year"]),
}).omit({ 
  id: true, 
  userId: true,  // ← IMPORTANT: Never accept userId from client!
  createdAt: true 
});

export const insertMerchantCategorySchema = createInsertSchema(merchantCategories).omit({
  id: true,
  userId: true,  // Server-side only
  createdAt: true,
  lastUsedAt: true,
});

export const insertCalibrationSchema = createInsertSchema(calibrations, {
  actualBalance: z.string().regex(/^\d+(\.\d{1,2})?$/),
  expectedBalance: z.string().regex(/^\d+(\.\d{1,2})?$/),
  difference: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
}).omit({
  id: true,
  userId: true,  // Server-side only
  createdAt: true,
});

export const insertTelegramVerificationCodeSchema = createInsertSchema(telegramVerificationCodes, {
  code: z.string().length(6).regex(/^\d{6}$/),
}).omit({
  id: true,
  userId: true,  // Server-side only
  createdAt: true,
});

export const insertPersonalTagSchema = createInsertSchema(personalTags, {
  type: z.enum(["personal", "shared", "person"]).optional(),
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
}).omit({
  id: true,
  userId: true,  // Server-side only
  createdAt: true,
});

export const insertSortingSessionSchema = createInsertSchema(sortingSessions, {
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  transactionsSorted: z.number().int().min(0),
  pointsEarned: z.number().int().min(0),
}).omit({
  id: true,
  userId: true,  // Server-side only
  createdAt: true,
});

export const insertAiTrainingExampleSchema = createInsertSchema(aiTrainingExamples, {
  transactionDescription: z.string().min(1),
  transactionAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  aiConfidence: z.number().int().min(0).max(100).optional(),
}).omit({
  id: true,
  userId: true,  // Server-side only
  createdAt: true,
});

export const insertReceiptItemSchema = createInsertSchema(receiptItems, {
  itemName: z.string().min(1),
  pricePerUnit: z.string().regex(/^\d+(\.\d{1,2})?$/),
  totalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
  quantity: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertAiChatMessageSchema = createInsertSchema(aiChatMessages, {
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
}).omit({
  id: true,
  userId: true,  // Server-side only
  createdAt: true,
});

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

export type InsertPlannedTransaction = z.infer<typeof insertPlannedTransactionSchema>;
export type PlannedTransaction = typeof plannedTransactions.$inferSelect;

export type InsertPlannedIncome = z.infer<typeof insertPlannedIncomeSchema>;
export type PlannedIncome = typeof plannedIncome.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

export type InsertMerchantCategory = z.infer<typeof insertMerchantCategorySchema>;
export type MerchantCategory = typeof merchantCategories.$inferSelect;

export type InsertCalibration = z.infer<typeof insertCalibrationSchema>;
export type Calibration = typeof calibrations.$inferSelect;

export type InsertTelegramVerificationCode = z.infer<typeof insertTelegramVerificationCodeSchema>;
export type TelegramVerificationCode = typeof telegramVerificationCodes.$inferSelect;

export type InsertPersonalTag = z.infer<typeof insertPersonalTagSchema>;
export type PersonalTag = typeof personalTags.$inferSelect;

export type InsertSortingSession = z.infer<typeof insertSortingSessionSchema>;
export type SortingSession = typeof sortingSessions.$inferSelect;

export type SortingProgress = typeof sortingProgress.$inferSelect;

export type InsertAiTrainingExample = z.infer<typeof insertAiTrainingExampleSchema>;
export type AiTrainingExample = typeof aiTrainingExamples.$inferSelect;

export type InsertReceiptItem = z.infer<typeof insertReceiptItemSchema>;
export type ReceiptItem = typeof receiptItems.$inferSelect;

export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;
export type AiChatMessage = typeof aiChatMessages.$inferSelect;

export interface TrainingStats {
  totalExamples: number;
  correctPredictions: number;
  accuracy: number;
  level: string;
  levelIcon: string;
  nextMilestone: number | null;
  canEnableAutoMode: boolean;
}

// 🔐 Helper type for storage layer: public insert schemas omit userId for security,
// but storage needs userId from authenticated session
export type OwnedInsert<T> = T & { userId: number };

// ========================================
// PRODUCT CATALOG SCHEMAS (Modular)
// ========================================
export * from "./schemas/product-catalog";
