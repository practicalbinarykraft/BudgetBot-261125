import type { Asset } from '@shared/schemas/assets.schema';

/**
 * Калькулятор обязательств (долгов)
 * 
 * Отвечает за:
 * - Расчёт остатка долга на конкретную дату
 * - Учёт ежемесячных платежей
 * - Прогнозирование погашения
 */
export class LiabilityCalculator {
  
  /**
   * Рассчитать остаток долга на конкретную дату
   * 
   * @param liability - Обязательство (кредит, ипотека)
   * @param targetDate - Дата на которую считаем
   * @returns Остаток долга в USD (отрицательное число)
   */
  calculateValueAtDate(liability: Asset, targetDate: Date): number {
    // Обязательство должно быть типа 'liability'
    if (liability.type !== 'liability') {
      return 0;
    }
    
    // Определить дату создания: приоритет purchaseDate, потом createdAt
    const startDate = liability.purchaseDate 
      ? new Date(liability.purchaseDate)
      : liability.createdAt 
        ? new Date(liability.createdAt)
        : null;
    
    if (!startDate || targetDate < startDate) {
      return 0;
    }
    
    // Начальная сумма долга (всегда положительная)
    const initialDebt = Math.abs(parseFloat(liability.currentValue));
    
    // Ежемесячный платёж (всегда положительный, даже если в БД отрицательный)
    const monthlyPayment = Math.abs(parseFloat(liability.monthlyExpense || '0'));
    if (monthlyPayment === 0) {
      return -initialDebt; // Отрицательное число
    }
    
    // Рассчитать сколько месяцев прошло (с учётом дней)
    const monthsElapsed = this.calculateMonthsElapsed(startDate, targetDate);
    
    // Рассчитать остаток долга
    const paidAmount = monthlyPayment * monthsElapsed;
    const remainingDebt = Math.max(0, initialDebt - paidAmount);
    
    return -remainingDebt; // Отрицательное число
  }
  
  /**
   * Спрогнозировать остаток долга через N месяцев
   * 
   * @param liability - Обязательство
   * @param months - Количество месяцев вперёд
   * @returns Прогнозный остаток в USD (отрицательное число)
   */
  projectValue(liability: Asset, months: number): number {
    if (liability.type !== 'liability') {
      return 0;
    }
    
    // Всегда работаем с положительными числами
    const currentDebt = Math.abs(parseFloat(liability.currentValue));
    const monthlyPayment = Math.abs(parseFloat(liability.monthlyExpense || '0'));
    
    if (monthlyPayment === 0) {
      return -currentDebt;
    }
    
    const paidAmount = monthlyPayment * months;
    const remainingDebt = Math.max(0, currentDebt - paidAmount);
    
    return -remainingDebt;
  }
  
  /**
   * Рассчитать количество месяцев между датами
   * Учитывает дни для более точного расчёта
   */
  private calculateMonthsElapsed(startDate: Date, endDate: Date): number {
    const milliseconds = endDate.getTime() - startDate.getTime();
    const days = milliseconds / (1000 * 60 * 60 * 24);
    const months = days / 30.44; // Среднее количество дней в месяце
    
    return Math.max(0, months);
  }
}

// Singleton instance
export const liabilityCalculator = new LiabilityCalculator();
