import { assetsRepository } from '../repositories/assets.repository';
import type { Asset } from '@shared/schema';

/**
 * Net Worth Summary Interface
 * Summary of user's total assets, liabilities, and cashflow
 */
interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyCashflow: number;
  changePercent: number;
}

/**
 * Net Worth Service
 * Calculates total net worth, cashflow, and asset projections
 */
export class NetWorthService {
  
  // Рассчитать чистый капитал пользователя
  async calculateNetWorth(userId: number): Promise<NetWorthSummary> {
    // Получить все активы и пассивы
    const allAssets = await assetsRepository.findByUserId(userId);
    
    const assetsOnly = allAssets.filter(item => item.asset.type === 'asset');
    const liabilities = allAssets.filter(item => item.asset.type === 'liability');
    
    // Рассчитать суммы (в USD)
    const totalAssets = this.sumCurrentValue(assetsOnly.map(i => i.asset));
    const totalLiabilities = this.sumCurrentValue(liabilities.map(i => i.asset));
    const netWorth = totalAssets - totalLiabilities;
    
    // Рассчитать cashflow
    const allAssetsFlat = allAssets.map(i => i.asset);
    const monthlyIncome = this.sumMonthlyIncome(allAssetsFlat);
    const monthlyExpense = this.sumMonthlyExpense(allAssetsFlat);
    const monthlyCashflow = monthlyIncome - monthlyExpense;
    
    // Рассчитать изменение (годовое: cashflow * 12 / netWorth)
    const changePercent = netWorth > 0 
      ? (monthlyCashflow / netWorth) * 100 * 12
      : 0;
    
    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      monthlyIncome,
      monthlyExpense,
      monthlyCashflow,
      changePercent
    };
  }
  
  // Суммировать текущую стоимость активов
  private sumCurrentValue(assets: Asset[]): number {
    return assets.reduce((sum, asset) => {
      return sum + parseFloat(asset.currentValue);
    }, 0);
  }
  
  // Суммировать ежемесячный доход от активов
  private sumMonthlyIncome(assets: Asset[]): number {
    return assets.reduce((sum, asset) => {
      return sum + parseFloat(asset.monthlyIncome || '0');
    }, 0);
  }
  
  // Суммировать ежемесячные расходы на активы
  private sumMonthlyExpense(assets: Asset[]): number {
    return assets.reduce((sum, asset) => {
      return sum + parseFloat(asset.monthlyExpense || '0');
    }, 0);
  }
  
  // Рассчитать изменение стоимости актива за время владения
  calculateAssetChange(asset: Asset): {
    changeAmount: number;
    changePercent: number;
    ownershipYears: number;
  } {
    if (!asset.purchasePrice || !asset.purchaseDate) {
      return { 
        changeAmount: 0, 
        changePercent: 0,
        ownershipYears: 0
      };
    }
    
    const currentValue = parseFloat(asset.currentValue);
    const purchasePrice = parseFloat(asset.purchasePrice);
    
    const changeAmount = currentValue - purchasePrice;
    const changePercent = (changeAmount / purchasePrice) * 100;
    
    const ownershipYears = this.calculateOwnershipYears(asset);
    
    return {
      changeAmount,
      changePercent,
      ownershipYears
    };
  }
  
  // Рассчитать время владения активом
  private calculateOwnershipYears(asset: Asset): number {
    if (!asset.purchaseDate) return 0;
    
    const purchaseDate = new Date(asset.purchaseDate);
    const now = new Date();
    
    const years = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    return Math.max(0, years);
  }
  
  // Рассчитать прогноз стоимости актива на N месяцев вперёд
  projectAssetValue(asset: Asset, months: number): number {
    const currentValue = parseFloat(asset.currentValue);
    
    // Если есть appreciation rate (растёт в цене)
    if (asset.appreciationRate) {
      const annualRate = parseFloat(asset.appreciationRate) / 100;
      const monthlyRate = annualRate / 12;
      return currentValue * Math.pow(1 + monthlyRate, months);
    }
    
    // Если есть depreciation rate (падает в цене)
    if (asset.depreciationRate) {
      const annualRate = parseFloat(asset.depreciationRate) / 100;
      const monthlyRate = annualRate / 12;
      return currentValue * Math.pow(1 - monthlyRate, months);
    }
    
    // Если нет изменения - текущая стоимость
    return currentValue;
  }
}

export const netWorthService = new NetWorthService();
