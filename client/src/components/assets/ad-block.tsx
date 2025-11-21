import { TrendingUp, Home, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/i18n';

interface AdBlockProps {
  netWorth?: number;
}

export function AdBlock({ netWorth = 0 }: AdBlockProps) {
  const { t } = useTranslation();
  
  // Логика показа рекламы в зависимости от капитала
  const getAdContent = () => {
    if (netWorth > 50000) {
      return {
        title: t('assets.ad_realestate_title'),
        icon: Home,
        items: [
          t('assets.ad_realestate_item1'),
          t('assets.ad_realestate_item2'),
          t('assets.ad_realestate_item3'),
          t('assets.ad_realestate_item4')
        ],
        cta: t('assets.ad_realestate_cta'),
        gradient: 'from-blue-500/10 to-purple-500/10'
      };
    } else if (netWorth > 20000) {
      return {
        title: t('assets.ad_etf_title'),
        icon: TrendingUp,
        items: [
          t('assets.ad_etf_item1'),
          t('assets.ad_etf_item2'),
          t('assets.ad_etf_item3'),
          t('assets.ad_etf_item4')
        ],
        cta: t('assets.ad_etf_cta'),
        gradient: 'from-green-500/10 to-emerald-500/10'
      };
    } else {
      return {
        title: t('assets.ad_literacy_title'),
        icon: BookOpen,
        items: [
          t('assets.ad_literacy_item1'),
          t('assets.ad_literacy_item2'),
          t('assets.ad_literacy_item3'),
          t('assets.ad_literacy_item4')
        ],
        cta: t('assets.ad_literacy_cta'),
        gradient: 'from-orange-500/10 to-yellow-500/10'
      };
    }
  };
  
  const ad = getAdContent();
  const Icon = ad.icon;
  
  return (
    <Card className={`bg-gradient-to-br ${ad.gradient} dark:from-blue-500/5 dark:to-purple-500/5 overflow-hidden`}>
      <div className="p-6">
        {/* Метка "Реклама" */}
        <p className="text-xs text-muted-foreground mb-3" data-testid="text-ad-label">
          {t('assets.sponsored')}
        </p>
        
        {/* Изображение-заглушка */}
        <div className="h-32 bg-muted rounded-lg mb-4 flex items-center justify-center">
          <Icon className="w-16 h-16 text-muted-foreground/40" />
        </div>
        
        {/* Заголовок */}
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2" data-testid="text-ad-title">
          <Icon className="w-5 h-5" />
          {ad.title}
        </h3>
        
        {/* Список */}
        <ul className="text-sm text-foreground/80 mb-4 space-y-2">
          {ad.items.map((item, index) => (
            <li key={index} className="flex items-start gap-2" data-testid={`text-ad-item-${index}`}>
              <span className="text-primary mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        
        {/* Кнопка */}
        <Button
          variant="default"
          className="w-full"
          onClick={(e) => {
            e.preventDefault();
            alert('This is a demo ad. Functionality will be added later.');
          }}
          data-testid="button-ad-cta"
        >
          {ad.cta} →
        </Button>
      </div>
    </Card>
  );
}
