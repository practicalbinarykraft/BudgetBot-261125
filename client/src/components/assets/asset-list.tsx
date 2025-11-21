import { useState } from 'react';
import { Grid, List as ListIcon, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { AssetCard } from './asset-card';
import type { AssetWithCategory } from '@/lib/types/assets';

interface AssetListProps {
  groupedAssets: Record<string, AssetWithCategory[]>;
  emptyMessage?: string;
}

export function AssetList({ groupedAssets, emptyMessage = 'No assets yet' }: AssetListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const totalAssets = Object.values(groupedAssets).flat().length;
  
  if (totalAssets === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
        <p className="text-muted-foreground text-sm mt-2">
          Click "+ Add" to add your first asset
        </p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Переключатель вида */}
      <div className="flex justify-end mb-4 gap-2">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="icon"
          onClick={() => setViewMode('grid')}
          data-testid="button-view-grid"
          title="Grid view"
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="icon"
          onClick={() => setViewMode('list')}
          data-testid="button-view-list"
          title="List view"
        >
          <ListIcon className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Группы по категориям */}
      {Object.entries(groupedAssets).map(([categoryName, assets]) => (
        <div key={categoryName} className="mb-8">
          {/* Заголовок категории */}
          <h2 className="text-xl font-semibold mb-4">
            {categoryName}
          </h2>
          
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map(asset => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          )}
          
          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              {assets.map(asset => (
                <AssetListItem key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Компонент для списка (компактный вид)
function AssetListItem({ asset }: { asset: AssetWithCategory }) {
  const currentValue = parseFloat(asset.currentValue);
  const purchasePrice = asset.purchasePrice ? parseFloat(asset.purchasePrice) : null;
  
  let changePercent = 0;
  let isPositive = true;
  
  if (purchasePrice) {
    const changeAmount = currentValue - purchasePrice;
    changePercent = (changeAmount / purchasePrice) * 100;
    isPositive = changeAmount >= 0;
  }
  
  const monthlyCashflow = parseFloat(asset.monthlyIncome || '0') - parseFloat(asset.monthlyExpense || '0');
  
  return (
    <Link href={`/app/assets/${asset.id}`}>
      <div 
        className="bg-card rounded-lg border hover-elevate active-elevate-2 transition-all cursor-pointer p-4 flex items-center gap-4"
        data-testid={`asset-list-item-${asset.id}`}
      >
        {/* Миниатюра */}
        <div className="w-16 h-16 bg-muted rounded flex-shrink-0 overflow-hidden">
          {asset.imageUrl ? (
            <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {asset.type === 'asset' ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
            </div>
          )}
        </div>
        
        {/* Информация */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate" data-testid="text-asset-name">
            {asset.name}
          </h3>
          {asset.location && (
            <p className="text-sm text-muted-foreground truncate">
              {asset.location}
            </p>
          )}
        </div>
        
        {/* Стоимость */}
        <div className="text-right">
          <p className="text-xl font-bold" data-testid="text-current-value">
            ${currentValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
          {purchasePrice && (
            <p 
              className={`text-sm ${
                isPositive 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}
              data-testid="text-price-change"
            >
              {isPositive ? '+' : ''}{(changePercent ?? 0).toFixed(1)}%
            </p>
          )}
        </div>
        
        {/* Cashflow */}
        {monthlyCashflow !== 0 && (
          <div 
            className={`text-right flex items-center gap-1 ${
              monthlyCashflow > 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}
            data-testid="text-cashflow"
          >
            <DollarSign className="w-4 h-4" />
            <p className="text-sm font-medium">
              {monthlyCashflow > 0 ? '+' : ''}${Math.abs(monthlyCashflow ?? 0).toFixed(0)}/mo
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
