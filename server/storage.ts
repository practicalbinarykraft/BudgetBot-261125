import {
  User, InsertUser, Transaction, InsertTransaction, Wallet, InsertWallet,
  Category, InsertCategory, PersonalTag, Recurring, InsertRecurring,
  WishlistItem, InsertWishlist, PlannedTransaction, InsertPlannedTransaction,
  PlannedIncome, InsertPlannedIncome, Settings, InsertSettings,
  Budget, InsertBudget, AiChatMessage, InsertAiChatMessage, OwnedInsert
} from "@shared/schema";

import { userRepository } from "./repositories/user.repository";
import { transactionRepository } from "./repositories/transaction.repository";
import { walletRepository } from "./repositories/wallet.repository";
import { categoryRepository } from "./repositories/category.repository";
import { tagRepository } from "./repositories/tag.repository";
import { recurringRepository } from "./repositories/recurring.repository";
import { wishlistRepository } from "./repositories/wishlist.repository";
import { plannedRepository } from "./repositories/planned.repository";
import { plannedIncomeRepository } from "./repositories/planned-income.repository";
import { settingsRepository } from "./repositories/settings.repository";
import { budgetRepository } from "./repositories/budget.repository";
import { aiChatRepository } from "./repositories/ai-chat.repository";

/**
 * Интерфейс хранилища данных
 *
 * Для джуна: Это контракт, который описывает все методы работы с БД.
 * Методы getXxxByUserId возвращают объект с данными и total для пагинации.
 */
export interface IStorage {
  // Users
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: number): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;

  // Transactions
  getTransactionsByUserId(userId: number, filters?: { personalTagId?: number; from?: string; to?: string; limit?: number; offset?: number }): Promise<{ transactions: Transaction[]; total: number }>;
  getTransactionById(id: number): Promise<Transaction | null>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;

  // Wallets
  getWalletsByUserId(userId: number, filters?: { limit?: number; offset?: number }): Promise<{ wallets: Wallet[]; total: number }>;
  getWalletById(id: number): Promise<Wallet | null>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: number, wallet: Partial<InsertWallet>): Promise<Wallet>;
  deleteWallet(id: number): Promise<void>;

  // Categories
  getCategoriesByUserId(userId: number, filters?: { limit?: number; offset?: number }): Promise<{ categories: Category[]; total: number }>;
  getCategoryById(id: number): Promise<Category | null>;
  getCategoryByNameAndUserId(name: string, userId: number): Promise<Category | null>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Personal Tags
  getPersonalTagsByUserId(userId: number, filters?: { limit?: number; offset?: number }): Promise<{ tags: PersonalTag[]; total: number }>;

  // Recurring
  getRecurringByUserId(userId: number, filters?: { limit?: number; offset?: number }): Promise<{ recurring: Recurring[]; total: number }>;
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

  // Planned Income
  getPlannedIncomeByUserId(userId: number, filters?: { status?: string }): Promise<PlannedIncome[]>;
  getPlannedIncomeById(id: number): Promise<PlannedIncome | null>;
  createPlannedIncome(income: OwnedInsert<InsertPlannedIncome>): Promise<PlannedIncome>;
  updatePlannedIncome(id: number, income: Partial<InsertPlannedIncome>): Promise<PlannedIncome>;
  deletePlannedIncome(id: number): Promise<void>;

  // Settings
  getSettingsByUserId(userId: number): Promise<Settings | null>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(userId: number, settings: Partial<InsertSettings>): Promise<Settings>;

  // Budgets
  getBudgetsByUserId(userId: number, filters?: { limit?: number; offset?: number }): Promise<{ budgets: Budget[]; total: number }>;
  getBudgetById(id: number): Promise<Budget | null>;
  createBudget(budget: OwnedInsert<InsertBudget>): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget>;
  deleteBudget(id: number): Promise<void>;

  // AI Chat Messages
  getAIChatMessages(userId: number, limit?: number): Promise<AiChatMessage[]>;
  createAIChatMessage(message: OwnedInsert<InsertAiChatMessage>): Promise<number>;
}

/**
 * Реализация хранилища через PostgreSQL/Drizzle
 *
 * Для джуна: Этот класс делегирует вызовы в отдельные репозитории.
 * Каждый репозиторий отвечает за свою таблицу в БД.
 */
export class DatabaseStorage implements IStorage {
  // Users
  getUserByEmail(email: string) { return userRepository.getUserByEmail(email); }
  getUserById(id: number) { return userRepository.getUserById(id); }
  createUser(user: InsertUser) { return userRepository.createUser(user); }

  // Transactions
  getTransactionsByUserId(userId: number, filters?: { personalTagId?: number; from?: string; to?: string; limit?: number; offset?: number }) { return transactionRepository.getTransactionsByUserId(userId, filters); }
  getTransactionById(id: number) { return transactionRepository.getTransactionById(id); }
  createTransaction(transaction: InsertTransaction) { return transactionRepository.createTransaction(transaction); }
  updateTransaction(id: number, transaction: Partial<InsertTransaction>) { return transactionRepository.updateTransaction(id, transaction); }
  deleteTransaction(id: number) { return transactionRepository.deleteTransaction(id); }

  // Wallets
  getWalletsByUserId(userId: number, filters?: { limit?: number; offset?: number }) { return walletRepository.getWalletsByUserId(userId, filters); }
  getWalletById(id: number) { return walletRepository.getWalletById(id); }
  createWallet(wallet: InsertWallet) { return walletRepository.createWallet(wallet); }
  updateWallet(id: number, wallet: Partial<InsertWallet>) { return walletRepository.updateWallet(id, wallet); }
  deleteWallet(id: number) { return walletRepository.deleteWallet(id); }

  // Categories
  getCategoriesByUserId(userId: number, filters?: { limit?: number; offset?: number }) { return categoryRepository.getCategoriesByUserId(userId, filters); }
  getCategoryById(id: number) { return categoryRepository.getCategoryById(id); }
  getCategoryByNameAndUserId(name: string, userId: number) { return categoryRepository.getCategoryByNameAndUserId(name, userId); }
  createCategory(category: InsertCategory) { return categoryRepository.createCategory(category); }
  updateCategory(id: number, category: Partial<InsertCategory>) { return categoryRepository.updateCategory(id, category); }
  deleteCategory(id: number) { return categoryRepository.deleteCategory(id); }

  // Personal Tags
  getPersonalTagsByUserId(userId: number, filters?: { limit?: number; offset?: number }) { return tagRepository.getPersonalTagsByUserId(userId, filters); }

  // Recurring
  getRecurringByUserId(userId: number, filters?: { limit?: number; offset?: number }) { return recurringRepository.getRecurringByUserId(userId, filters); }
  getRecurringById(id: number) { return recurringRepository.getRecurringById(id); }
  createRecurring(recurring: InsertRecurring) { return recurringRepository.createRecurring(recurring); }
  updateRecurring(id: number, recurring: Partial<InsertRecurring>) { return recurringRepository.updateRecurring(id, recurring); }
  deleteRecurring(id: number) { return recurringRepository.deleteRecurring(id); }

  // Wishlist
  getWishlistByUserId(userId: number) { return wishlistRepository.getWishlistByUserId(userId); }
  getWishlistById(id: number) { return wishlistRepository.getWishlistById(id); }
  createWishlist(wishlist: InsertWishlist) { return wishlistRepository.createWishlist(wishlist); }
  updateWishlist(id: number, wishlist: Partial<InsertWishlist>) { return wishlistRepository.updateWishlist(id, wishlist); }
  deleteWishlist(id: number) { return wishlistRepository.deleteWishlist(id); }

  // Planned Transactions
  getPlannedByUserId(userId: number) { return plannedRepository.getPlannedByUserId(userId); }
  getPlannedById(id: number) { return plannedRepository.getPlannedById(id); }
  createPlanned(planned: InsertPlannedTransaction) { return plannedRepository.createPlanned(planned); }
  updatePlanned(id: number, planned: Partial<InsertPlannedTransaction>) { return plannedRepository.updatePlanned(id, planned); }
  deletePlanned(id: number) { return plannedRepository.deletePlanned(id); }

  // Planned Income
  getPlannedIncomeByUserId(userId: number, filters?: { status?: string }) { return plannedIncomeRepository.getPlannedIncomeByUserId(userId, filters); }
  getPlannedIncomeById(id: number) { return plannedIncomeRepository.getPlannedIncomeById(id); }
  createPlannedIncome(income: OwnedInsert<InsertPlannedIncome>) { return plannedIncomeRepository.createPlannedIncome(income); }
  updatePlannedIncome(id: number, income: Partial<InsertPlannedIncome>) { return plannedIncomeRepository.updatePlannedIncome(id, income); }
  deletePlannedIncome(id: number) { return plannedIncomeRepository.deletePlannedIncome(id); }

  // Settings
  getSettingsByUserId(userId: number) { return settingsRepository.getSettingsByUserId(userId); }
  createSettings(settings: InsertSettings) { return settingsRepository.createSettings(settings); }
  updateSettings(userId: number, settings: Partial<InsertSettings>) { return settingsRepository.updateSettings(userId, settings); }

  // Budgets
  getBudgetsByUserId(userId: number, filters?: { limit?: number; offset?: number }) { return budgetRepository.getBudgetsByUserId(userId, filters); }
  getBudgetById(id: number) { return budgetRepository.getBudgetById(id); }
  createBudget(budget: OwnedInsert<InsertBudget>) { return budgetRepository.createBudget(budget); }
  updateBudget(id: number, budget: Partial<InsertBudget>) { return budgetRepository.updateBudget(id, budget); }
  deleteBudget(id: number) { return budgetRepository.deleteBudget(id); }

  // AI Chat Messages
  getAIChatMessages(userId: number, limit?: number) { return aiChatRepository.getAIChatMessages(userId, limit); }
  createAIChatMessage(message: OwnedInsert<InsertAiChatMessage>) { return aiChatRepository.createAIChatMessage(message); }
}

export const storage = new DatabaseStorage();
