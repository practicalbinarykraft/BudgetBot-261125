import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/i18n";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, AlertTriangle } from "lucide-react";

export interface ForecastFilters {
  includeRecurringIncome: boolean;
  includeRecurringExpense: boolean;
  includePlannedIncome: boolean;
  includePlannedExpenses: boolean;
  includeBudgetLimits: boolean;
}

interface ForecastFiltersProps {
  filters: ForecastFilters;
  onChange: (filters: ForecastFilters) => void;
}

export function ForecastFiltersCard({ filters, onChange }: ForecastFiltersProps) {
  const { t } = useTranslation();
  const [pendingFilters, setPendingFilters] = useState<ForecastFilters>(filters);

  const incomeFilters = [
    {
      id: 'includeRecurringIncome',
      label: t('dashboard.filter_recurring_income'),
      description: t('dashboard.filter_recurring_income_desc'),
      icon: TrendingUp,
      checked: pendingFilters.includeRecurringIncome,
    },
    {
      id: 'includePlannedIncome',
      label: t('dashboard.filter_planned_income'),
      description: t('dashboard.filter_planned_income_desc'),
      icon: DollarSign,
      checked: pendingFilters.includePlannedIncome,
    },
  ];

  const expenseFilters = [
    {
      id: 'includeRecurringExpense',
      label: t('dashboard.filter_recurring_expense'),
      description: t('dashboard.filter_recurring_expense_desc'),
      icon: TrendingDown,
      checked: pendingFilters.includeRecurringExpense,
    },
    {
      id: 'includePlannedExpenses',
      label: t('dashboard.filter_planned_expenses'),
      description: t('dashboard.filter_planned_expenses_desc'),
      icon: ShoppingCart,
      checked: pendingFilters.includePlannedExpenses,
    },
    {
      id: 'includeBudgetLimits',
      label: t('dashboard.filter_budget_limits'),
      description: t('dashboard.filter_budget_limits_desc'),
      icon: AlertTriangle,
      checked: pendingFilters.includeBudgetLimits,
    },
  ];

  const handlePendingFilterChange = (filterId: keyof ForecastFilters) => {
    setPendingFilters({
      ...pendingFilters,
      [filterId]: !pendingFilters[filterId],
    });
  };

  const handleApply = () => {
    onChange(pendingFilters);
  };

  const renderFilterOption = (option: any) => {
    const Icon = option.icon;
    return (
      <div key={option.id} className="flex items-start gap-2">
        <Checkbox
          id={option.id}
          checked={option.checked}
          onCheckedChange={() => handlePendingFilterChange(option.id as keyof ForecastFilters)}
          data-testid={`checkbox-${option.id}`}
        />
        <div className="flex items-center gap-2 flex-1">
          <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Label
            htmlFor={option.id}
            className="cursor-pointer flex-1"
            data-testid={`label-${option.id}`}
          >
            <div className="text-sm font-medium">{option.label}</div>
            <div className="text-xs text-muted-foreground">
              {option.description}
            </div>
          </Label>
        </div>
      </div>
    );
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          {t('dashboard.forecast_filters_title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-3">
            {incomeFilters.map(renderFilterOption)}
          </div>
          <div className="space-y-3">
            {expenseFilters.map(renderFilterOption)}
          </div>
        </div>
        <Button 
          onClick={handleApply} 
          className="w-full"
          data-testid="button-apply-filters"
        >
          {t('dashboard.filter_apply_button')}
        </Button>
      </CardContent>
    </Card>
  );
}
