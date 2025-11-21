import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '@/i18n';

interface UnsortedTabProps {
  period: string;
}

export function UnsortedTab({ period }: UnsortedTabProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['/api/analytics/unsorted', period],
    queryFn: () => fetch(`/api/analytics/unsorted?period=${period}`).then(r => r.json()),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.unsorted.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  const transactions = data?.transactions || [];
  const count = data?.count || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('analytics.unsorted.title')}</span>
          <Badge variant="secondary" data-testid="badge-unsorted-count">
            {count} {count === 1 ? 'transaction' : 'transactions'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg font-medium text-muted-foreground">{t('analytics.unsorted.no_data')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('analytics.unsorted.description')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              {t('analytics.unsorted.description')}
            </p>
            {transactions.map((transaction: any) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                data-testid={`transaction-${transaction.id}`}
              >
                <div className="flex-1">
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-medium">
                    ${parseFloat(transaction.amountUsd).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
