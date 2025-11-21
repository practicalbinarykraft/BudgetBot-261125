import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface TypeTabProps {
  period: string;
}

const TYPE_COLORS: Record<string, string> = {
  essential: '#dc2626',
  discretionary: '#eab308',
  asset: '#10b981',
  liability: '#3b82f6',
};

const TYPE_ICONS: Record<string, any> = {
  Essential: DollarSign,
  Discretionary: TrendingDown,
  Assets: TrendingUp,
  Liabilities: AlertCircle,
};

export function TypeTab({ period }: TypeTabProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['/api/analytics/by-type', period],
    queryFn: () => fetch(`/api/analytics/by-type?period=${period}`).then(r => r.json()),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.type.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  const items = data?.items || [];
  const total = data?.total || 0;

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.type.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('analytics.type.no_data')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('analytics.type.title')}</span>
          <span className="text-2xl font-mono" data-testid="text-total-amount">
            ${total.toFixed(2)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item: any, index: number) => {
          const IconComponent = TYPE_ICONS[item.name] || DollarSign;
          const color = TYPE_COLORS[item.type] || '#3b82f6';

          return (
            <div key={item.type || index} className="space-y-2" data-testid={`type-item-${index}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5" style={{ color }} />
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">${item.amount.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground min-w-[3rem] text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress 
                value={item.percentage} 
                className="h-2"
                style={{ 
                  '--progress-background': color 
                } as React.CSSProperties}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
