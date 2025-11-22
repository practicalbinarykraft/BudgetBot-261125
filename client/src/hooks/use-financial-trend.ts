import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { GraphMode, GraphConfig, LiteModeConfig, ProModeConfig } from '@shared/types/graph-mode';
import { DEFAULT_LITE_CONFIG, DEFAULT_PRO_CONFIG } from '@shared/types/graph-mode';

export interface TrendDataPoint {
  date: string;
  income: number;
  expense: number;
  capital: number;
  assetsNet: number;
  isToday: boolean;
  isForecast: boolean;
}

export interface GoalMarker {
  id: number;
  name: string;
  amount: string;
  targetDate: string;
  status: string;
  priority: string;
  prediction: {
    monthsToAfford: number | null;
    affordableDate: string | null;
  } | null;
}

export interface TrendWithGoals {
  trendData: TrendDataPoint[];
  goals: GoalMarker[];
}

interface UseFinancialTrendOptions {
  historyDays?: number;
  forecastDays?: number;
}

/**
 * Hook to fetch financial trend data with LITE/PRO modes
 */
export function useFinancialTrend({
  historyDays = 30,
  forecastDays = 365,
}: UseFinancialTrendOptions = {}) {
  const [graphMode, setGraphMode] = useState<GraphMode>(() => {
    const saved = localStorage.getItem('graphMode');
    return (saved === 'pro' ? 'pro' : 'lite') as GraphMode;
  });

  const [config, setConfig] = useState<GraphConfig>(() => {
    if (graphMode === 'lite') {
      return DEFAULT_LITE_CONFIG;
    }
    return DEFAULT_PRO_CONFIG;
  });

  const toggleMode = () => {
    const newMode = graphMode === 'lite' ? 'pro' : 'lite';
    setGraphMode(newMode);
    localStorage.setItem('graphMode', newMode);
    
    if (newMode === 'lite') {
      setConfig(DEFAULT_LITE_CONFIG);
    } else {
      setConfig(DEFAULT_PRO_CONFIG);
    }
  };

  const updateFilter = (key: string, value: any) => {
    if (config.mode === 'lite') {
      if (key === 'capitalMode' || key === 'forecastType') {
        setConfig({ ...config, [key]: value });
      }
    } else {
      setConfig({ ...config, [key]: value });
    }
  };

  const buildQueryParams = (cfg: GraphConfig) => {
    const params: Record<string, string> = {
      historyDays: historyDays.toString(),
      forecastDays: forecastDays.toString(),
      capitalMode: cfg.capitalMode,
    };

    if (cfg.mode === 'lite') {
      params.useAI = (cfg.forecastType === 'ai').toString();
      params.includeRecurringIncome = 'true';
      params.includeRecurringExpense = 'true';
      params.includePlannedIncome = 'true';
      params.includePlannedExpenses = 'true';
      params.includeBudgetLimits = 'true';
      params.includeAssetIncome = 'true';
      params.includeLiabilityExpense = 'true';
      params.includeAssetValue = 'true';
      params.includeLiabilityValue = 'true';
    } else {
      params.useAI = (cfg.forecastType === 'ai').toString();
      params.includeRecurringIncome = cfg.includeRecurringIncome.toString();
      params.includeRecurringExpense = cfg.includeRecurringExpense.toString();
      params.includePlannedIncome = 'true';
      params.includePlannedExpenses = cfg.includePlannedExpense.toString();
      params.includeBudgetLimits = cfg.includeBudgetLimits.toString();
      params.includeAssetIncome = cfg.includeAssetIncome.toString();
      params.includeLiabilityExpense = cfg.includeLiabilityExpense.toString();
      params.includeAssetValue = cfg.includeAssetValueChange.toString();
      params.includeLiabilityValue = cfg.includeAssetValueChange.toString();
    }

    return params;
  };

  const queryKey = ['/api/analytics/trend', graphMode, config];

  const query = useQuery<TrendWithGoals>({
    queryKey,
    queryFn: async () => {
      const params = buildQueryParams(config);
      const searchParams = new URLSearchParams(params);
      
      const res = await fetch(`/api/analytics/trend?${searchParams}`, {
        cache: 'no-store',
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch trend data");
      }
      
      return res.json();
    },
    placeholderData: (prev) => prev,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return {
    ...query,
    graphMode,
    toggleMode,
    config,
    updateFilter,
  };
}
