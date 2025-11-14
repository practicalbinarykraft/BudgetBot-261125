import { db } from '../../db';
import { categories, personalTags, transactions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { findSimilarTransactions } from './similarity.service';
import { calculateConfidence } from './confidence.service';

interface PredictionResult {
  categoryId: number | null;
  tagId: number | null;
  confidence: number;
  reasoning: string;
}

export async function predictForTransaction(
  transactionId: number,
  userId: number
): Promise<PredictionResult> {
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (!transaction) {
    return {
      categoryId: null,
      tagId: null,
      confidence: 0,
      reasoning: 'Transaction not found',
    };
  }

  return predictFromDescription(transaction.description, userId);
}

export async function predictFromDescription(
  description: string,
  userId: number
): Promise<PredictionResult> {
  const similar = await findSimilarTransactions(description, userId, 10);

  if (similar.length === 0) {
    return {
      categoryId: null,
      tagId: null,
      confidence: 0,
      reasoning: 'No training data yet',
    };
  }

  const categoryCounts: Record<number, number> = {};
  const tagCounts: Record<number, number> = {};

  similar.forEach((tx) => {
    if (tx.categoryId !== null) {
      categoryCounts[tx.categoryId] = (categoryCounts[tx.categoryId] || 0) + 1;
    }
    if (tx.tagId !== null) {
      tagCounts[tx.tagId] = (tagCounts[tx.tagId] || 0) + 1;
    }
  });

  const mostFrequentCategoryId =
    Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0];

  const mostFrequentTagId =
    Object.entries(tagCounts).sort(([, a], [, b]) => b - a)[0]?.[0];

  const prediction = {
    categoryId: mostFrequentCategoryId ? parseInt(mostFrequentCategoryId) : null,
    tagId: mostFrequentTagId ? parseInt(mostFrequentTagId) : null,
  };

  const confidenceScore = calculateConfidence(similar, prediction);
  const confidencePercent = Math.round(confidenceScore * 100);

  return {
    ...prediction,
    confidence: confidencePercent,
    reasoning: `Based on ${similar.length} similar transactions`,
  };
}

export async function enrichPrediction(prediction: PredictionResult, userId: number) {
  let categoryDetails = null;
  if (prediction.categoryId) {
    const [cat] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, prediction.categoryId))
      .limit(1);
    categoryDetails = cat || null;
  }

  let tagDetails = null;
  if (prediction.tagId) {
    const [tag] = await db
      .select()
      .from(personalTags)
      .where(eq(personalTags.id, prediction.tagId))
      .limit(1);
    tagDetails = tag || null;
  }

  return {
    ...prediction,
    categoryDetails,
    tagDetails,
  };
}
