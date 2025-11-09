import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface FinancialHealthScore {
  score: number;
  status: string;
  metrics: {
    budgetAdherence: number;
    cashflowBalance: number;
    expenseStability: number;
  };
}

export default function AIAnalysisPage() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch real financial health score
  const { data: healthScore, isLoading: isLoadingHealth } = useQuery<FinancialHealthScore>({
    queryKey: ["/api/financial-health"],
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }
      
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error: any) {
      // Graceful fallback if API key is missing
      if (error.message.includes("API key not configured")) {
        setAnalysis("⚠️ AI Analysis is not available yet.\n\nTo enable AI-powered insights, please add your Anthropic API key in your Replit profile settings (BYOK - Bring Your Own Key).\n\n1. Visit https://console.anthropic.com/\n2. Create an API key\n3. Add it to your Replit profile settings\n4. Restart the application\n\nOnce configured, you'll get personalized spending insights and recommendations!");
      } else {
        setAnalysis(`Error: ${error.message}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Analysis</h1>
        <p className="text-muted-foreground">Get AI-powered insights about your finances</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Spending Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} data-testid="button-analyze">
              {isAnalyzing ? "Analyzing..." : "Analyze My Spending"}
            </Button>
          </CardContent>
        </Card>

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

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="ai-insights">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">{analysis}</pre>
              <div className="flex gap-2">
                <Badge variant="secondary">Powered by Claude</Badge>
                <Badge variant="outline">Last updated: Just now</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Receipt OCR Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Upload a receipt image to automatically extract transaction details
          </p>
          <Button variant="outline" disabled data-testid="button-scan-receipt">
            Scan Receipt (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
