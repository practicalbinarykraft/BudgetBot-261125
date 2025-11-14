interface SimilarTransaction {
  categoryId: number | null;
  tagId: number | null;
  financialType: string | null;
  similarity: number;
}

interface Prediction {
  categoryId: number | null;
  tagId: number | null;
}

export function calculateConfidence(
  similarTransactions: SimilarTransaction[],
  prediction: Prediction
): number {
  if (similarTransactions.length === 0) {
    return 0;
  }

  const countScore = Math.min(similarTransactions.length / 10, 1);

  const categoryMatches = similarTransactions.filter(
    (tx) => tx.categoryId === prediction.categoryId
  ).length;

  const tagMatches = similarTransactions.filter(
    (tx) => tx.tagId === prediction.tagId
  ).length;

  const totalPossibleMatches = similarTransactions.length * 2;
  const frequencyScore = (categoryMatches + tagMatches) / totalPossibleMatches;

  const avgSimilarity =
    similarTransactions.reduce((sum, tx) => sum + (tx.similarity || 0), 0) /
    similarTransactions.length;

  const finalScore = countScore * 0.3 + frequencyScore * 0.4 + avgSimilarity * 0.3;

  return Math.min(finalScore, 0.99);
}
