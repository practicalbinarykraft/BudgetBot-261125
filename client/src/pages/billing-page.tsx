/**
 * Billing Page Component
 *
 * Displays pricing, current balance, and billing information
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import { Sparkles } from 'lucide-react';
import { CurrentBalanceCard } from '@/components/billing/current-balance-card';
import { OperationPricingGrid } from '@/components/billing/operation-pricing-grid';
import { PricingTiers } from '@/components/billing/pricing-tiers';
import { useTranslation } from '@/i18n';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { MobileMenuSheet } from '@/components/mobile-menu-sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

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

export default function BillingPage() {
  const { t } = useTranslation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Fetch current credits
  const { data: credits, isLoading: creditsLoading } = useQuery<CreditsData>({
    queryKey: ['/api/credits'],
  });

  // Fetch pricing data
  const { data: pricing, isLoading: pricingLoading } = useQuery<PricingData>({
    queryKey: ['/api/credits/pricing'],
  });

  if (creditsLoading || pricingLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-4 sm:p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!credits || !pricing) {
    return (
      <div className="container max-w-6xl mx-auto p-4 sm:p-6">
        <div className="text-center py-12">
          <p className="text-destructive">{t('common.error_loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="container max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-20 sm:pb-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          {t('credits.title')}
        </h1>
        <p className="text-muted-foreground">
          {credits.billingMode === 'byok'
            ? t('credits.byok_unlimited')
            : t('credits.remaining', { count: credits.messagesRemaining })}
        </p>
      </div>

      <Separator />

      {/* Current Balance */}
      <CurrentBalanceCard credits={credits} />

      <Separator />

      {/* Operation Pricing */}
      <OperationPricingGrid 
        operations={pricing.operations} 
        isLoading={pricingLoading}
      />

      <Separator />

      {/* Pricing Tiers */}
      <PricingTiers 
        tiers={pricing.tiers} 
        currentCredits={{
          totalGranted: credits.totalGranted,
          billingMode: credits.billingMode
        }}
      />
    </div>

    {/* Mobile Navigation */}
    {isMobile && (
      <MobileBottomNav
        onMenuClick={() => setShowMobileMenu(true)}
        onAddClick={() => {
          toast({
            title: "Добавить транзакцию",
            description: "Функция скоро будет доступна!",
          });
        }}
        onAiChatClick={() => {
          toast({
            title: "AI Chat",
            description: "Функция AI чата скоро будет доступна!",
          });
        }}
      />
    )}

    <MobileMenuSheet
      open={showMobileMenu}
      onOpenChange={setShowMobileMenu}
    />
    </>
  );
}
