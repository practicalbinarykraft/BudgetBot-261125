/**
 * Asset Chart Card Component
 *
 * Displays price history chart for assets.
 * ~55 lines - focused on chart visualization.
 */

import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ChartDataPoint {
  date: string;
  value: number;
}

interface AssetChartCardProps {
  chartData: ChartDataPoint[];
  isPositive: boolean;
}

export function AssetChartCard({ chartData, isPositive }: AssetChartCardProps) {
  if (chartData.length <= 1) {
    return null;
  }

  return (
    <Card>
      <div className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Price History</h2>
        <div role="img" aria-label="Asset price history chart">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={isPositive ? "#10b981" : "#ef4444"}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
