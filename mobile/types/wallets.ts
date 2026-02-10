export interface Wallet {
  id: number;
  userId: number;
  name: string;
  type: "card" | "cash" | "crypto";
  balance: string;
  currency: string;
  balanceUsd: string | null;
  isPrimary: number;
  createdAt: string;
}

export interface Asset {
  id: number;
  userId: number;
  name: string;
  type: "asset" | "liability";
  categoryId: number | null;
  purchasePrice: string | null;
  currentValue: string;
  currency: string;
  lastValuationDate: string | null;
  monthlyIncome: string;
  monthlyExpense: string;
  depreciationRate: string | null;
  appreciationRate: string | null;
  imageUrl: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  category?: {
    id: number;
    name: string;
    icon: string;
    color: string;
  };
}

export interface AssetSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyCashflow: number;
  changePercent: number;
}

export interface AssetValuation {
  id: number;
  assetId: number;
  value: string;
  source: string | null;
  notes: string | null;
  valuationDate: string;
}

export interface CreditsData {
  messagesRemaining: number;
  totalGranted: number;
  totalUsed: number;
  billingMode: "free" | "byok" | "paid";
  hasByok: boolean;
}

export interface PricingTier {
  id: string;
  name: string;
  credits: number | null;
  price: number;
  priceMonthly: number;
  features: string[];
  popular?: boolean;
}

export interface OperationPricing {
  name: string;
  icon: string;
  credits: number;
  description: string;
  example: string;
}

export interface PricingData {
  operations: Record<string, OperationPricing>;
  tiers: PricingTier[];
}
