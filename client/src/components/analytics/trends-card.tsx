/**
 * Spending Trends Card
 *
 * Displays 6-month spending trends with charts and category breakdown.
 * ~130 lines - two sub-sections: trend chart + category pie chart.
 */

import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { SpendingTrends, CHART_COLORS } from "./types";

interface TrendsCardProps {
  trends: SpendingTrends;
}

function InsightBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 bg-muted/50 rounded-lg">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono font-semibold text-sm">{value}</div>
    </div>
  );
}

export function TrendsCard({ trends }: TrendsCardProps) {
  const topCategories = trends.categoryBreakdown.slice(0, 5);

  return (
    <Card data-testid="card-trends">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
          Spending Trends
        </CardTitle>
        <CardDescription>
          6-month spending analysis and category breakdown
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <section aria-labelledby="monthly-trend-title">
            <h3 id="monthly-trend-title" className="font-semibold mb-3">
              Monthly Spending Trend
            </h3>
            <div className="h-[200px] md:h-[250px]" role="img" aria-label="Monthly spending trend line chart">
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

            {/* Insights Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <InsightBox
                label="Average"
                value={`$${trends.insights.averageMonthlySpending.toFixed(0)}`}
              />
              <InsightBox
                label="Volatility"
                value={`${trends.insights.volatility}%`}
              />
              <InsightBox
                label="Highest"
                value={`$${trends.insights.highestMonth.toFixed(0)}`}
              />
              <InsightBox
                label="Lowest"
                value={`$${trends.insights.lowestMonth.toFixed(0)}`}
              />
            </div>
          </section>

          {/* Category Breakdown */}
          <section aria-labelledby="category-breakdown-title">
            <h3 id="category-breakdown-title" className="font-semibold mb-3">
              Top Categories (6 months)
            </h3>
            <div className="h-[200px] md:h-[250px]" role="img" aria-label="Category breakdown pie chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category} ${percentage}%`}
                    outerRadius={80}
                    dataKey="total"
                  >
                    {topCategories.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category List */}
            <ul className="space-y-2 mt-4" role="list" aria-label="Category spending breakdown">
              {topCategories.map((cat, idx) => (
                <li key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{cat.category}</span>
                  </div>
                  <div className="flex gap-3 flex-shrink-0">
                    <span className="font-mono">${cat.total.toFixed(0)}</span>
                    <span className="text-muted-foreground w-10 text-right">{cat.percentage}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
