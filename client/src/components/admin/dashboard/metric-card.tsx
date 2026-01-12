/**
 * Metric Card Component
 *
 * Reusable card for displaying metrics with trend
 * Junior-Friendly: Simple props, clear structure
 */

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/i18n/context";

interface MetricCardProps {
  title: string;
  value: string | number;
  format?: 'currency' | 'number' | 'percentage';
  change?: number; // % change
  trend?: number[]; // Array of values for sparkline
  description?: string;
  className?: string;
  helpKey?: string; // i18n key for help tooltip (e.g., 'admin.dashboard.mrr.help')
}

export function MetricCard({
  title,
  value,
  format = 'number',
  change,
  trend,
  description,
  className,
  helpKey,
}: MetricCardProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
      default:
        return val.toLocaleString('en-US');
    }
  };

  const hasPositiveChange = change !== undefined && change > 0;
  const hasNegativeChange = change !== undefined && change < 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          {helpKey && (
            <TooltipProvider delayDuration={200}>
              <Tooltip open={isOpen} onOpenChange={setIsOpen}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleClick}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={t('admin.common.help')}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-semibold">{t(`${helpKey}.title`)}</p>
                    <p className="text-xs">{t(`${helpKey}.description`)}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">{t('admin.common.calculation')}: </span>
                      {t(`${helpKey}.calculation`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">{t('admin.common.purpose')}: </span>
                      {t(`${helpKey}.purpose`)}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatValue(value)}
        </div>
        
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {hasPositiveChange ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : hasNegativeChange ? (
              <TrendingDown className="h-3 w-3 text-red-600" />
            ) : null}
            <p className={cn(
              "text-xs",
              hasPositiveChange && "text-green-600",
              hasNegativeChange && "text-red-600",
              change === 0 && "text-gray-500"
            )}>
              {hasPositiveChange ? '+' : ''}{change}% from last month
            </p>
          </div>
        )}

        {description && (
          <p className="text-xs text-gray-500 mt-1">
            {description}
          </p>
        )}

        {/* Sparkline chart for trend data */}
        {trend && trend.length > 0 && (
          <div className="mt-3 h-10 flex items-end gap-0.5">
            {trend.map((val, i) => {
              const max = Math.max(...trend);
              const min = Math.min(...trend);
              const height = max > min ? ((val - min) / (max - min)) * 100 : 50;
              return (
                <div
                  key={i}
                  className="flex-1 bg-indigo-300 hover:bg-indigo-400 rounded-t transition-colors"
                  style={{ height: `${Math.max(height, 10)}%` }}
                  title={`${formatValue(val)}`}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

