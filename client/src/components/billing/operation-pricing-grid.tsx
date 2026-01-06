/**
 * Operation Pricing Grid Component
 * 
 * Displays pricing for different AI operations (voice, OCR, chat)
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';

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

interface OperationPricingGridProps {
  operations: OperationPricing;
  isLoading?: boolean;
}

export function OperationPricingGrid({ operations, isLoading }: OperationPricingGridProps) {
  const { t, lang } = useTranslation();

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('credits.loading_pricing')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        💳 {t('credits.what_costs')}
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(operations).map(([key, op]) => (
          <Card key={key} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-2xl shrink-0">{op.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {lang === 'ru' ? op.nameRu : op.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {lang === 'ru' ? op.exampleRu : op.example}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0 whitespace-nowrap">
                {op.credits} {op.credits === 1 ? t('credits.credit') : t('credits.credits')}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

