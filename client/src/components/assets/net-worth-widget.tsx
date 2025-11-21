import { TrendingUp, TrendingDown, Eye, EyeOff, DollarSign } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { NetWorthSummary } from '@/lib/types/assets';

interface NetWorthWidgetProps {
  summary: NetWorthSummary;
  visible?: boolean;
  onToggleVisibility?: () => void;
}

export function NetWorthWidget({ 
  summary, 
  visible = true,
  onToggleVisibility 
}: NetWorthWidgetProps) {
  const isPositive = summary.changePercent >= 0;
  
  // Форматирование больших чисел
  const formatCurrency = (value: number) => {
    const safeValue = value ?? 0;
    if (Math.abs(safeValue) >= 1000000) {
      return `$${(safeValue / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(safeValue) >= 1000) {
      return `$${(safeValue / 1000).toFixed(0)}K`;
    }
    return `$${safeValue.toFixed(0)}`;
  };
  
  return (
    <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 overflow-hidden">
      <div className="p-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium opacity-80">Net Worth</h3>
          {onToggleVisibility && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleVisibility}
              className="h-8 w-8 hover:bg-white/10 text-white"
              title={visible ? 'Hide' : 'Show'}
              data-testid="button-toggle-visibility"
            >
              {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
          )}
        </div>
        
        {/* Главная цифра */}
        <div className="mb-4">
          {visible ? (
            <>
              <p className="text-4xl font-bold mb-2" data-testid="text-net-worth">
                {formatCurrency(summary.netWorth)}
              </p>
              
              {/* Изменение */}
              <div className="flex items-center gap-2" data-testid="text-net-worth-change">
                {isPositive ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {isPositive ? '+' : ''}{(summary.changePercent ?? 0).toFixed(1)}% annual
                </span>
              </div>
            </>
          ) : (
            <div className="text-4xl font-bold">••••••</div>
          )}
        </div>
        
        {/* Разбивка */}
        {visible && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                <p className="text-xs opacity-80 mb-1">Assets</p>
                <p className="text-lg font-semibold" data-testid="text-total-assets">
                  {formatCurrency(summary.totalAssets)}
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                <p className="text-xs opacity-80 mb-1">Liabilities</p>
                <p className="text-lg font-semibold" data-testid="text-total-liabilities">
                  {formatCurrency(summary.totalLiabilities)}
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                <p className="text-xs opacity-80 mb-1">Cashflow</p>
                <p 
                  className={`text-lg font-semibold ${
                    summary.monthlyCashflow >= 0 ? 'text-green-200' : 'text-red-200'
                  }`}
                  data-testid="text-monthly-cashflow"
                >
                  {summary.monthlyCashflow >= 0 ? '+' : ''}
                  {formatCurrency(summary.monthlyCashflow)}/mo
                </p>
              </div>
            </div>
            
            {/* Детали */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="opacity-80">Income from assets:</span>
                <span className="font-medium text-green-200">
                  <DollarSign className="w-3 h-3 inline" />
                  {summary.monthlyIncome.toFixed(0)}/mo
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="opacity-80">Expense on liabilities:</span>
                <span className="font-medium text-red-200">
                  <DollarSign className="w-3 h-3 inline" />
                  {summary.monthlyExpense.toFixed(0)}/mo
                </span>
              </div>
            </div>
          </>
        )}
        
        {/* Кнопка */}
        <Link href="/app/assets">
          <Button 
            variant="ghost" 
            className="w-full bg-white/20 hover:bg-white/30 text-white"
            data-testid="button-view-details"
          >
            View Details →
          </Button>
        </Link>
      </div>
    </Card>
  );
}
