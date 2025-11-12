import { db } from "../db";
import { categories } from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Mapping of English category names (from parser) to category types
 * This allows us to find user's localized categories by type
 */
const CATEGORY_TYPE_MAPPING: Record<string, "expense" | "income"> = {
  // Expense categories
  "Food & Drinks": "expense",
  "Transport": "expense",
  "Shopping": "expense",
  "Entertainment": "expense",
  "Bills": "expense",
  "Unaccounted": "expense",
  
  // Income categories
  "Salary": "income",
  "Freelance": "income",
};

/**
 * Map of English category names to common translations
 * Used for fuzzy matching when exact name doesn't match
 */
const CATEGORY_NAME_SYNONYMS: Record<string, string[]> = {
  "Food & Drinks": ["food & drinks", "еда и напитки", "еда", "food"],
  "Transport": ["transport", "транспорт"],
  "Shopping": ["shopping", "покупки"],
  "Entertainment": ["entertainment", "развлечения"],
  "Bills": ["bills", "счета", "коммуналка"],
  "Salary": ["salary", "зарплата", "зп"],
  "Freelance": ["freelance", "фриланс"],
  "Unaccounted": ["unaccounted", "без категории", "прочее"],
};

/**
 * Resolve English category name to user's actual category ID
 * 
 * Resolution strategy:
 * 1. Try exact match by name (case-insensitive)
 * 2. Try synonym match
 * 3. Fall back to type matching (find any category of same type)
 * 4. Return null if nothing found
 */
export async function resolveCategoryId(
  userId: number,
  englishCategoryName: string
): Promise<number | null> {
  const categoryType = CATEGORY_TYPE_MAPPING[englishCategoryName];
  
  if (!categoryType) {
    // Unknown category, return null
    return null;
  }

  // Strategy 1: Try exact match by name (case-insensitive)
  const exactMatch = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.userId, userId),
        eq(categories.type, categoryType)
      )
    )
    .execute();

  const exactCategory = exactMatch.find(
    (cat) => cat.name.toLowerCase() === englishCategoryName.toLowerCase()
  );

  if (exactCategory) {
    return exactCategory.id;
  }

  // Strategy 2: Try synonym match
  const synonyms = CATEGORY_NAME_SYNONYMS[englishCategoryName] || [];
  const synonymCategory = exactMatch.find((cat) =>
    synonyms.some(
      (synonym) => cat.name.toLowerCase() === synonym.toLowerCase()
    )
  );

  if (synonymCategory) {
    return synonymCategory.id;
  }

  // Strategy 3: Fall back to type matching with preference for default categories
  // This handles cases where user has custom category names
  if (exactMatch.length > 0) {
    // Prefer default categories based on type
    const defaultCategoryName = categoryType === "expense" ? "Unaccounted" : "Salary";
    const defaultCategory = exactMatch.find(
      (cat) => cat.name.toLowerCase() === defaultCategoryName.toLowerCase()
    );
    
    // Return default category if found, otherwise return first match
    return defaultCategory ? defaultCategory.id : exactMatch[0].id;
  }

  // Strategy 4: Nothing found
  return null;
}

/**
 * Resolve category for a transaction based on merchant name and ML history
 * This is a fallback when keyword-based resolution fails
 */
export async function resolveByMerchantOrFallback(
  userId: number,
  merchantName: string,
  defaultEnglishCategory: string
): Promise<number | null> {
  // First try resolving using the default category from keywords
  const categoryId = await resolveCategoryId(userId, defaultEnglishCategory);
  
  if (categoryId !== null) {
    return categoryId;
  }

  // If that failed, try to find an "Unaccounted" category as ultimate fallback
  return await resolveCategoryId(userId, "Unaccounted");
}
