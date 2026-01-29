/**
 * Budget Recommendations Card
 *
 * Displays AI-generated budget adjustment suggestions.
 * ~75 lines - focused on recommendation list display.
 */

import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BudgetRecommendation, getStatusColor } from "./types";
import { useTranslateCategory } from "@/lib/category-translations";

interface RecommendationsCardProps {
  recommendations: BudgetRecommendation[];
}

export function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  const translateCategory = useTranslateCategory();
  
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card data-testid="card-recommendations">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          Budget Recommendations
        </CardTitle>
        <CardDescription>
          Suggested budget adjustments based on your spending patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3" role="list" aria-label="Budget recommendations">
          {recommendations.map((rec, idx) => (
            <li
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{translateCategory(rec.categoryName)}</div>
                <div className="text-sm text-muted-foreground">{rec.message}</div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="text-left sm:text-right">
                  <div className="text-xs sm:text-sm text-muted-foreground">Current</div>
                  <div className="font-mono text-sm">${rec.currentBudget.toFixed(0)}</div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs sm:text-sm text-muted-foreground">Avg Spend</div>
                  <div className="font-mono text-sm">${rec.monthlyAverage.toFixed(0)}</div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs sm:text-sm text-muted-foreground">Recommended</div>
                  <div className="font-mono font-bold text-sm">${rec.recommendedBudget.toFixed(0)}</div>
                </div>
                <Badge className={getStatusColor(rec.status)}>
                  {rec.status.replace("_", " ")}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
