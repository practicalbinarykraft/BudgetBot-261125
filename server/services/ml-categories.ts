import { db } from '../db';
import { merchantCategories } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export async function getSuggestedCategory(
  userId: number,
  description: string
): Promise<{ category: string; confidence: number } | null> {
  const normalized = normalize(description);
  
  const [result] = await db
    .select()
    .from(merchantCategories)
    .where(
      and(
        eq(merchantCategories.userId, userId),
        eq(merchantCategories.merchantName, normalized)
      )
    )
    .limit(1);
  
  if (!result) return null;
  
  const confidence = result.usageCount === 1 
    ? 0.6 
    : result.usageCount < 5 
    ? 0.8 
    : 0.95;
  
  return {
    category: result.categoryName,
    confidence
  };
}

export async function learnCategory(
  userId: number,
  description: string,
  category: string
): Promise<void> {
  const normalized = normalize(description);
  
  const existing = await db
    .select()
    .from(merchantCategories)
    .where(
      and(
        eq(merchantCategories.userId, userId),
        eq(merchantCategories.merchantName, normalized)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    const categoryChanged = existing[0].categoryName !== category;
    
    await db
      .update(merchantCategories)
      .set({
        categoryName: category,
        usageCount: categoryChanged ? 1 : existing[0].usageCount + 1,
        lastUsedAt: new Date()
      })
      .where(eq(merchantCategories.id, existing[0].id));
  } else {
    await db
      .insert(merchantCategories)
      .values({
        userId,
        merchantName: normalized,
        categoryName: category,
        usageCount: 1
      });
  }
}
