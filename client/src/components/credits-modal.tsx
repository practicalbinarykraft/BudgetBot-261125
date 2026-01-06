/**
 * Credits Modal Component
 *
 * Shows detailed pricing information, current balance, and upgrade options
 */

import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Sparkles, Key, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTranslation } from '@/i18n';

interface CreditsData {
  messagesRemaining: number;
  totalGranted: number;
  totalUsed: number;
  billingMode: 'free' | 'byok' | 'paid';
  hasByok: boolean;
}

interface OperationPricing {
  [key: string]: {
    name: string;
    nameRu: string;
    icon: string;
    credits: number;
    description: string;
    descriptionRu: string;
    example: string;
    exampleRu: string;
  };
}

interface PricingTier {
  id: string;
  name: string;
  credits: number | null;
  price: number;
  priceMonthly: number;
  features: string[];
  popular?: boolean;
}

interface PricingData {
  operations: OperationPricing;
  tiers: PricingTier[];
}

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: CreditsData;
}

export function CreditsModal({ isOpen, onClose, currentCredits }: CreditsModalProps) {
  const { data: pricing, isLoading } = useQuery<PricingData>({
    queryKey: ['/api/credits/pricing'],
    enabled: isOpen,
  });

  const { t, lang } = useTranslation();
  const [, setLocation] = useLocation();

  const handleNavigateToBilling = () => {
    onClose();
    // Small delay to let the modal close animation complete
    setTimeout(() => {
      setLocation('/app/settings/billing');
    }, 100);
  };

  const handleNavigateToSettings = () => {
    onClose();
    // Small delay to let the modal close animation complete
    setTimeout(() => {
      setLocation('/app/settings');
    }, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full !p-3 sm:!p-6 !gap-2 sm:!gap-4">
        <DialogHeader className="space-y-1 sm:space-y-2 !mb-2 sm:!mb-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            {t('credits.title')}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {currentCredits.billingMode === 'byok'
              ? t('credits.byok_unlimited')
              : t('credits.remaining', { count: currentCredits.messagesRemaining })}
          </DialogDescription>
        </DialogHeader>

        {/* View Full Billing Details */}
        <Button 
          variant="outline" 
          className="w-full text-xs sm:text-sm" 
          onClick={handleNavigateToBilling}
        >
          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          <span className="truncate">{t('credits.view_billing')}</span>
        </Button>

        {/* Current Balance */}
        <Card className="mt-2 sm:mt-3">
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">{t('credits.your_balance')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3 sm:p-6 pt-0">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('credits.credits_remaining')}</span>
              <span className="text-xl sm:text-2xl font-bold">
                {currentCredits.billingMode === 'byok' ? '∞' : currentCredits.messagesRemaining}
              </span>
            </div>
            {currentCredits.billingMode !== 'byok' && (
              <>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-muted-foreground">{t('credits.total_granted')}</span>
                  <span>{currentCredits.totalGranted}</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-muted-foreground">{t('credits.total_used')}</span>
                  <span>{currentCredits.totalUsed}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">{t('credits.mode')}</span>
              <Badge variant={currentCredits.billingMode === 'byok' ? 'default' : 'secondary'} className="text-xs">
                {currentCredits.billingMode === 'byok' ? (
                  <span className="flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    {t('credits.mode_byok')}
                  </span>
                ) : currentCredits.billingMode === 'paid' ? (
                  t('credits.mode_paid')
                ) : (
                  t('credits.mode_free')
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-2 sm:my-4" />

        {/* Operation Pricing */}
        <div className="space-y-2 sm:space-y-3">
          <h3 className="font-semibold text-base sm:text-lg">💳 {t('credits.what_costs')}</h3>
          {isLoading ? (
            <div className="text-xs sm:text-sm text-muted-foreground">{t('credits.loading_pricing')}</div>
          ) : pricing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {Object.entries(pricing.operations).map(([key, op]) => (
                <Card key={key} className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-xl sm:text-2xl shrink-0">{op.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs sm:text-sm truncate">{lang === 'ru' ? op.nameRu : op.name}</h4>
                        <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">
                          {lang === 'ru' ? op.exampleRu : op.example}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[11px] sm:text-xs whitespace-nowrap">
                      {op.credits} {op.credits === 1 ? t('credits.credit') : t('credits.credits')}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
        </div>

        <Separator className="my-2 sm:my-4" />

        {/* Pricing Tiers */}
        <div className="space-y-2 sm:space-y-3">
          <h3 className="font-semibold text-base sm:text-lg">📊 {t('credits.pricing_plans')}</h3>
          {pricing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {pricing.tiers
                .filter((tier) => tier.id !== 'byok') // BYOK shown separately
                .map((tier) => (
                  <Card
                    key={tier.id}
                    className={`relative ${tier.popular ? 'border-primary shadow-lg' : ''}`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-xs">{t('credits.most_popular')}</Badge>
                      </div>
                    )}
                    <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-6">
                      <CardTitle className="text-base sm:text-lg">{tier.name}</CardTitle>
                      <CardDescription>
                        <span className="text-2xl sm:text-3xl font-bold text-foreground">
                          ${tier.price}
                        </span>
                        {tier.priceMonthly > 0 && <span className="text-xs sm:text-sm">{t('credits.per_month')}</span>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0">
                      {tier.credits && (
                        <div className="text-xs sm:text-sm font-medium">
                          {t('credits.credits_per_month', { count: tier.credits })}
                        </div>
                      )}
                      <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        {tier.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary mt-0.5 shrink-0" />
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {tier.id !== 'free' && (
                        <Button className="w-full text-xs sm:text-sm" disabled>
                          {t('common.coming_soon')}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : null}
        </div>

        {/* BYOK Option */}
        {!currentCredits.hasByok && (
          <>
            <Separator className="my-2 sm:my-4" />
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Key className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  <span className="leading-tight">{t('credits.byok_title')}</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t('credits.byok_description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 pt-0">
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="leading-tight">{t('credits.byok_feature1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="leading-tight">{t('credits.byok_feature2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="leading-tight">{t('credits.byok_feature3')}</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full text-xs sm:text-sm" 
                  onClick={handleNavigateToSettings}
                >
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  {t('credits.add_keys')}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Low Balance Warning */}
        {currentCredits.messagesRemaining < 5 && currentCredits.billingMode !== 'byok' && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 sm:pt-6">
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 leading-tight">
                ⚠️ {t('credits.low_balance_warning')}
              </p>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
