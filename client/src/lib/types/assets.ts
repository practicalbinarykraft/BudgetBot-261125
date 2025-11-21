/**
 * Assets & Liabilities Types
 * Frontend types for asset management feature
 */

export type AssetType = 'asset' | 'liability';

export interface Asset {
  id: number;
  userId: number;
  name: string;
  type: AssetType;
  categoryId: number | null;
  
  // Purchase information
  purchasePrice: string | null;
  purchasePriceOriginal: string | null;
  purchaseCurrency: string | null;
  purchaseDate: string | null;
  
  // Current valuation (multi-currency)
  currentValue: string;
  currentValueOriginal: string | null;
  currency: string;
  currencyOriginal: string | null;
  exchangeRate: string | null;
  lastValuationDate: string | null;
  
  // Cashflow (monthly income/expense)
  monthlyIncome: string;
  monthlyExpense: string;
  
  // Price change rates (% per year)
  depreciationRate: string | null;
  appreciationRate: string | null;
  
  // Media and details
  imageUrl: string | null;
  location: string | null;
  notes: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetValuation {
  id: number;
  assetId: number;
  value: string;
  valueOriginal: string | null;
  currency: string;
  source: string | null;
  notes: string | null;
  valuationDate: string;
  createdAt: Date;
}

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyCashflow: number;
  changePercent: number;
}

export interface AssetWithCategory extends Asset {
  category?: {
    id: number;
    name: string;
    icon: string;
    color: string;
  };
}
