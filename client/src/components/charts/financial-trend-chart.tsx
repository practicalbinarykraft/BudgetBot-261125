import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from "recharts";
import { useFinancialTrend } from "@/hooks/use-financial-trend";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GoalTimelineMarker } from "@/components/budget/goal-timeline-marker";
import { GoalTimelineTooltip } from "@/components/budget/goal-timeline-tooltip";
import { useLocation } from "wouter";

const COLORS = {
  income: "hsl(142, 76%, 36%)", // Green
  expense: "hsl(0, 84%, 60%)", // Red
  capital: "hsl(221, 83%, 53%)", // Blue
  forecast: "hsl(221, 83%, 53%)", // Blue (dashed)
  grid: "hsl(var(--border))",
  today: "hsl(var(--muted-foreground))",
};

/**
 * Format currency for chart axis (compact)
 */
function formatCompactCurrency(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  
  if (absValue >= 1000000) {
    return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
  }
  if (absValue >= 1000) {
    return `${sign}$${(absValue / 1000).toFixed(1)}k`;
  }
  return `${sign}$${absValue.toFixed(0)}`;
}

/**
 * Format currency for tooltip (full)
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Format date for chart display
 */
function formatChartDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Financial Trend Chart
 * Shows income, expenses, and capital over time with AI forecast + goal markers
 */
export function FinancialTrendChart() {
  const [historyDays, setHistoryDays] = useState(30);
  const [forecastDays, setForecastDays] = useState(365);
  const [hoveredGoal, setHoveredGoal] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useFinancialTrend({
    historyDays,
    forecastDays,
  });

  // Destructure trend data and goals
  const trendData = data?.trendData || [];
  const goals = data?.goals || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>💰 Financial Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px]" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>💰 Financial Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            <p>Failed to load chart data</p>
            <p className="text-sm mt-1">{(error as Error).message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trendData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>💰 Financial Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No data yet</p>
            <p className="text-sm mt-1">Add some transactions to see your financial trend</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find "today" index for vertical line
  const todayIndex = trendData.findIndex(d => d.isToday);
  const todayDate = todayIndex !== -1 ? trendData[todayIndex].date : null;

  // Split data into historical and forecast
  const historicalData = trendData.filter(d => !d.isForecast);
  const forecastData = trendData.filter(d => d.isForecast);

  // For seamless connection, add last historical point to forecast
  const lastHistorical = historicalData[historicalData.length - 1];
  const forecastWithConnection = lastHistorical 
    ? [lastHistorical, ...forecastData]
    : forecastData;

  return (
    <Card data-testid="card-financial-trend">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Financial Trend
            </CardTitle>
            <CardDescription>
              Income, expenses, and capital over time with AI forecast
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">History:</label>
            <Select value={historyDays.toString()} onValueChange={(v) => setHistoryDays(parseInt(v))}>
              <SelectTrigger className="w-32" data-testid="select-history-days">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Forecast:</label>
            <Select value={forecastDays.toString()} onValueChange={(v) => setForecastDays(parseInt(v))}>
              <SelectTrigger className="w-32" data-testid="select-forecast-days">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
              
              <XAxis
                dataKey="date"
                type="category"
                allowDuplicatedCategory={false}
                tickFormatter={formatChartDate}
                stroke="hsl(var(--muted-foreground))"
              />
              
              <YAxis
                tickFormatter={formatCompactCurrency}
                stroke="hsl(var(--muted-foreground))"
              />
              
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelFormatter={formatChartDate}
                formatter={(value: number) => formatCurrency(value)}
              />

              {/* "Today" vertical line */}
              {todayDate && (
                <ReferenceLine
                  x={todayDate}
                  stroke={COLORS.today}
                  strokeDasharray="3 3"
                  label={{ value: "Today", position: "top", fill: COLORS.today }}
                />
              )}

              {/* 🟢 Income Line */}
              <Line
                data={trendData}
                dataKey="income"
                stroke={COLORS.income}
                strokeWidth={2}
                dot={false}
                name="Income"
                connectNulls
              />

              {/* 🔴 Expense Line */}
              <Line
                data={trendData}
                dataKey="expense"
                stroke={COLORS.expense}
                strokeWidth={2}
                dot={false}
                name="Expense"
                connectNulls
              />

              {/* 💙 Capital Line (Historical - Solid) */}
              <Line
                data={historicalData}
                dataKey="capital"
                stroke={COLORS.capital}
                strokeWidth={2}
                dot={false}
                name="Capital"
                connectNulls
              />

              {/* 💙 Capital Line (Forecast - Dashed) */}
              {forecastData.length > 0 && (
                <Line
                  data={forecastWithConnection}
                  dataKey="capital"
                  stroke={COLORS.forecast}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Forecast"
                  connectNulls
                />
              )}

              {/* 🎯 Goal Markers on Timeline */}
              {goals.map((goal) => {
                if (!goal.prediction?.affordableDate) return null;
                
                // Flexible date matching (affordableDate may be YYYY-MM-DD or YYYY-MM)
                const targetDate = goal.prediction.affordableDate;
                const datePoint = trendData.find(d => 
                  d.date === targetDate || d.date.startsWith(targetDate)
                );
                
                if (!datePoint) {
                  console.warn(`Goal "${goal.name}" affordableDate ${targetDate} not found in trend data`);
                  return null;
                }
                
                // Handle null/undefined capital - use last known capital value
                let yValue = datePoint.capital;
                if (yValue == null || yValue === 0) {
                  // Find last non-null capital value from earlier dates
                  const index = trendData.findIndex(d => d.date === datePoint.date);
                  for (let i = index - 1; i >= 0; i--) {
                    if (trendData[i].capital != null && trendData[i].capital !== 0) {
                      yValue = trendData[i].capital;
                      break;
                    }
                  }
                  // If still no value, use 0 as minimum baseline
                  if (yValue == null) yValue = 0;
                }
                
                return (
                  <ReferenceDot
                    key={goal.id}
                    x={datePoint.date}
                    y={yValue}
                    shape={(props) => (
                      <g
                        onMouseEnter={(e: React.MouseEvent) => {
                          setHoveredGoal(goal.id);
                          setTooltipPosition({ 
                            x: e.clientX, 
                            y: e.clientY 
                          });
                        }}
                        onMouseMove={(e: React.MouseEvent) => {
                          setTooltipPosition({ 
                            x: e.clientX, 
                            y: e.clientY 
                          });
                        }}
                        onMouseLeave={() => setHoveredGoal(null)}
                      >
                        <GoalTimelineMarker
                          {...props}
                          priority={goal.priority}
                          onClick={() => setLocation("/wishlist")}
                        />
                      </g>
                    )}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* HTML Tooltip Overlay (Safari compatible) */}
        {hoveredGoal !== null && (
          <>
            {goals.filter(g => g.id === hoveredGoal).map((goal) => (
              <GoalTimelineTooltip 
                key={goal.id}
                goal={goal} 
                position={tooltipPosition}
              />
            ))}
          </>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5" style={{ backgroundColor: COLORS.income }} />
            <span>Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5" style={{ backgroundColor: COLORS.expense }} />
            <span>Expense</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5" style={{ backgroundColor: COLORS.capital }} />
            <span>Capital (Actual)</span>
          </div>
          {forecastData.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 border-t-2 border-dashed" style={{ borderColor: COLORS.forecast }} />
              <span>Capital (Forecast)</span>
            </div>
          )}
          {goals.length > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Goal Markers (click to view wishlist)</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
