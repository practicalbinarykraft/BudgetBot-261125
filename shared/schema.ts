import { sql } from "drizzle-orm";
import { pgTable, serial, text, varchar, decimal, date, boolean, timestamp, integer, pgEnum, unique, jsonb, check } from "drizzle-orm/pg-core";
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

/**
 * Zod schema for notification transaction data
 * Used to validate and type transactionData field in notifications table
 */
export const notificationTransactionDataSchema = z.object({
  amount: z.string(),
  currency: z.string().default("USD"),
  description: z.string(),
  category: z.string().optional(),
  categoryId: z.number().optional(),
  type: z.enum(["income", "expense"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  recurringId: z.number().optional(),
  frequency: z.string().optional(),
  nextDate: z.string().optional(),
});

export type NotificationTransactionData = z.infer<typeof notificationTransactionDataSchema>;

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique(), // Nullable for Telegram-only users
  password: text("password"), // Nullable for Telegram-only users
  name: text("name").notNull(),
  telegramId: text("telegram_id").unique(),
  telegramUsername: text("telegram_username"),
  telegramFirstName: text("telegram_first_name"),
  telegramPhotoUrl: text("telegram_photo_url"),
  // 2FA fields
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: text("two_factor_secret"), // Encrypted TOTP secret
  // Admin fields
  isBlocked: boolean("is_blocked").default(false).notNull(), // Blocked by admin
  // Billing tier: 'free', 'basic', 'pro', 'mega', 'myself'
  tier: text("tier").default("free").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // CHECK constraint: user must have EITHER email OR telegram_id
  authMethodCheck: check("users_auth_method_check", sql`(
    (${table.email} IS NOT NULL AND ${table.password} IS NOT NULL) OR
    (${table.telegramId} IS NOT NULL)
  )`),
}));

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
  // Opening balance: the wallet's starting balance at creation time.
  // Used by trend calculator as the anchor instead of currentBalance.
  openingBalanceUsd: decimal("opening_balance_usd", { precision: 12, scale: 2 }).default("0").notNull(),
  openingBalanceDate: date("opening_balance_date"),
  isPrimary: integer("is_primary").default(0).notNull(), // 1 for primary wallet, 0 otherwise
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'income' or 'expense'
  applicableTo: text("applicable_to").default("transaction"), // 'transaction' | 'asset' | 'both'
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
  sortOrder: integer("sort_order").default(0),
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
  status: text("status").default("planned").notNull(), // 'planned' | 'purchased' | 'cancelled'
  showOnChart: boolean("show_on_chart").default(true).notNull(), // Show goal marker on forecast chart
  purchasedAt: timestamp("purchased_at"),
  transactionId: integer("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  // 💱 Multi-currency support
  currency: text("currency").default("USD"),
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
  status: text("status").default("pending").notNull(), // 'pending' | 'received' | 'cancelled'
  
  // Link to actual transaction when received
  transactionId: integer("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  receivedAt: timestamp("received_at"),
  
  // Metadata
  source: text("source").default("manual"), // 'manual' | 'ai' | 'telegram'
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notifications table (for planned transactions reminders)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Notification type and data
  type: text("type").notNull(), // 'planned_expense' | 'planned_income' | 'recurring_expense' | 'recurring_income'
  title: text("title").notNull(),
  message: text("message").notNull(),
  
  // Reference to planned transaction
  plannedTransactionId: integer("planned_transaction_id").references(() => plannedTransactions.id, { onDelete: "cascade" }),
  plannedIncomeId: integer("planned_income_id").references(() => plannedIncome.id, { onDelete: "cascade" }),
  
  // Transaction data for pre-filling form
  transactionData: jsonb("transaction_data"), // { amount, currency, description, category, type, date }
  
  // Status
  status: text("status").default("unread").notNull(), // 'unread' | 'read' | 'dismissed' | 'completed'
  
  // Dates
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
  dismissedAt: timestamp("dismissed_at"),
  completedAt: timestamp("completed_at"),
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

  // 🔐 API Keys - ENCRYPTED (AES-256-GCM)
  // Legacy fields (deprecated - will be removed after migration)
  anthropicApiKey: text("anthropic_api_key"), // DEPRECATED: Use anthropicApiKeyEncrypted
  openaiApiKey: text("openai_api_key"), // DEPRECATED: Use openaiApiKeyEncrypted

  // New encrypted fields (format: "iv:authTag:encrypted" in hex)
  anthropicApiKeyEncrypted: text("anthropic_api_key_encrypted"), // User's BYOK for AI features (encrypted)
  openaiApiKeyEncrypted: text("openai_api_key_encrypted"), // User's BYOK for Whisper (encrypted)
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

// Password Recovery Codes table
// Stores temporary 6-digit codes for password reset via Telegram or Email
export const passwordRecoveryCodes = pgTable("password_recovery_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPasswordRecoveryCodeSchema = createInsertSchema(passwordRecoveryCodes);
export type PasswordRecoveryCode = typeof passwordRecoveryCodes.$inferSelect;
export type InsertPasswordRecoveryCode = z.infer<typeof insertPasswordRecoveryCodeSchema>;

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
  currency: z.string().default("USD"),
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

export const insertNotificationSchema = createInsertSchema(notifications, {
  type: z.enum(["planned_expense", "planned_income", "recurring_expense", "recurring_income"]),
  status: z.enum(["unread", "read", "dismissed", "completed"]).optional(),
}).omit({
  id: true,
  userId: true,  // Server-side only
  createdAt: true,
  readAt: true,
  dismissedAt: true,
  completedAt: true,
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
  type: z.enum(["personal", "shared", "person", "project"]).optional(),
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

export const selectNotificationSchema = createSelectSchema(notifications);
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

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
// AUDIT LOG
// ========================================
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(), // 'create', 'update', 'delete', 'login', etc.
  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'transaction', 'wallet', 'budget', etc.
  entityId: integer("entity_id"), // ID of affected entity (null for login, etc.)
  metadata: text("metadata"), // JSON with additional details
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLog, {
  action: z.string().min(1).max(100),
  entityType: z.string().min(1).max(50),
  entityId: z.number().int().positive().optional(),
  metadata: z.string().optional(),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().optional(),
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLog.$inferSelect;

// ========================================
// EXCHANGE RATE HISTORY
// ========================================

export const exchangeRateHistory = pgTable("exchange_rate_history", {
  id: serial("id").primaryKey(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(), // USD, EUR, RUB, etc.
  rate: decimal("rate", { precision: 18, scale: 6 }).notNull(), // Exchange rate to USD
  source: varchar("source", { length: 50 }).notNull(), // 'api', 'manual', 'fallback'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExchangeRateHistorySchema = createInsertSchema(exchangeRateHistory, {
  currencyCode: z.string().length(3).toUpperCase(),
  rate: z.string().or(z.number()),
  source: z.string().min(1).max(50),
});

export type InsertExchangeRateHistory = z.infer<typeof insertExchangeRateHistorySchema>;
export type ExchangeRateHistory = typeof exchangeRateHistory.$inferSelect;

// ========================================
// AI CREDITS SYSTEM
// ========================================

export const userCredits = pgTable("user_credits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  messagesRemaining: integer("messages_remaining").notNull().default(50),
  totalGranted: integer("total_granted").notNull().default(50),
  totalUsed: integer("total_used").notNull().default(0),
  monthlyAllowance: integer("monthly_allowance").notNull().default(50),
  lastResetAt: timestamp("last_reset_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiUsageLog = pgTable("ai_usage_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  messageCount: integer("message_count").notNull().default(1),
  wasFree: boolean("was_free").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  messagesChange: integer("messages_change").notNull(),
  balanceBefore: integer("balance_before").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserCreditsSchema = createInsertSchema(userCredits);
export const insertAiUsageLogSchema = createInsertSchema(aiUsageLog);
export const insertCreditTransactionSchema = createInsertSchema(creditTransactions);

export type UserCredits = typeof userCredits.$inferSelect;
export type InsertUserCredits = z.infer<typeof insertUserCreditsSchema>;
export type AiUsageLog = typeof aiUsageLog.$inferSelect;
export type InsertAiUsageLog = z.infer<typeof insertAiUsageLogSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;

// ========================================
// PRODUCT CATALOG SCHEMAS (Modular)
// ========================================
export * from "./schemas/product-catalog";

// ========================================
// ASSETS & LIABILITIES SCHEMAS (Modular)
// ========================================
export * from "./schemas/assets.schema";

// ========================================
// ADMIN PANEL SCHEMAS
// ========================================

// Admin Users table (separate from regular users)
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("support"), // 'super_admin', 'support', 'analyst', 'readonly'
  permissions: text("permissions").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
  ipWhitelist: text("ip_whitelist").array(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Admin Audit Log table (tracks all admin actions)
export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => adminUsers.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(), // 'user.ban', 'plan.change', 'broadcast.send', 'login', 'logout'
  entityType: varchar("entity_type", { length: 50 }), // 'user', 'transaction', 'plan', 'broadcast'
  entityId: text("entity_id"), // ID of affected entity (TEXT for flexibility)
  changes: jsonb("changes"), // before/after state or metadata
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Broadcasts table (for admin panel)
export const broadcasts = pgTable("broadcasts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  templateId: text("template_id"), // Reference to template (optional)
  targetSegment: text("target_segment"), // 'all', 'active', 'new_users', 'at_risk', etc.
  targetUserIds: integer("target_user_ids").array(), // Specific user IDs (optional)
  status: text("status").notNull().default("draft"), // 'draft', 'scheduled', 'sending', 'completed', 'cancelled'
  scheduledAt: timestamp("scheduled_at"), // When to send (if scheduled)
  sentAt: timestamp("sent_at"), // When actually sent
  createdBy: integer("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Broadcast recipients table (tracks who received the broadcast)
export const broadcastRecipients = pgTable("broadcast_recipients", {
  id: serial("id").primaryKey(),
  broadcastId: integer("broadcast_id").notNull().references(() => broadcasts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // 'pending', 'sent', 'failed'
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Broadcast templates table (reusable message templates)
export const broadcastTemplates = pgTable("broadcast_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  description: text("description"),
  variables: text("variables").array(), // Available variables like {name}, {email}, etc.
  createdBy: integer("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for Admin
export const insertAdminUserSchema = createInsertSchema(adminUsers, {
  email: z.string().email(),
  passwordHash: z.string().min(1),
  role: z.enum(["super_admin", "support", "analyst", "readonly"]).optional(),
  permissions: z.array(z.string()).optional(),
  ipWhitelist: z.array(z.string()).optional(),
}).omit({ id: true, createdAt: true, lastLoginAt: true });

export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLog, {
  action: z.string().min(1).max(100),
  entityType: z.string().max(50).optional(),
  entityId: z.string().optional(),
  changes: z.any().optional(), // JSONB can be any
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().optional(),
}).omit({ id: true, createdAt: true });

// Broadcasts Zod Schemas
export const insertBroadcastSchema = createInsertSchema(broadcasts, {
  title: z.string().min(1),
  message: z.string().min(1),
  templateId: z.string().optional(),
  targetSegment: z.enum(["all", "active", "new_users", "at_risk", "churned", "power_users"]).optional(),
  targetUserIds: z.array(z.number().int().positive()).optional(),
  status: z.enum(["draft", "scheduled", "sending", "completed", "cancelled"]).optional(),
  scheduledAt: z.date().or(z.string()).optional(),
  sentAt: z.date().or(z.string()).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertBroadcastRecipientSchema = createInsertSchema(broadcastRecipients, {
  status: z.enum(["pending", "sent", "failed"]).optional(),
  sentAt: z.date().or(z.string()).optional(),
  errorMessage: z.string().optional(),
}).omit({ id: true, createdAt: true });

export const insertBroadcastTemplateSchema = createInsertSchema(broadcastTemplates, {
  name: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  description: z.string().optional(),
  variables: z.array(z.string()).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;
export type Broadcast = typeof broadcasts.$inferSelect;
export type InsertBroadcast = z.infer<typeof insertBroadcastSchema>;
export type BroadcastRecipient = typeof broadcastRecipients.$inferSelect;
export type InsertBroadcastRecipient = z.infer<typeof insertBroadcastRecipientSchema>;
export type BroadcastTemplate = typeof broadcastTemplates.$inferSelect;
export type InsertBroadcastTemplate = z.infer<typeof insertBroadcastTemplateSchema>;

// ========================================
// SUPPORT CHATS SCHEMAS
// ========================================

// Support Chats table (for admin panel)
export const supportChats = pgTable("support_chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("open"), // 'open', 'closed', 'pending', 'resolved'
  priority: text("priority").notNull().default("normal"), // 'low', 'normal', 'high', 'urgent'
  subject: text("subject"), // Subject/topic of the chat
  assignedTo: integer("assigned_to").references(() => adminUsers.id, { onDelete: "set null" }), // Admin assigned to handle this chat
  lastMessageAt: timestamp("last_message_at"), // When last message was sent
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support Messages table
export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => supportChats.id, { onDelete: "cascade" }),
  senderType: text("sender_type").notNull(), // 'user' or 'admin'
  senderId: integer("sender_id"), // user_id if sender_type='user', admin_id if sender_type='admin'
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Support Chats Zod Schemas
export const insertSupportChatSchema = createInsertSchema(supportChats, {
  status: z.enum(["open", "closed", "pending", "resolved"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  subject: z.string().optional(),
  assignedTo: z.number().int().positive().optional(),
  lastMessageAt: z.date().or(z.string()).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertSupportMessageSchema = createInsertSchema(supportMessages, {
  senderType: z.enum(["user", "admin"]),
  senderId: z.number().int().positive().optional(),
  message: z.string().min(1).max(4000),
  isRead: z.boolean().optional(),
}).omit({ id: true, createdAt: true });

// Support Types
export type SupportChat = typeof supportChats.$inferSelect;
export type InsertSupportChat = z.infer<typeof insertSupportChatSchema>;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
