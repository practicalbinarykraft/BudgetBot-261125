/**
 * Pricing Tiers Component
 * 
 * Displays available pricing plans (Free, Starter, Pro, Business)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface PricingTier {
  id: string;
  name: string;
  credits: number | null;
  price: number;
  priceMonthly: number;
  features: string[];
  popular?: boolean;
}

interface PricingTiersProps {
  tiers: PricingTier[];
  currentCredits?: {
    totalGranted: number;
    billingMode: 'free' | 'byok' | 'paid';
  };
}

export function PricingTiers({ tiers, currentCredits }: PricingTiersProps) {
  const { t } = useTranslation();

  // Filter out BYOK tier (shown separately)
  const regularTiers = tiers.filter((tier) => tier.id !== 'byok');

  // Determine current tier based on billing mode and credits
  const getCurrentTierId = (): string | null => {
    if (!currentCredits) return null;
    
    // If BYOK, no current tier
    if (currentCredits.billingMode === 'byok') {
      return null;
    }
    
    // First, try exact match by credits amount
    const exactTier = regularTiers.find(t => t.credits === currentCredits.totalGranted);
    if (exactTier) {
      return exactTier.id;
    }
    
    // If no exact match, find the closest tier that is less than or equal to totalGranted
    const sortedTiers = [...regularTiers]
      .filter(t => t.credits !== null)
      .sort((a, b) => (b.credits || 0) - (a.credits || 0)); // Sort descending
    
    for (const tier of sortedTiers) {
      if (tier.credits && tier.credits <= currentCredits.totalGranted) {
        return tier.id;
      }
    }
    
    // If no tier found (e.g., user has less than smallest tier), return null
    return null;
  };

  const currentTierId = getCurrentTierId();

  // Translate feature text
  const translateFeature = (feature: string): string => {
    // Map English features to i18n keys
    const featureMap: Record<string, string> = {
      '50 free credits': 'credits.tier.free_credits',
      'All AI features': 'credits.tier.all_features',
      'No credit card required': 'credits.tier.no_card',
      'Email support': 'credits.tier.email_support',
      'Priority support': 'credits.tier.priority_support',
      '~100-200 operations': 'credits.tier.operations_100_200',
      '~250-500 operations': 'credits.tier.operations_250_500',
      '~500-1000 operations': 'credits.tier.operations_500_1000',
    };

    // Check if we have a translation key
    const translationKey = featureMap[feature];
    if (translationKey) {
      return t(translationKey);
    }

    // For dynamic features like "200 credits/month", use the raw text
    // but translate "credits/month" part
    if (feature.includes('credits/month')) {
      const count = feature.match(/\d+/)?.[0];
      if (count) {
        return t('credits.credits_per_month', { count: parseInt(count) });
      }
    }

    // Return original feature if no translation found
    return feature;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        📊 {t('credits.pricing_plans')}
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {regularTiers.map((tier) => {
          const isCurrent = tier.id === currentTierId;
          
          return (
            <Card
              key={tier.id}
              className={`relative ${isCurrent ? 'border-primary shadow-lg' : ''}`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">
                    {t('credits.current_plan')}
                  </Badge>
                </div>
              )}
            
              <CardHeader className="pb-4">
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">
                    ${tier.price}
                  </span>
                  {tier.priceMonthly > 0 && (
                    <span className="text-sm ml-1">
                      {t('credits.per_month')}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
            
              <CardContent className="space-y-4">
                {tier.credits && tier.id !== 'free' && (
                  <div className="text-sm font-medium">
                    {t('credits.credits_per_month', { count: tier.credits })}
                  </div>
                )}
              
                <ul className="space-y-2 text-sm">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{translateFeature(feature)}</span>
                    </li>
                  ))}
                </ul>
              
                {tier.id !== 'free' && (
                  <Button className="w-full" disabled>
                    {t('common.coming_soon')}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

