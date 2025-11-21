import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Link } from 'wouter';
import type { AssetWithCategory } from '@/lib/types/assets';

interface AssetCardProps {
  asset: AssetWithCategory;
}

export function AssetCard({ asset }: AssetCardProps) {
  const currentValue = parseFloat(asset.currentValue);
  const purchasePrice = asset.purchasePrice ? parseFloat(asset.purchasePrice) : null;
  
  // Расчёт изменения цены
  let changeAmount = 0;
  let changePercent = 0;
  let ownershipYears = 0;
  
  if (purchasePrice && asset.purchaseDate) {
    changeAmount = currentValue - purchasePrice;
    changePercent = (changeAmount / purchasePrice) * 100;
    
    const purchaseDate = new Date(asset.purchaseDate);
    const now = new Date();
    ownershipYears = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
  }
  
  const isPositive = changeAmount >= 0;
  
  // Cashflow
  const monthlyIncome = parseFloat(asset.monthlyIncome || '0');
  const monthlyExpense = parseFloat(asset.monthlyExpense || '0');
  const monthlyCashflow = monthlyIncome - monthlyExpense;
  
  return (
    <Link href={`/app/assets/${asset.id}`}>
      <div 
        className="bg-card rounded-lg border hover-elevate active-elevate-2 transition-all cursor-pointer overflow-hidden"
        data-testid={`asset-card-${asset.id}`}
      >
        {/* Изображение */}
        <div className="h-40 bg-muted relative">
          {asset.imageUrl ? (
            <img 
              src={asset.imageUrl} 
              alt={asset.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <DollarSign size={48} />
            </div>
          )}
          
          {/* Тип badge */}
          <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
            asset.type === 'asset' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {asset.type === 'asset' ? (
              <>
                <TrendingUp size={12} />
                <span>Asset</span>
              </>
            ) : (
              <>
                <TrendingDown size={12} />
                <span>Liability</span>
              </>
            )}
          </div>
        </div>
        
        {/* Контент */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 truncate" data-testid="text-asset-name">
            {asset.name}
          </h3>
          
          {/* Стоимость */}
          <p className="text-2xl font-bold mb-1" data-testid="text-current-value">
            ${currentValue.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}
          </p>
          
          {/* Изменение */}
          {purchasePrice && (
            <div 
              className={`flex items-center gap-1 text-sm mb-3 ${
                isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
              data-testid="text-price-change"
            >
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>
                {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
              </span>
              {ownershipYears > 0 && (
                <span className="text-muted-foreground">
                  ({ownershipYears} yr{ownershipYears !== 1 ? 's' : ''})
                </span>
              )}
            </div>
          )}
          
          {/* Cashflow */}
          {(monthlyIncome > 0 || monthlyExpense > 0) && (
            <div 
              className={`text-sm font-medium flex items-center gap-1 ${
                monthlyCashflow > 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}
              data-testid="text-cashflow"
            >
              <DollarSign size={14} />
              <span>
                {monthlyCashflow > 0 ? '+' : ''}${Math.abs(monthlyCashflow).toFixed(0)}/mo
              </span>
            </div>
          )}
          
          {/* Локация */}
          {asset.location && (
            <p className="text-xs text-muted-foreground mt-2 truncate">
              {asset.location}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
