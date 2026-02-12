export interface GoalPrediction {
  canAfford: boolean;
  freeCapital: number;
  monthsToAfford: number | null;
  affordableDate: string | null;
}

export interface WishlistItem {
  id: number;
  userId: number;
  name: string;
  amount: string;
  targetDate: string | null;
  priority: string;
  sortOrder: number;
  isPurchased: boolean;
  prediction: GoalPrediction | null;
}

export interface ProductCatalog {
  id: number;
  userId: number;
  name: string;
  category: string | null;
  createdAt: string;
}

export interface PriceHistoryEntry {
  id: number;
  storeName: string;
  price: string;
  purchaseDate: string;
  priceOriginal?: string;
  currencyOriginal?: string;
  exchangeRate?: string;
}

export interface PriceHistoryData {
  product: ProductCatalog;
  priceHistory: PriceHistoryEntry[];
  byStore: Record<string, PriceHistoryEntry[]>;
  statistics: {
    totalPurchases: number;
    averagePrice: string | null;
    bestPrice: string | null;
    bestStore: string | null;
  };
}

export interface AiChatMessage {
  id: number;
  userId: number;
  role: "user" | "assistant";
  content: string;
  source: string;
  contextType: string | null;
  contextData: string | null;
  createdAt: string;
}

export interface ReceiptScanResult {
  success: boolean;
  receipt: {
    merchant: string;
    total: number;
    date?: string;
    items: Array<{
      name: string;
      quantity?: number;
      pricePerUnit?: number;
      totalPrice?: number;
      currency?: string;
      normalizedName?: string;
    }>;
    currency?: string;
  };
  itemsCount: number;
}

export interface VoiceParsedResult {
  transcription: string;
  parsed: {
    amount: string;
    currency: string;
    description: string;
    category?: string;
    type: "income" | "expense";
    confidence: "high" | "medium" | "low";
  };
  creditsUsed: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
