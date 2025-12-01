/**
 * Currency History Page
 *
 * Displays historical exchange rates with trends and charts
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RateHistoryEntry {
  id: number;
  currencyCode: string;
  rate: string;
  source: string;
  createdAt: string;
}

interface RateHistory {
  history: Record<string, RateHistoryEntry[]>;
  count: number;
}

export default function CurrencyHistoryPage() {
  // Fetch rate history for last 30 days
  const { data, isLoading, error } = useQuery<RateHistory>({
    queryKey: ["/api/exchange-rates/history", { days: 30 }],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Currency Exchange Rates History</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Failed to load currency history</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currencies = Object.keys(data?.history || {}).sort();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Currency Exchange Rates History</h1>
        <p className="text-muted-foreground">
          Historical rates for the last 30 days (1 USD = X currency)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currencies.map((currencyCode) => {
          const history = data?.history[currencyCode] || [];

          if (history.length === 0) return null;

          // Calculate trend
          const latestRate = parseFloat(history[0]?.rate || "0");
          const oldestRate = parseFloat(history[history.length - 1]?.rate || "0");
          const change = latestRate - oldestRate;
          const changePercent = oldestRate ? ((change / oldestRate) * 100) : 0;

          const isUp = change > 0;
          const isDown = change < 0;
          const isFlat = Math.abs(changePercent) < 0.1;

          return (
            <Card key={currencyCode}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{currencyCode}</span>
                  {!isFlat && (
                    <span className={`flex items-center gap-1 text-sm ${
                      isUp ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {Math.abs(changePercent).toFixed(2)}%
                    </span>
                  )}
                  {isFlat && (
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Minus className="h-4 w-4" />
                      Stable
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Rate</p>
                    <p className="text-2xl font-bold">
                      {parseFloat(history[0]?.rate || "0").toFixed(4)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">30d ago</p>
                      <p className="font-medium">
                        {parseFloat(history[history.length - 1]?.rate || "0").toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Change</p>
                      <p className={`font-medium ${
                        isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Last updated: {new Date(history[0]?.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Source: {history[0]?.source === 'api' ? 'Live API' : 'Fallback'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {currencies.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No historical data available yet. Data will be collected daily.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
