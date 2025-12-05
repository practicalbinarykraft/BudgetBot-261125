/**
 * Asset Value Card Component
 *
 * Displays current asset value with change metrics.
 * ~85 lines - focused on value display.
 */

import { TrendingUp, TrendingDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ValueChange {
  changeAmount: number;
  changePercent: number;
  ownershipYears: number;
}

interface AssetValueCardProps {
  currentValue: number;
  change: ValueChange | null;
  onCalibrate: () => void;
}

export function AssetValueCard({ currentValue, change, onCalibrate }: AssetValueCardProps) {
  const isPositive = (change?.changePercent || 0) >= 0;

  return (
    <Card>
      <div className="p-4 md:p-6">
        <p className="text-sm text-muted-foreground mb-2">Current Value</p>
        <p className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-current-value">
          ${currentValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </p>

        {change && change.changePercent !== 0 && (
          <div
            className={`flex flex-wrap items-center gap-2 mb-4 ${
              isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
            data-testid="text-price-change"
          >
            {isPositive ? (
              <TrendingUp className="w-5 h-5" aria-hidden="true" />
            ) : (
              <TrendingDown className="w-5 h-5" aria-hidden="true" />
            )}
            <span className="font-semibold">
              {isPositive ? "+" : ""}{change.changePercent.toFixed(1)}%
              ({isPositive ? "+" : ""}${change.changeAmount.toFixed(0)})
            </span>
            {change.ownershipYears > 0 && (
              <span className="text-muted-foreground">
                over {change.ownershipYears} year{change.ownershipYears !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onCalibrate} data-testid="button-calibrate">
            <Settings className="w-4 h-4 mr-2" aria-hidden="true" />
            Calibrate Price
          </Button>
          <Button variant="outline" disabled title="Coming soon">
            Find Current Price
          </Button>
        </div>
      </div>
    </Card>
  );
}
