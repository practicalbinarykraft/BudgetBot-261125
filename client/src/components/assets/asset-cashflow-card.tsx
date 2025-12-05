/**
 * Asset Cashflow Card Component
 *
 * Displays monthly income/expense and net cashflow.
 * ~75 lines - focused on cashflow metrics.
 */

import { Card } from "@/components/ui/card";

interface AssetCashflowCardProps {
  monthlyIncome: number;
  monthlyExpense: number;
  ownershipYears?: number;
}

export function AssetCashflowCard({
  monthlyIncome,
  monthlyExpense,
  ownershipYears,
}: AssetCashflowCardProps) {
  const monthlyCashflow = monthlyIncome - monthlyExpense;
  const hasIncome = monthlyIncome > 0;
  const hasExpense = monthlyExpense > 0;

  if (!hasIncome && !hasExpense) {
    return null;
  }

  return (
    <Card>
      <div className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Cash Flow</h2>

        <dl className="space-y-3">
          {hasIncome && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Monthly Income:</dt>
              <dd className="font-semibold text-green-600 dark:text-green-400">
                +${monthlyIncome.toFixed(0)}
              </dd>
            </div>
          )}

          {hasExpense && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Monthly Expense:</dt>
              <dd className="font-semibold text-red-600 dark:text-red-400">
                -${monthlyExpense.toFixed(0)}
              </dd>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t">
            <dt className="font-semibold">Net Cashflow:</dt>
            <dd
              className={`font-bold text-lg ${
                monthlyCashflow >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
              data-testid="text-net-cashflow"
            >
              {monthlyCashflow >= 0 ? "+" : ""}${monthlyCashflow.toFixed(0)}/mo
            </dd>
          </div>

          {ownershipYears && ownershipYears > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
              <dt>Total cashflow received:</dt>
              <dd>${(monthlyCashflow * 12 * ownershipYears).toFixed(0)}</dd>
            </div>
          )}
        </dl>
      </div>
    </Card>
  );
}
