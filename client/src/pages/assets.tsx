import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AssetList } from '@/components/assets/asset-list';
import { AssetForm } from '@/components/assets/asset-form';
import { AdBlock } from '@/components/assets/ad-block';
import { AIAdviceBlock } from '@/components/assets/ai-advice-block';
import type { AssetWithCategory, NetWorthSummary } from '@/lib/types/assets';

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState<'asset' | 'liability'>('asset');
  const [showForm, setShowForm] = useState(false);
  
  // Получить все активы
  const { data: assetsData, isLoading } = useQuery<{
    assets: AssetWithCategory[];
    grouped: Record<string, AssetWithCategory[]>;
  }>({
    queryKey: ['/api/assets'],
  });
  
  // Получить сводку
  const { data: summary } = useQuery<NetWorthSummary>({
    queryKey: ['/api/assets/summary'],
  });
  
  // Фильтровать по табу
  const filteredGrouped = assetsData?.grouped 
    ? Object.fromEntries(
        Object.entries(assetsData.grouped).map(([category, assets]) => [
          category,
          assets.filter(a => a.type === activeTab)
        ]).filter(([_, assets]) => assets.length > 0)
      )
    : {};
  
  const isPositive = (summary?.changePercent || 0) >= 0;
  
  return (
    <div className="flex gap-6">
      {/* Основной контент */}
      <div className="flex-1 space-y-6">
        {/* Заголовок */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Assets & Liabilities</h1>
          <p className="text-muted-foreground">
            Manage your possessions and track their value
          </p>
        </div>
      
        {/* Сводка */}
        {summary && (
          <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-80">Net Worth</p>
                  <p className="text-4xl font-bold" data-testid="text-net-worth">
                    ${(summary.netWorth ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                
                <div 
                  className={`flex items-center gap-2 text-lg ${
                    isPositive ? 'text-green-200' : 'text-red-200'
                  }`}
                  data-testid="text-net-worth-change"
                >
                  {isPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  <span>{isPositive ? '+' : ''}{(summary.changePercent ?? 0).toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 p-3 rounded-lg">
                  <p className="text-xs opacity-80">Assets</p>
                  <p className="text-lg font-semibold" data-testid="text-total-assets">
                    ${((summary.totalAssets ?? 0) / 1000).toFixed(0)}K
                  </p>
                </div>
                
                <div className="bg-white/10 p-3 rounded-lg">
                  <p className="text-xs opacity-80">Liabilities</p>
                  <p className="text-lg font-semibold" data-testid="text-total-liabilities">
                    ${((summary.totalLiabilities ?? 0) / 1000).toFixed(0)}K
                  </p>
                </div>
                
                <div className="bg-white/10 p-3 rounded-lg">
                  <p className="text-xs opacity-80">Cashflow</p>
                  <p 
                    className={`text-lg font-semibold ${
                      summary.monthlyCashflow >= 0 ? 'text-green-200' : 'text-red-200'
                    }`}
                    data-testid="text-monthly-cashflow"
                  >
                    {summary.monthlyCashflow >= 0 ? '+' : ''}${(summary.monthlyCashflow ?? 0).toFixed(0)}/mo
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
        
        {/* Табы и кнопки */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'asset' ? 'default' : 'outline'}
              onClick={() => setActiveTab('asset')}
              className={activeTab === 'asset' ? 'bg-green-600 hover:bg-green-700' : ''}
              data-testid="button-tab-assets"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Assets
            </Button>
            <Button
              variant={activeTab === 'liability' ? 'default' : 'outline'}
              onClick={() => setActiveTab('liability')}
              className={activeTab === 'liability' ? 'bg-red-600 hover:bg-red-700' : ''}
              data-testid="button-tab-liabilities"
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Liabilities
            </Button>
          </div>
          
          <Button
            onClick={() => setShowForm(true)}
            data-testid="button-add-asset"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {activeTab === 'asset' ? 'Asset' : 'Liability'}
          </Button>
        </div>
        
        {/* Список */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <AssetList 
            groupedAssets={filteredGrouped}
            emptyMessage={
              activeTab === 'asset' 
                ? 'No assets yet. Add your first asset!' 
                : 'No liabilities yet.'
            }
          />
        )}
        
        {/* Форма */}
        <AssetForm
          open={showForm}
          onOpenChange={setShowForm}
          type={activeTab}
        />
      </div>
      
      {/* Sidebar с советами и рекламой */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <div className="sticky top-6 space-y-6">
          <AIAdviceBlock />
          <AdBlock netWorth={summary?.netWorth} />
        </div>
      </div>
    </div>
  );
}
