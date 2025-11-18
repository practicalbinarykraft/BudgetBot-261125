import { 
  User, 
  InsertUser, 
  Transaction, 
  InsertTransaction,
  Wallet,
  InsertWallet,
  Category,
  InsertCategory,
  PersonalTag,
  Recurring,
  InsertRecurring,
  WishlistItem,
  InsertWishlist,
  PlannedTransaction,
  InsertPlannedTransaction,
  Settings,
  InsertSettings,
  Budget,
  InsertBudget,
  AiChatMessage,
  InsertAiChatMessage,
  OwnedInsert
} from "@shared/schema";

export interface IStorage {
  // Users
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: number): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  
  // Transactions
  getTransactionsByUserId(userId: number, filters?: { personalTagId?: number; from?: string; to?: string }): Promise<Transaction[]>;
  getTransactionById(id: number): Promise<Transaction | null>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;
  
  // Wallets
  getWalletsByUserId(userId: number): Promise<Wallet[]>;
  getWalletById(id: number): Promise<Wallet | null>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: number, wallet: Partial<InsertWallet>): Promise<Wallet>;
  deleteWallet(id: number): Promise<void>;
  
  // Categories
  getCategoriesByUserId(userId: number): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | null>;
  getCategoryByNameAndUserId(name: string, userId: number): Promise<Category | null>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  
  // Personal Tags
  getPersonalTagsByUserId(userId: number): Promise<PersonalTag[]>;
  
  // Recurring
  getRecurringByUserId(userId: number): Promise<Recurring[]>;
  getRecurringById(id: number): Promise<Recurring | null>;
  createRecurring(recurring: InsertRecurring): Promise<Recurring>;
  updateRecurring(id: number, recurring: Partial<InsertRecurring>): Promise<Recurring>;
  deleteRecurring(id: number): Promise<void>;
  
  // Wishlist
  getWishlistByUserId(userId: number): Promise<WishlistItem[]>;
  getWishlistById(id: number): Promise<WishlistItem | null>;
  createWishlist(wishlist: InsertWishlist): Promise<WishlistItem>;
  updateWishlist(id: number, wishlist: Partial<InsertWishlist>): Promise<WishlistItem>;
  deleteWishlist(id: number): Promise<void>;
  
  // Planned Transactions
  getPlannedByUserId(userId: number): Promise<PlannedTransaction[]>;
  getPlannedById(id: number): Promise<PlannedTransaction | null>;
  createPlanned(planned: InsertPlannedTransaction): Promise<PlannedTransaction>;
  updatePlanned(id: number, planned: Partial<InsertPlannedTransaction>): Promise<PlannedTransaction>;
  deletePlanned(id: number): Promise<void>;
  
  // Settings
  getSettingsByUserId(userId: number): Promise<Settings | null>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(userId: number, settings: Partial<InsertSettings>): Promise<Settings>;
  
  // Budgets
  getBudgetsByUserId(userId: number): Promise<Budget[]>;
  getBudgetById(id: number): Promise<Budget | null>;
  createBudget(budget: OwnedInsert<InsertBudget>): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget>;
  deleteBudget(id: number): Promise<void>;
  
  // AI Chat Messages
  getAIChatMessages(userId: number, limit?: number): Promise<AiChatMessage[]>;
  createAIChatMessage(message: OwnedInsert<InsertAiChatMessage>): Promise<number>;
}

import { db } from "./db";
import { 
  users, 
  transactions, 
  wallets, 
  categories,
  personalTags,
  recurring, 
  wishlist, 
  plannedTransactions,
  settings,
  budgets,
  aiChatMessages
} from "@shared/schema";
import { eq, and, desc, asc, gte, lte } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // Users
  async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Transactions
  async getTransactionsByUserId(userId: number, filters?: { personalTagId?: number; from?: string; to?: string }): Promise<Transaction[]> {
    const conditions = [eq(transactions.userId, userId)];
    
    if (filters?.personalTagId !== undefined) {
      conditions.push(eq(transactions.personalTagId, filters.personalTagId));
    }
    
    if (filters?.from) {
      conditions.push(gte(transactions.date, filters.from));
    }
    
    if (filters?.to) {
      conditions.push(lte(transactions.date, filters.to));
    }
    
    return db.select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date), desc(transactions.id));
  }

  async getTransactionById(id: number): Promise<Transaction | null> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return result[0] || null;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(transaction).returning();
    return result[0];
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction> {
    const result = await db.update(transactions).set(transaction).where(eq(transactions.id, id)).returning();
    return result[0];
  }

  async deleteTransaction(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  // Wallets
  async getWalletsByUserId(userId: number): Promise<Wallet[]> {
    return db.select().from(wallets).where(eq(wallets.userId, userId));
  }

  async getWalletById(id: number): Promise<Wallet | null> {
    const result = await db.select().from(wallets).where(eq(wallets.id, id)).limit(1);
    return result[0] || null;
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const result = await db.insert(wallets).values(wallet).returning();
    return result[0];
  }

  async updateWallet(id: number, wallet: Partial<InsertWallet>): Promise<Wallet> {
    const result = await db.update(wallets).set(wallet).where(eq(wallets.id, id)).returning();
    return result[0];
  }

  async deleteWallet(id: number): Promise<void> {
    await db.delete(wallets).where(eq(wallets.id, id));
  }

  // Categories
  async getCategoriesByUserId(userId: number): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.userId, userId));
  }

  async getCategoryById(id: number): Promise<Category | null> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0] || null;
  }

  async getCategoryByNameAndUserId(name: string, userId: number): Promise<Category | null> {
    const result = await db
      .select()
      .from(categories)
      .where(and(eq(categories.name, name), eq(categories.userId, userId)))
      .limit(1);
    return result[0] || null;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const result = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Personal Tags
  async getPersonalTagsByUserId(userId: number): Promise<PersonalTag[]> {
    return db.select().from(personalTags).where(eq(personalTags.userId, userId));
  }

  // Recurring
  async getRecurringByUserId(userId: number): Promise<Recurring[]> {
    return db.select().from(recurring).where(eq(recurring.userId, userId));
  }

  async getRecurringById(id: number): Promise<Recurring | null> {
    const result = await db.select().from(recurring).where(eq(recurring.id, id)).limit(1);
    return result[0] || null;
  }

  async createRecurring(recurringData: InsertRecurring): Promise<Recurring> {
    const result = await db.insert(recurring).values(recurringData).returning();
    return result[0];
  }

  async updateRecurring(id: number, recurringData: Partial<InsertRecurring>): Promise<Recurring> {
    const result = await db.update(recurring).set(recurringData).where(eq(recurring.id, id)).returning();
    return result[0];
  }

  async deleteRecurring(id: number): Promise<void> {
    await db.delete(recurring).where(eq(recurring.id, id));
  }

  // Wishlist
  async getWishlistByUserId(userId: number): Promise<WishlistItem[]> {
    return db.select().from(wishlist).where(eq(wishlist.userId, userId));
  }

  async getWishlistById(id: number): Promise<WishlistItem | null> {
    const result = await db.select().from(wishlist).where(eq(wishlist.id, id)).limit(1);
    return result[0] || null;
  }

  async createWishlist(wishlistData: InsertWishlist): Promise<WishlistItem> {
    const result = await db.insert(wishlist).values(wishlistData).returning();
    return result[0];
  }

  async updateWishlist(id: number, wishlistData: Partial<InsertWishlist>): Promise<WishlistItem> {
    const result = await db.update(wishlist).set(wishlistData).where(eq(wishlist.id, id)).returning();
    return result[0];
  }

  async deleteWishlist(id: number): Promise<void> {
    await db.delete(wishlist).where(eq(wishlist.id, id));
  }

  // Planned Transactions
  async getPlannedByUserId(userId: number): Promise<PlannedTransaction[]> {
    return db.select().from(plannedTransactions).where(eq(plannedTransactions.userId, userId));
  }

  async getPlannedById(id: number): Promise<PlannedTransaction | null> {
    const result = await db.select().from(plannedTransactions).where(eq(plannedTransactions.id, id)).limit(1);
    return result[0] || null;
  }

  async createPlanned(plannedData: InsertPlannedTransaction): Promise<PlannedTransaction> {
    const result = await db.insert(plannedTransactions).values(plannedData).returning();
    return result[0];
  }

  async updatePlanned(id: number, plannedData: Partial<InsertPlannedTransaction>): Promise<PlannedTransaction> {
    const result = await db.update(plannedTransactions).set({ 
      ...plannedData, 
      updatedAt: new Date() 
    }).where(eq(plannedTransactions.id, id)).returning();
    return result[0];
  }

  async deletePlanned(id: number): Promise<void> {
    await db.delete(plannedTransactions).where(eq(plannedTransactions.id, id));
  }

  // Settings
  async getSettingsByUserId(userId: number): Promise<Settings | null> {
    const result = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
    return result[0] || null;
  }

  async createSettings(settingsData: InsertSettings): Promise<Settings> {
    const result = await db.insert(settings).values(settingsData).returning();
    return result[0];
  }

  async updateSettings(userId: number, settingsData: Partial<InsertSettings>): Promise<Settings> {
    const result = await db.update(settings).set(settingsData).where(eq(settings.userId, userId)).returning();
    return result[0];
  }

  // Budgets
  async getBudgetsByUserId(userId: number): Promise<Budget[]> {
    return db.select().from(budgets).where(eq(budgets.userId, userId));
  }

  async getBudgetById(id: number): Promise<Budget | null> {
    const result = await db.select().from(budgets).where(eq(budgets.id, id)).limit(1);
    return result[0] || null;
  }

  async createBudget(budgetData: OwnedInsert<InsertBudget>): Promise<Budget> {
    const payload: typeof budgets.$inferInsert = {
      ...budgetData,
      limitAmount: budgetData.limitAmount.toFixed(2),
    };
    const result = await db.insert(budgets).values(payload).returning();
    return result[0];
  }

  async updateBudget(id: number, budgetData: Partial<InsertBudget>): Promise<Budget> {
    const { limitAmount, ...rest } = budgetData;
    const payload: Partial<typeof budgets.$inferInsert> = { ...rest };
    if (limitAmount !== undefined && limitAmount !== null) {
      payload.limitAmount = limitAmount.toFixed(2);
    }
    const result = await db.update(budgets).set(payload).where(eq(budgets.id, id)).returning();
    return result[0];
  }

  async deleteBudget(id: number): Promise<void> {
    await db.delete(budgets).where(eq(budgets.id, id));
  }

  // AI Chat Messages
  async getAIChatMessages(userId: number, limit: number = 50): Promise<AiChatMessage[]> {
    return db
      .select()
      .from(aiChatMessages)
      .where(eq(aiChatMessages.userId, userId))
      .orderBy(asc(aiChatMessages.createdAt))
      .limit(limit);
  }

  async createAIChatMessage(messageData: OwnedInsert<InsertAiChatMessage>): Promise<number> {
    const result = await db.insert(aiChatMessages).values(messageData).returning();
    return result[0].id;
  }
}

export const storage = new DatabaseStorage();
