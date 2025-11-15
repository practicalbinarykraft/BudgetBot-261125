// Типы для прогресса бюджетных лимитов

export interface LimitProgress {
  budgetId: number;
  categoryId: number;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  limitAmount: string; // Decimal from DB
  spent: number;
  period: string; // 'week', 'month', 'year'
  periodStart: string; // Date ISO string
  periodEnd: string; // Date ISO string
  percentage: number;
}

// Цветовые зоны для прогресс-бара
export type ProgressColorZone = 'safe' | 'warning' | 'danger' | 'exceeded';

// Определить цветовую зону на основе процента
export function getProgressColorZone(percentage: number): ProgressColorZone {
  if (percentage <= 70) return 'safe';
  if (percentage <= 90) return 'warning';
  if (percentage <= 100) return 'danger';
  return 'exceeded';
}
