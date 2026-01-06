/**
 * Current Balance Card Component
 * 
 * Displays user's current credit balance, billing mode, and usage statistics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface CreditsData {
  messagesRemaining: number;
  totalGranted: number;
  totalUsed: number;
  billingMode: 'free' | 'byok' | 'paid';
  hasByok: boolean;
}

interface CurrentBalanceCardProps {
  credits: CreditsData;
}

export function CurrentBalanceCard({ credits }: CurrentBalanceCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('credits.your_balance')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('credits.credits_remaining')}</span>
          <span className="text-3xl font-bold">
            {credits.billingMode === 'byok' ? '∞' : credits.messagesRemaining}
          </span>
        </div>
        
        {credits.billingMode !== 'byok' && (
          <>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t('credits.total_granted')}</span>
              <span>{credits.totalGranted}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t('credits.total_used')}</span>
              <span>{credits.totalUsed}</span>
            </div>
          </>
        )}
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('credits.mode')}</span>
          <Badge variant={credits.billingMode === 'byok' ? 'default' : 'secondary'}>
            {credits.billingMode === 'byok' ? (
              <span className="flex items-center gap-1">
                <Key className="h-3 w-3" />
                {t('credits.mode_byok')}
              </span>
            ) : credits.billingMode === 'paid' ? (
              t('credits.mode_paid')
            ) : (
              t('credits.mode_free')
            )}
          </Badge>
        </div>

        {/* Low Balance Warning */}
        {credits.messagesRemaining < 5 && credits.billingMode !== 'byok' && (
          <div className="mt-4 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ {t('credits.low_balance_warning')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

