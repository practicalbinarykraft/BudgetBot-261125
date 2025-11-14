import { db } from '../../db';
import { aiTrainingExamples } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface SimilarTransaction {
  categoryId: number | null;
  tagId: number | null;
  financialType: string | null;
  similarity: number;
}

export async function findSimilarTransactions(
  description: string,
  userId: number,
  limit: number = 10
): Promise<SimilarTransaction[]> {
  const allExamples = await db
    .select()
    .from(aiTrainingExamples)
    .where(eq(aiTrainingExamples.userId, userId));

  if (allExamples.length === 0) {
    return [];
  }

  const normalizedInput = normalizeDescription(description);
  const inputKeywords = extractKeywords(normalizedInput);

  const scored = allExamples.map((example) => {
    const exampleNormalized = normalizeDescription(example.transactionDescription);
    const exampleKeywords = extractKeywords(exampleNormalized);
    const similarity = calculateSimilarity(inputKeywords, exampleKeywords);

    return {
      categoryId: example.userChosenCategoryId,
      tagId: example.userChosenTagId,
      financialType: example.userChosenType,
      similarity,
    };
  });

  return scored
    .filter((item) => item.similarity > 0.1)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/\d+/g, '')
    .replace(/[^\w\s\u0400-\u04FF]/g, '')
    .trim();
}

export function extractKeywords(description: string): string[] {
  const normalized = normalizeDescription(description);
  const words = normalized.split(/\s+/).filter((w) => w.length > 0);

  const stopWords = [
    'в', 'на', 'с', 'для', 'от', 'до', 'по', 'из', 'к', 'о',
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  ];

  return words.filter((w) => !stopWords.includes(w) && w.length > 2);
}

function calculateSimilarity(keywords1: string[], keywords2: string[]): number {
  if (keywords1.length === 0 && keywords2.length === 0) {
    return 0;
  }

  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);

  const intersection = new Set(Array.from(set1).filter((k) => set2.has(k)));
  const union = new Set([...keywords1, ...keywords2]);

  if (union.size === 0) {
    return 0;
  }

  return intersection.size / union.size;
}
