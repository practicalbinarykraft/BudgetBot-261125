import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import type { GraphMode, GraphConfig } from '@shared/types/graph-mode';
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
 *
 * Uses two config states:
 * - pendingConfig: local changes (not yet applied)
 * - appliedConfig: config used for API request
 *
 * This prevents multiple API calls when user changes several settings.
 * User must click "Apply" button to trigger API request.
 */
export function useFinancialTrend({
  historyDays = 30,
  forecastDays = 365,
}: UseFinancialTrendOptions = {}) {
  // Graph mode (lite/pro)
  const [graphMode, setGraphMode] = useState<GraphMode>(() => {
    const saved = localStorage.getItem('graphMode');
    return (saved === 'pro' ? 'pro' : 'lite') as GraphMode;
  });

  // Applied config - used for API request
  const [appliedConfig, setAppliedConfig] = useState<GraphConfig>(() => {
    if (graphMode === 'lite') {
      return DEFAULT_LITE_CONFIG;
    }
    return DEFAULT_PRO_CONFIG;
  });

  // Pending config - local changes not yet applied
  const [pendingConfig, setPendingConfig] = useState<GraphConfig>(() => {
    if (graphMode === 'lite') {
      return DEFAULT_LITE_CONFIG;
    }
    return DEFAULT_PRO_CONFIG;
  });

  // Check if there are unapplied changes
  const hasUnappliedChanges = useMemo(() => {
    return JSON.stringify(pendingConfig) !== JSON.stringify(appliedConfig);
  }, [pendingConfig, appliedConfig]);

  // Toggle between lite and pro modes
  const toggleMode = useCallback(() => {
    const newMode = graphMode === 'lite' ? 'pro' : 'lite';
    setGraphMode(newMode);
    localStorage.setItem('graphMode', newMode);

    const newConfig = newMode === 'lite' ? DEFAULT_LITE_CONFIG : DEFAULT_PRO_CONFIG;
    setPendingConfig(newConfig);
    setAppliedConfig(newConfig); // Apply immediately when switching modes
  }, [graphMode]);

  // Update a filter in pending config (doesn't trigger API call)
  const updateFilter = useCallback((key: string, value: any) => {
    setPendingConfig(prev => {
      if (prev.mode === 'lite') {
        if (key === 'capitalMode' || key === 'forecastType') {
          return { ...prev, [key]: value };
        }
        return prev;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  // Apply pending changes - triggers API refetch
  const applyChanges = useCallback(() => {
    setAppliedConfig(pendingConfig);
  }, [pendingConfig]);

  // Reset pending changes to applied config
  const resetChanges = useCallback(() => {
    setPendingConfig(appliedConfig);
  }, [appliedConfig]);

  // Build query params from config
  const buildQueryParams = useCallback((cfg: GraphConfig) => {
    const params: Record<string, string> = {
      historyDays: historyDays.toString(),
      forecastDays: forecastDays.toString(),
      capitalMode: cfg.capitalMode,
      graphMode: cfg.mode,
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
  }, [historyDays, forecastDays]);

  // Query key uses APPLIED config (not pending)
  const queryKey = ['/api/analytics/trend', historyDays, forecastDays, graphMode, appliedConfig];

  const query = useQuery<TrendWithGoals>({
    queryKey,
    queryFn: async () => {
      const params = buildQueryParams(appliedConfig);
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
    config: pendingConfig, // UI shows pending config
    appliedConfig, // For comparison if needed
    updateFilter,
    applyChanges,
    resetChanges,
    hasUnappliedChanges,
  };
}
