import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/i18n";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, AlertTriangle, Sparkles, Building2, CreditCard, Info } from "lucide-react";
import { AiForecastWarning } from "@/components/dialogs/ai-forecast-warning";

export interface ForecastFilters {
  includeRecurringIncome: boolean;
  includeRecurringExpense: boolean;
  includePlannedIncome: boolean;
  includePlannedExpenses: boolean;
  includeBudgetLimits: boolean;
  includeAssetIncome: boolean;
  includeLiabilityExpense: boolean;
  includeAssetValue: boolean;
  includeLiabilityValue: boolean;
  capitalMode: 'cash' | 'networth';
}

interface ForecastFiltersProps {
  filters: ForecastFilters;
  onChange: (filters: ForecastFilters) => void;
  useAI?: boolean;
  onUseAIChange?: (useAI: boolean) => void;
  isLoading?: boolean;
}

export function ForecastFiltersCard({ 
  filters, 
  onChange, 
  useAI = false,
  onUseAIChange,
  isLoading = false 
}: ForecastFiltersProps) {
  const { t } = useTranslation();
  const [showAIWarning, setShowAIWarning] = useState(false);
  
  // Ensure all filter values are boolean (prevent uncontrolled->controlled warning)
  const [pendingFilters, setPendingFilters] = useState<ForecastFilters>(() => ({
    includeRecurringIncome: Boolean(filters.includeRecurringIncome),
    includeRecurringExpense: Boolean(filters.includeRecurringExpense),
    includePlannedIncome: Boolean(filters.includePlannedIncome),
    includePlannedExpenses: Boolean(filters.includePlannedExpenses),
    includeBudgetLimits: Boolean(filters.includeBudgetLimits),
    includeAssetIncome: Boolean(filters.includeAssetIncome),
    includeLiabilityExpense: Boolean(filters.includeLiabilityExpense),
    includeAssetValue: Boolean(filters.includeAssetValue),
    includeLiabilityValue: Boolean(filters.includeLiabilityValue),
    capitalMode: filters.capitalMode || 'networth',
  }));

  // Sync pending state when parent filters change (e.g., after Apply or localStorage restore)
  useEffect(() => {
    setPendingFilters({
      includeRecurringIncome: Boolean(filters.includeRecurringIncome),
      includeRecurringExpense: Boolean(filters.includeRecurringExpense),
      includePlannedIncome: Boolean(filters.includePlannedIncome),
      includePlannedExpenses: Boolean(filters.includePlannedExpenses),
      includeBudgetLimits: Boolean(filters.includeBudgetLimits),
      includeAssetIncome: Boolean(filters.includeAssetIncome),
      includeLiabilityExpense: Boolean(filters.includeLiabilityExpense),
      includeAssetValue: Boolean(filters.includeAssetValue),
      includeLiabilityValue: Boolean(filters.includeLiabilityValue),
      capitalMode: filters.capitalMode || 'networth',
    });
  }, [filters]);

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
    {
      id: 'includeAssetIncome',
      label: t('dashboard.filter_asset_income'),
      description: t('dashboard.filter_asset_income_desc'),
      icon: Building2,
      checked: pendingFilters.includeAssetIncome,
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
    {
      id: 'includeLiabilityExpense',
      label: t('dashboard.filter_liability_expense'),
      description: t('dashboard.filter_liability_expense_desc'),
      icon: CreditCard,
      checked: pendingFilters.includeLiabilityExpense,
    },
  ];

  const handlePendingFilterChange = (filterId: keyof ForecastFilters) => {
    setPendingFilters({
      ...pendingFilters,
      [filterId]: !pendingFilters[filterId],
    });
  };

  const handleApply = () => {
    console.log('[ForecastFilters] Apply clicked, pending filters:', pendingFilters);
    onChange(pendingFilters);
  };

  const handleAIToggle = () => {
    if (!useAI) {
      // Turning ON: show warning
      setShowAIWarning(true);
    } else {
      // Turning OFF: no warning needed
      onUseAIChange?.(false);
    }
  };

  const handleConfirmAI = () => {
    onUseAIChange?.(true);
  };

  const renderFilterOption = (option: any) => {
    const Icon = option.icon;
    return (
      <div key={option.id} className="flex items-start gap-2">
        <Checkbox
          id={option.id}
          checked={Boolean(option.checked)}
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
    <>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>{t('dashboard.forecast_filters_title')}</span>
            {onUseAIChange && (
              <Button
                variant={useAI ? "default" : "outline"}
                size="sm"
                onClick={handleAIToggle}
                disabled={isLoading}
                data-testid="button-toggle-ai-forecast"
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {useAI ? t('dashboard.ai_forecast_enabled') : t('dashboard.ai_forecast_disabled')}
              </Button>
            )}
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
          
          {/* Capital Mode Selector */}
          <div className="mt-4 mb-4" data-testid="section-capital-mode">
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4 space-y-3">
                <div className="text-base font-semibold mb-3">
                  {t('dashboard.capital_mode_title')}
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer hover-elevate p-2 rounded-md">
                    <input
                      type="radio"
                      name="capitalMode"
                      value="cash"
                      checked={pendingFilters.capitalMode === 'cash'}
                      onChange={(e) => setPendingFilters({ ...pendingFilters, capitalMode: e.target.value as 'cash' | 'networth' })}
                      className="mt-0.5"
                      data-testid="radio-capital-mode-cash"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        {t('dashboard.capital_mode_cash')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('dashboard.capital_mode_cash_desc')}
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer hover-elevate p-2 rounded-md">
                    <input
                      type="radio"
                      name="capitalMode"
                      value="networth"
                      checked={pendingFilters.capitalMode === 'networth'}
                      onChange={(e) => setPendingFilters({ ...pendingFilters, capitalMode: e.target.value as 'cash' | 'networth' })}
                      className="mt-0.5"
                      data-testid="radio-capital-mode-networth"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {t('dashboard.capital_mode_networth')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('dashboard.capital_mode_networth_desc')}
                      </div>
                    </div>
                  </label>
                </div>
                
                {pendingFilters.capitalMode === 'networth' && (
                  <div className="mt-3 p-2 bg-white dark:bg-gray-900 rounded-md text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <div>
                        {t('dashboard.capital_mode_networth_hint')}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-4 mb-4" data-testid="section-capital-calculation">
            <Card className="bg-muted/30">
              <CardContent className="pt-4 space-y-3">
                <div className="text-base font-semibold mb-3">
                  {t('dashboard.capital_calculation_settings')}
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="includeAssetValue"
                    checked={Boolean(pendingFilters.includeAssetValue)}
                    onCheckedChange={() => handlePendingFilterChange('includeAssetValue')}
                    data-testid="checkbox-includeAssetValue"
                  />
                  <Label
                    htmlFor="includeAssetValue"
                    className="cursor-pointer flex-1 text-sm"
                    data-testid="label-includeAssetValue"
                  >
                    {t('dashboard.filter_include_assets')}
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="includeLiabilityValue"
                    checked={Boolean(pendingFilters.includeLiabilityValue)}
                    onCheckedChange={() => handlePendingFilterChange('includeLiabilityValue')}
                    data-testid="checkbox-includeLiabilityValue"
                  />
                  <Label
                    htmlFor="includeLiabilityValue"
                    className="cursor-pointer flex-1 text-sm"
                    data-testid="label-includeLiabilityValue"
                  >
                    {t('dashboard.filter_subtract_liabilities')}
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Button 
            onClick={handleApply} 
            className="w-full"
            disabled={isLoading}
            data-testid="button-apply-filters"
          >
            {isLoading ? t('common.loading') : t('dashboard.filter_apply_button')}
          </Button>
        </CardContent>
      </Card>

      <AiForecastWarning
        open={showAIWarning}
        onOpenChange={setShowAIWarning}
        onConfirm={handleConfirmAI}
      />
    </>
  );
}
