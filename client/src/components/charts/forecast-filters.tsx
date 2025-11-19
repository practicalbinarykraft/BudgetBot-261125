import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/i18n";
import { Repeat, DollarSign, ShoppingCart, AlertTriangle } from "lucide-react";

export interface ForecastFilters {
  includeRecurring: boolean;
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

  const filterOptions = [
    {
      id: 'includeRecurring',
      label: t('dashboard.filter_recurring'),
      description: t('dashboard.filter_recurring_desc'),
      icon: Repeat,
      checked: filters.includeRecurring,
    },
    {
      id: 'includePlannedIncome',
      label: t('dashboard.filter_planned_income'),
      description: t('dashboard.filter_planned_income_desc'),
      icon: DollarSign,
      checked: filters.includePlannedIncome,
    },
    {
      id: 'includePlannedExpenses',
      label: t('dashboard.filter_planned_expenses'),
      description: t('dashboard.filter_planned_expenses_desc'),
      icon: ShoppingCart,
      checked: filters.includePlannedExpenses,
    },
    {
      id: 'includeBudgetLimits',
      label: t('dashboard.filter_budget_limits'),
      description: t('dashboard.filter_budget_limits_desc'),
      icon: AlertTriangle,
      checked: filters.includeBudgetLimits,
    },
  ];

  const handleFilterChange = (filterId: keyof ForecastFilters) => {
    onChange({
      ...filters,
      [filterId]: !filters[filterId],
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          {t('dashboard.forecast_filters_title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filterOptions.map((option) => {
            const Icon = option.icon;
            return (
              <div key={option.id} className="flex items-start gap-3">
                <Checkbox
                  id={option.id}
                  checked={option.checked}
                  onCheckedChange={() => handleFilterChange(option.id as keyof ForecastFilters)}
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
          })}
        </div>
      </CardContent>
    </Card>
  );
}
