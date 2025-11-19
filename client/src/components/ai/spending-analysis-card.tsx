import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n/context";

export function SpendingAnalysisCard() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { t } = useTranslation();

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
    <>
      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("analysis.spending_analysis")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAnalyze} disabled={isAnalyzing} data-testid="button-analyze">
            {isAnalyzing ? t("analysis.analyzing") : t("analysis.analyze_my_spending")}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>{t("analysis.ai_insights")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="ai-insights">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">{analysis}</pre>
              <div className="flex gap-2">
                <Badge variant="secondary">{t("analysis.powered_by_claude")}</Badge>
                <Badge variant="outline">{t("analysis.last_updated_now")}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
