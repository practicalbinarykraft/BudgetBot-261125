/**
 * Financial Health Score Card
 *
 * Displays overall financial health score with breakdown.
 * ~80 lines - focused on health metrics visualization.
 */

import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FinancialHealthScore, getRatingColor, getStatusColor } from "./types";

interface HealthScoreCardProps {
  healthScore: FinancialHealthScore;
}

export function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  return (
    <Card data-testid="card-health-score">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" aria-hidden="true" />
          Financial Health Score
        </CardTitle>
        <CardDescription>
          Overall assessment of your financial wellness this month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
          {/* Score Circle */}
          <div className="flex flex-col items-center">
            <div className={`text-5xl md:text-6xl font-bold ${getRatingColor(healthScore.rating)}`}>
              {healthScore.score}
            </div>
            <div className="text-sm text-muted-foreground mt-1">out of 100</div>
            <Badge className={`mt-2 ${getStatusColor(healthScore.rating)}`}>
              {healthScore.rating.toUpperCase()}
            </Badge>
          </div>

          {/* Breakdown */}
          <div className="flex-1 space-y-3 w-full">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Budget Adherence (40%)</span>
              <span className="text-sm font-mono">{healthScore.breakdown.budgetAdherence}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Savings Rate (30%)</span>
              <span className="text-sm font-mono">{healthScore.breakdown.savingsRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Spending Ratio (30%)</span>
              <span className="text-sm font-mono">{healthScore.breakdown.spendingRatio}%</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex-1 space-y-3 w-full">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Monthly Income</span>
              <span className="text-sm font-mono text-green-600 dark:text-green-400">
                ${healthScore.metrics.monthlyIncome.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Monthly Expense</span>
              <span className="text-sm font-mono text-red-600 dark:text-red-400">
                ${healthScore.metrics.monthlyExpense.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Monthly Savings</span>
              <span
                className={`text-sm font-mono ${
                  healthScore.metrics.monthlySavings >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                ${healthScore.metrics.monthlySavings.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
