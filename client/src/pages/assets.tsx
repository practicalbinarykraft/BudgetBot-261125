import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssetList } from '@/components/assets/asset-list';
import { AssetForm } from '@/components/assets/asset-form';
import { AssetCategoryDialog } from '@/components/assets/asset-category-dialog';
import { AdBlock } from '@/components/assets/ad-block';
import { AIAdviceBlock } from '@/components/assets/ai-advice-block';
import type { AssetWithCategory, NetWorthSummary } from '@/lib/types/assets';
import { useTranslation } from '@/i18n';

export default function AssetsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'asset' | 'liability'>('asset');
  const [showForm, setShowForm] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  
  // Получить все активы
  const { data: assetsResponse, isLoading } = useQuery<{
    success: boolean;
    data: {
      assets: AssetWithCategory[];
      grouped: Record<string, AssetWithCategory[]>;
    };
  }>({
    queryKey: ['/api/assets'],
  });
  
  // Получить сводку
  const { data: summaryResponse } = useQuery<{
    success: boolean;
    data: NetWorthSummary;
  }>({
    queryKey: ['/api/assets/summary'],
  });
  
  const assetsData = assetsResponse?.data;
  const summary = summaryResponse?.data;
  
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
          <h1 className="text-3xl font-bold mb-2">{t('assets.title')}</h1>
          <p className="text-muted-foreground">
            {t('assets.subtitle')}
          </p>
        </div>
      
        {/* Сводка */}
        {summary && (
          <Card className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white border-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-80">{t('assets.net_worth')}</p>
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
                  <p className="text-xs opacity-80">{t('assets.assets')}</p>
                  <p className="text-lg font-semibold" data-testid="text-total-assets">
                    ${((summary.totalAssets ?? 0) / 1000).toFixed(0)}K
                  </p>
                </div>
                
                <div className="bg-white/10 p-3 rounded-lg">
                  <p className="text-xs opacity-80">{t('assets.liabilities')}</p>
                  <p className="text-lg font-semibold" data-testid="text-total-liabilities">
                    ${((summary.totalLiabilities ?? 0) / 1000).toFixed(0)}K
                  </p>
                </div>
                
                <div className="bg-white/10 p-3 rounded-lg">
                  <p className="text-xs opacity-80">{t('assets.cashflow')}</p>
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
        
        {/* Табы */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'asset' | 'liability')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2" data-testid="tabs-list">
            <TabsTrigger value="asset" data-testid="tab-assets">
              {t('assets.tab_assets')}
            </TabsTrigger>
            <TabsTrigger value="liability" data-testid="tab-liabilities">
              {t('assets.tab_liabilities')}
            </TabsTrigger>
          </TabsList>
          
          {/* Кнопки */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCategoryDialog(true)}
              data-testid="button-add-category"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('assets.add_category')}
            </Button>
            
            <Button
              onClick={() => setShowForm(true)}
              data-testid="button-add-asset"
            >
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === 'asset' ? t('assets.add_asset') : t('assets.add_liability')}
            </Button>
          </div>
          
          {/* Контент вкладок */}
          <TabsContent value="asset" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('assets.loading')}</p>
              </div>
            ) : (
              <AssetList 
                groupedAssets={filteredGrouped}
                emptyMessage={t('assets.no_assets')}
              />
            )}
          </TabsContent>
          
          <TabsContent value="liability" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('assets.loading')}</p>
              </div>
            ) : (
              <AssetList 
                groupedAssets={filteredGrouped}
                emptyMessage={t('assets.no_liabilities')}
              />
            )}
          </TabsContent>
        </Tabs>
        
        {/* Форма */}
        <AssetForm
          open={showForm}
          onOpenChange={setShowForm}
          type={activeTab}
        />
        
        {/* Диалог добавления категории */}
        <AssetCategoryDialog
          open={showCategoryDialog}
          onOpenChange={setShowCategoryDialog}
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
