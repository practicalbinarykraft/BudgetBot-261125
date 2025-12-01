import { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Target, BarChart3 } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/i18n';

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface SpendingForecast {
  forecast: number;
  confidence: 'low' | 'medium' | 'high';
  trend: 'increasing' | 'decreasing' | 'stable';
  historicalAverage: number;
  monthlyData: Array<{
    month: string;
    amount: number;
  }>;
}

interface BudgetRecommendation {
  categoryId: number | null;
  categoryName: string;
  monthlyAverage: number;
  currentBudget: number;
  recommendedBudget: number;
  status: 'good' | 'too_low' | 'too_high' | 'no_budget';
  message: string;
}

interface SpendingTrends {
  monthlyTrend: Array<{
    month: string;
    total: number;
    transactions: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    total: number;
    percentage: number;
  }>;
  insights: {
    averageMonthlySpending: number;
    highestMonth: number;
    lowestMonth: number;
    volatility: number;
  };
}

interface FinancialHealthScore {
  score: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  breakdown: {
    budgetAdherence: number;
    savingsRate: number;
    spendingRatio: number;
  };
  metrics: {
    monthlyIncome: number;
    monthlyExpense: number;
    monthlySavings: number;
  };
}

export default function AdvancedAnalyticsPage() {
  const { t } = useTranslation();

  // Fetch data from all endpoints
  const { data: forecast, isLoading: forecastLoading } = useQuery<SpendingForecast>({
    queryKey: ['/api/analytics/advanced/forecast'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/analytics/advanced/forecast');
      return res.json();
    },
  });

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery<BudgetRecommendation[]>({
    queryKey: ['/api/analytics/advanced/recommendations'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/analytics/advanced/recommendations');
      return res.json();
    },
  });

  const { data: trends, isLoading: trendsLoading } = useQuery<SpendingTrends>({
    queryKey: ['/api/analytics/advanced/trends'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/analytics/advanced/trends');
      return res.json();
    },
  });

  const { data: healthScore, isLoading: healthScoreLoading } = useQuery<FinancialHealthScore>({
    queryKey: ['/api/analytics/advanced/health-score'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/analytics/advanced/health-score');
      return res.json();
    },
  });

  const isLoading = forecastLoading || recommendationsLoading || trendsLoading || healthScoreLoading;

  // Rating colors
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'good': return 'text-blue-600 dark:text-blue-400';
      case 'fair': return 'text-yellow-600 dark:text-yellow-400';
      case 'poor': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'too_low': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'too_high': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'no_budget': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <BarChart3 className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/app/dashboard">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground">
            AI-powered insights, forecasts, and recommendations
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <>
          {/* Financial Health Score */}
          {healthScore && (
            <Card data-testid="card-health-score">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Financial Health Score
                </CardTitle>
                <CardDescription>
                  Overall assessment of your financial wellness this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  {/* Score Circle */}
                  <div className="flex flex-col items-center">
                    <div className={`text-6xl font-bold ${getRatingColor(healthScore.rating)}`}>
                      {healthScore.score}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">out of 100</div>
                    <Badge className={`mt-2 ${getStatusColor(healthScore.rating)}`}>
                      {healthScore.rating.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Breakdown */}
                  <div className="flex-1 space-y-3">
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
                  <div className="flex-1 space-y-3">
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
                      <span className={`text-sm font-mono ${
                        healthScore.metrics.monthlySavings >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        ${healthScore.metrics.monthlySavings.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Spending Forecast */}
          {forecast && (
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
                <div className="grid grid-cols-2 gap-6">
                  {/* Stats */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Next Month Forecast</div>
                      <div className="text-3xl font-bold">${forecast.forecast.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">3-Month Average</div>
                      <div className="text-2xl font-semibold">${forecast.historicalAverage.toFixed(2)}</div>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Trend</div>
                        <Badge className={getStatusColor(
                          forecast.trend === 'increasing' ? 'too_high' :
                          forecast.trend === 'decreasing' ? 'good' : 'no_budget'
                        )}>
                          {forecast.trend}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Confidence</div>
                        <Badge className={getStatusColor(
                          forecast.confidence === 'high' ? 'good' :
                          forecast.confidence === 'medium' ? 'no_budget' : 'too_low'
                        )}>
                          {forecast.confidence}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="h-[200px]">
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
          )}

          {/* Budget Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <Card data-testid="card-recommendations">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Budget Recommendations
                </CardTitle>
                <CardDescription>
                  Suggested budget adjustments based on your spending patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{rec.categoryName}</div>
                        <div className="text-sm text-muted-foreground">{rec.message}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Current</div>
                          <div className="font-mono">${rec.currentBudget.toFixed(0)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Avg Spend</div>
                          <div className="font-mono">${rec.monthlyAverage.toFixed(0)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Recommended</div>
                          <div className="font-mono font-bold">${rec.recommendedBudget.toFixed(0)}</div>
                        </div>
                        <Badge className={getStatusColor(rec.status)}>
                          {rec.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Spending Trends */}
          {trends && (
            <Card data-testid="card-trends">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Spending Trends
                </CardTitle>
                <CardDescription>
                  6-month spending analysis and category breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* Monthly Trend Chart */}
                  <div>
                    <h3 className="font-semibold mb-3">Monthly Spending Trend</h3>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trends.monthlyTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke={CHART_COLORS[1]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Insights */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <div className="text-xs text-muted-foreground">Average</div>
                        <div className="font-mono font-semibold">${trends.insights.averageMonthlySpending.toFixed(0)}</div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <div className="text-xs text-muted-foreground">Volatility</div>
                        <div className="font-mono font-semibold">{trends.insights.volatility}%</div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <div className="text-xs text-muted-foreground">Highest</div>
                        <div className="font-mono font-semibold">${trends.insights.highestMonth.toFixed(0)}</div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <div className="text-xs text-muted-foreground">Lowest</div>
                        <div className="font-mono font-semibold">${trends.insights.lowestMonth.toFixed(0)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div>
                    <h3 className="font-semibold mb-3">Top Categories (6 months)</h3>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={trends.categoryBreakdown.slice(0, 5)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ category, percentage }) => `${category} ${percentage}%`}
                            outerRadius={80}
                            dataKey="total"
                          >
                            {trends.categoryBreakdown.slice(0, 5).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Category List */}
                    <div className="space-y-2 mt-4">
                      {trends.categoryBreakdown.slice(0, 5).map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                            />
                            <span>{cat.category}</span>
                          </div>
                          <div className="flex gap-3">
                            <span className="font-mono">${cat.total.toFixed(0)}</span>
                            <span className="text-muted-foreground">{cat.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
