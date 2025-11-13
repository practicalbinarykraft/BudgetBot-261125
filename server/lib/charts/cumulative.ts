/**
 * Утилита для расчёта накопительных (cumulative) сумм
 * 
 * Для джуна: Накопительная сумма = "одометр в машине"
 * Вместо "сколько проехал сегодня" показываем "сколько проехал ВСЕГО"
 */

export interface CumulativePoint {
  income: number;
  expense: number;
}

/**
 * Превращает дневные значения в накопительные
 * 
 * Пример:
 * Вход:  [{ income: 1000, expense: 100 }, { income: 0, expense: 50 }, { income: 500, expense: 200 }]
 * Выход: [{ income: 1000, expense: 100 }, { income: 1000, expense: 150 }, { income: 1500, expense: 350 }]
 * 
 * Видно: income растёт плавно (1000 → 1000 → 1500), не скачет!
 */
export function makeCumulative<T extends CumulativePoint>(
  dataPoints: T[]
): T[] {
  // Счётчики накопления (как одометр)
  let cumulativeIncome = 0;
  let cumulativeExpense = 0;

  // Проходим по каждому дню и накапливаем суммы
  return dataPoints.map((point) => {
    // Добавляем к счётчику значения этого дня
    cumulativeIncome += point.income || 0;
    cumulativeExpense += point.expense || 0;

    // Возвращаем точку с накопительными значениями
    return {
      ...point,
      income: cumulativeIncome,
      expense: cumulativeExpense,
    };
  });
}

