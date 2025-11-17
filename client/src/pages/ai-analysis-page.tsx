import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PriceRecommendations } from "@/components/ai/price-recommendations";
import { ReceiptScanner } from "@/components/ai/receipt-scanner";
import { SpendingAnalysisCard } from "@/components/ai/spending-analysis-card";

interface FinancialHealthScore {
  score: number;
  status: string;
  metrics: {
    budgetAdherence: number;
    cashflowBalance: number;
    expenseStability: number;
  };
}

interface PriceRecommendationsResponse {
  recommendations: Array<{
    itemName: string;
    normalizedName: string;
    currentMerchant: string;
    currentPrice: number;
    bestPrice: number;
    bestMerchant: string;
    savings: number;
    savingsPercent: number;
  }>;
  totalPotentialSavings: number;
  averageSavingsPercent: number;
  aiInsights?: string | null;
}

export default function AIAnalysisPage() {
  const { data: healthScore, isLoading: isLoadingHealth } = useQuery<FinancialHealthScore>({
    queryKey: ["/api/financial-health"],
  });

  const { data: priceRecommendations, isLoading: isLoadingRecommendations } = useQuery<PriceRecommendationsResponse>({
    queryKey: ["/api/ai/price-recommendations"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Analysis</h1>
        <p className="text-muted-foreground">Get AI-powered insights about your finances</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SpendingAnalysisCard />

        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Financial Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHealth ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-32" data-testid="skeleton-health-score" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : healthScore ? (
              <>
                <div 
                  className={`text-4xl font-bold ${
                    healthScore.score >= 80 ? 'text-green-600' :
                    healthScore.score >= 60 ? 'text-blue-600' :
                    healthScore.score >= 40 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}
                  data-testid="text-health-score"
                >
                  {healthScore.score}/100
                </div>
                <p className="text-sm text-muted-foreground mt-2" data-testid="text-health-status">
                  {healthScore.status}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                No data available yet. Add some transactions to see your score.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ReceiptScanner />

      <Accordion type="single" collapsible className="w-full" data-testid="accordion-price-recommendations">
        <AccordionItem value="price-recommendations">
          <AccordionTrigger data-testid="accordion-trigger-price-recommendations">
            Price Recommendations
          </AccordionTrigger>
          <AccordionContent>
            {isLoadingRecommendations ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" data-testid="skeleton-price-recommendations" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : priceRecommendations ? (
              <PriceRecommendations
                recommendations={priceRecommendations.recommendations || []}
                totalPotentialSavings={priceRecommendations.totalPotentialSavings || 0}
                averageSavingsPercent={priceRecommendations.averageSavingsPercent || 0}
                currency="IDR"
                aiInsights={priceRecommendations.aiInsights}
              />
            ) : (
              <p className="text-sm text-muted-foreground" data-testid="empty-price-recommendations">
                No price data available yet. Scan more receipts to discover savings!
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
