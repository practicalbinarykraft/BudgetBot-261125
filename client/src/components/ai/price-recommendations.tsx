import { TrendingDown, Store, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface PriceRecommendation {
  itemName: string;
  normalizedName: string;
  currentMerchant: string;
  currentPrice: number;
  bestPrice: number;
  bestMerchant: string;
  savings: number;
  savingsPercent: number;
}

export interface PriceRecommendationsProps {
  recommendations: PriceRecommendation[];
  totalPotentialSavings: number;
  averageSavingsPercent: number;
  currency?: string;
  aiInsights?: string | null;
  isLoadingInsights?: boolean;
}

export function PriceRecommendations({
  recommendations,
  totalPotentialSavings,
  averageSavingsPercent,
  currency = "IDR",
  aiInsights,
  isLoadingInsights
}: PriceRecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Price Comparisons
          </CardTitle>
          <CardDescription>
            Scan receipts from different merchants to discover price differences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8" data-testid="empty-state-message">
            No price comparisons available yet. Keep scanning receipts!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Savings Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div data-testid="total-savings">
              <p className="text-sm text-muted-foreground">Total Potential Savings</p>
              <p className="text-2xl font-bold">
                {totalPotentialSavings.toFixed(2)} {currency}
              </p>
            </div>
            <div data-testid="avg-savings-percent">
              <p className="text-sm text-muted-foreground">Average Savings</p>
              <p className="text-2xl font-bold">
                {averageSavingsPercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {aiInsights && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">AI Shopping Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line" data-testid="ai-insights">
              {aiInsights}
            </p>
          </CardContent>
        </Card>
      )}

      {isLoadingInsights && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground animate-pulse" data-testid="loading-insights-message">
              Generating AI shopping tips...
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Price Recommendations
          </CardTitle>
          <CardDescription>
            Found {recommendations.length} items with better prices elsewhere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" data-testid="recommendations-list">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover-elevate"
                data-testid={`recommendation-${index}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{rec.itemName}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Store className="w-3 h-3" />
                        <span className="truncate">{rec.currentMerchant}</span>
                      </div>
                      <span className="text-sm">
                        {rec.currentPrice.toFixed(2)} {currency}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge variant="default" data-testid={`savings-${index}`}>
                      Save {rec.savings.toFixed(2)} ({rec.savingsPercent.toFixed(1)}%)
                    </Badge>
                    <div className="text-sm text-muted-foreground text-right">
                      <div className="flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        <span className="truncate">{rec.bestMerchant}</span>
                      </div>
                      <span>
                        {rec.bestPrice.toFixed(2)} {currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
