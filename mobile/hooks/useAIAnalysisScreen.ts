import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import type {
  FinancialHealthScore,
  PriceRecommendationsResponse,
} from "../types";

export function useAIAnalysisScreen() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const healthQuery = useQuery({
    queryKey: ["financial-health"],
    queryFn: () => api.get<FinancialHealthScore>("/api/financial-health"),
  });

  const recQuery = useQuery({
    queryKey: ["ai-price-recommendations"],
    queryFn: () =>
      api.get<PriceRecommendationsResponse>("/api/ai/price-recommendations"),
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const data = await api.post<{ analysis: string }>("/api/ai/analyze", {});
      setAnalysis(data.analysis);
    } catch (error: any) {
      if (error.message?.includes("API key not configured")) {
        setAnalysis(
          "AI Analysis is not available yet.\n\nTo enable AI-powered insights, please add your Anthropic API key in Settings > API Keys."
        );
      } else {
        setAnalysis(`Error: ${error.message}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#3b82f6";
    if (score >= 40) return "#eab308";
    return "#ef4444";
  };

  return {
    analysis,
    isAnalyzing,
    showRecommendations,
    setShowRecommendations,
    healthQuery,
    recQuery,
    handleAnalyze,
    getScoreColor,
  };
}
