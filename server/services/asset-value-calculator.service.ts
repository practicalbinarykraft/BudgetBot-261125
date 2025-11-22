import type { Asset } from '@shared/schemas/assets.schema';

/**
 * Калькулятор стоимости активов
 * 
 * Отвечает за:
 * - Расчёт стоимости актива на конкретную дату
 * - Учёт appreciation rate (рост недвижимости)
 * - Учёт depreciation rate (падение авто, техники)
 * - Прогнозирование будущей стоимости
 */
export class AssetValueCalculator {
  
  /**
   * Рассчитать стоимость актива на конкретную дату
   * 
   * @param asset - Актив (квартира, машина, и т.д.)
   * @param targetDate - Дата на которую считаем стоимость
   * @returns Стоимость в USD
   */
  calculateValueAtDate(asset: Asset, targetDate: Date): number {
    // Если актив создан после целевой даты - стоимость 0
    const createdAt = asset.createdAt ? new Date(asset.createdAt) : new Date();
    if (targetDate < createdAt) {
      return 0;
    }
    
    // Определить базовую стоимость и дату покупки
    const purchaseDate = asset.purchaseDate 
      ? new Date(asset.purchaseDate) 
      : createdAt;
    
    const purchaseValue = asset.purchasePrice 
      ? parseFloat(asset.purchasePrice) 
      : parseFloat(asset.currentValue);
    
    // Если целевая дата до покупки - стоимость 0
    if (targetDate < purchaseDate) {
      return 0;
    }
    
    // Рассчитать сколько времени прошло
    const yearsElapsed = this.calculateYearsElapsed(purchaseDate, targetDate);
    
    // Применить appreciation или depreciation rate
    return this.applyRateChange(purchaseValue, asset, yearsElapsed);
  }
  
  /**
   * Спрогнозировать стоимость через N месяцев
   * 
   * @param asset - Актив
   * @param months - Количество месяцев вперёд
   * @returns Прогнозная стоимость в USD
   */
  projectValue(asset: Asset, months: number): number {
    const currentValue = parseFloat(asset.currentValue);
    const years = months / 12;
    
    return this.applyRateChange(currentValue, asset, years);
  }
  
  /**
   * Применить изменение стоимости (рост или падение)
   * 
   * Формула compound interest:
   * FV = PV × (1 + r)^t
   * 
   * где:
   * FV = будущая стоимость
   * PV = текущая стоимость
   * r = годовая ставка (в долях)
   * t = количество лет
   */
  private applyRateChange(
    baseValue: number, 
    asset: Asset, 
    years: number
  ): number {
    // Если есть appreciation rate (рост)
    if (asset.appreciationRate) {
      const rate = parseFloat(asset.appreciationRate) / 100;
      return baseValue * Math.pow(1 + rate, years);
    }
    
    // Если есть depreciation rate (падение)
    if (asset.depreciationRate) {
      const rate = parseFloat(asset.depreciationRate) / 100;
      const value = baseValue * Math.pow(1 - rate, years);
      // Не может быть меньше 0
      return Math.max(0, value);
    }
    
    // Если нет изменения - возвращаем базовую стоимость
    return baseValue;
  }
  
  /**
   * Рассчитать количество лет между датами
   */
  private calculateYearsElapsed(startDate: Date, endDate: Date): number {
    const milliseconds = endDate.getTime() - startDate.getTime();
    const years = milliseconds / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0, years);
  }
}

// Singleton instance
export const assetValueCalculator = new AssetValueCalculator();
