// Shared categorization service for AI chat and Telegram bot
import { getSuggestedCategory, learnCategory } from './ml-categories';
import { storage } from '../storage';
import type { Category } from '@shared/schema';

export interface CategorySuggestion {
  categoryId: number;
  categoryName: string;
  confidence: number; // 0.0 - 1.0
}

/**
 * Get ML-suggested category for a transaction description
 * Returns category with confidence score or null if no suggestion
 */
export async function suggestCategory(
  userId: number,
  description: string
): Promise<CategorySuggestion | null> {
  // Get ML suggestion
  const mlSuggestion = await getSuggestedCategory(userId, description);
  
  if (!mlSuggestion) {
    return null;
  }
  
  // Find full category object by name
  const category = await storage.getCategoryByNameAndUserId(
    mlSuggestion.category,
    userId
  );
  
  if (!category) {
    return null;
  }
  
  return {
    categoryId: category.id,
    categoryName: category.name,
    confidence: mlSuggestion.confidence
  };
}

/**
 * Get all user categories for display in dropdowns
 */
export async function getUserCategories(
  userId: number
): Promise<Category[]> {
  return storage.getCategoriesByUserId(userId);
}

/**
 * Train ML model when user selects/confirms a category
 */
export async function trainCategory(
  userId: number,
  description: string,
  categoryName: string
): Promise<void> {
  await learnCategory(userId, description, categoryName);
}
