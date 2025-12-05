/**
 * Spending Forecast Card
 *
 * Displays AI-powered spending forecast with trend chart.
 * ~90 lines - focused on forecast visualization.
 */

import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SpendingForecast, CHART_COLORS, getStatusColor } from "./types";

interface ForecastCardProps {
  forecast: SpendingForecast;
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case "increasing":
      return <TrendingUp className="h-4 w-4 text-red-500" aria-hidden="true" />;
    case "decreasing":
      return <TrendingDown className="h-4 w-4 text-green-500" aria-hidden="true" />;
    default:
      return <BarChart3 className="h-4 w-4 text-blue-500" aria-hidden="true" />;
  }
}

function getTrendStatus(trend: string): string {
  if (trend === "increasing") return "too_high";
  if (trend === "decreasing") return "good";
  return "no_budget";
}

function getConfidenceStatus(confidence: string): string {
  if (confidence === "high") return "good";
  if (confidence === "medium") return "no_budget";
  return "too_low";
}

export function ForecastCard({ forecast }: ForecastCardProps) {
  return (
    <Card data-testid="card-forecast">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getTrendIcon(forecast.trend)}
          Spending Forecast
        </CardTitle>
        <CardDescription>
          Predicted spending for next month based on your recent patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stats */}
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Next Month Forecast</div>
              <div className="text-2xl md:text-3xl font-bold">${forecast.forecast.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">3-Month Average</div>
              <div className="text-xl md:text-2xl font-semibold">${forecast.historicalAverage.toFixed(2)}</div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Trend</div>
                <Badge className={getStatusColor(getTrendStatus(forecast.trend))}>
                  {forecast.trend}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Confidence</div>
                <Badge className={getStatusColor(getConfidenceStatus(forecast.confidence))}>
                  {forecast.confidence}
                </Badge>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[200px]" role="img" aria-label="Monthly spending trend chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
