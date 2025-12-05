import { db } from '../../db';
import { aiTrainingExamples, categories, personalTags } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export interface TrainingHistoryItem {
  id: number;
  transactionDescription: string;
  transactionAmount: string | null;
  categoryName: string | null;
  tagName: string | null;
  financialType: string | null;
  aiWasCorrect: boolean;
  createdAt: Date;
}

export async function getTrainingHistory(
  userId: number,
  limit = 50,
  offset = 0
): Promise<TrainingHistoryItem[]> {
  const examples = await db
    .select({
      id: aiTrainingExamples.id,
      transactionDescription: aiTrainingExamples.transactionDescription,
      transactionAmount: aiTrainingExamples.transactionAmount,
      categoryId: aiTrainingExamples.userChosenCategoryId,
      tagId: aiTrainingExamples.userChosenTagId,
      financialType: aiTrainingExamples.userChosenType,
      aiWasCorrect: aiTrainingExamples.aiWasCorrect,
      createdAt: aiTrainingExamples.createdAt,
    })
    .from(aiTrainingExamples)
    .where(eq(aiTrainingExamples.userId, userId))
    .orderBy(desc(aiTrainingExamples.createdAt))
    .limit(limit)
    .offset(offset);

  const categoryIds = examples
    .map(e => e.categoryId)
    .filter((id): id is number => id !== null);
  const tagIds = examples
    .map(e => e.tagId)
    .filter((id): id is number => id !== null);

  const categoriesData =
    categoryIds.length > 0
      ? await db
          .select({ id: categories.id, name: categories.name })
          .from(categories)
          .where(eq(categories.userId, userId))
      : [];

  const tagsData =
    tagIds.length > 0
      ? await db
          .select({ id: personalTags.id, name: personalTags.name })
          .from(personalTags)
          .where(eq(personalTags.userId, userId))
      : [];

  const categoryMap = new Map(categoriesData.map(c => [c.id, c.name]));
  const tagMap = new Map(tagsData.map(t => [t.id, t.name]));

  return examples.map(ex => ({
    id: ex.id,
    transactionDescription: ex.transactionDescription,
    transactionAmount: ex.transactionAmount,
    categoryName: ex.categoryId ? categoryMap.get(ex.categoryId) || null : null,
    tagName: ex.tagId ? tagMap.get(ex.tagId) || null : null,
    financialType: ex.financialType,
    aiWasCorrect: ex.aiWasCorrect,
    createdAt: ex.createdAt,
  }));
}
