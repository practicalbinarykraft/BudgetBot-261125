import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function AIAnalysisPage() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Simulated AI analysis
    setTimeout(() => {
      setAnalysis(`Based on your spending patterns over the last 30 days, here are some insights:

• Your monthly expenses average $2,450, which is 15% higher than last month
• Largest spending category: Food & Dining ($850)
• Recommendation: Consider meal planning to reduce dining out expenses
• You're on track to meet your savings goal for the month
• Alert: Subscription costs have increased by $45 this month`);
      setIsAnalyzing(false);
    }, 2000);
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
            <div className="text-4xl font-bold text-green-600">78/100</div>
            <p className="text-sm text-muted-foreground mt-2">Good financial health</p>
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
