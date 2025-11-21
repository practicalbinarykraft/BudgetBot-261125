import { TrendingUp, Home, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AdBlockProps {
  netWorth?: number;
}

export function AdBlock({ netWorth = 0 }: AdBlockProps) {
  
  // Логика показа рекламы в зависимости от капитала
  const getAdContent = () => {
    if (netWorth > 50000) {
      return {
        title: 'Real Estate in Bali',
        icon: Home,
        items: [
          'Installment plan for 2 years, 0% interest',
          'Down payment: $20,000',
          'Monthly payment: $2,000',
          'Rental income: ~$1,500/month'
        ],
        cta: 'Learn More',
        gradient: 'from-blue-500/10 to-purple-500/10'
      };
    } else if (netWorth > 20000) {
      return {
        title: 'ETF Investments',
        icon: TrendingUp,
        items: [
          'Diversified portfolio',
          'Minimum deposit: $1,000',
          'Average return: 8-12% annually',
          'Low fees'
        ],
        cta: 'Start Investing',
        gradient: 'from-green-500/10 to-emerald-500/10'
      };
    } else {
      return {
        title: 'Financial Literacy Course',
        icon: BookOpen,
        items: [
          'How to manage personal finances',
          'Investment basics',
          'Building passive income',
          '50% discount for new users'
        ],
        cta: 'Enroll Now',
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
          SPONSORED
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
