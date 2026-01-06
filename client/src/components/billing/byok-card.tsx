/**
 * BYOK (Bring Your Own Key) Card Component
 * 
 * Information about using your own API keys instead of paid credits
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Key, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
import { useTranslation } from '@/i18n';

export function ByokCard() {
  const { t } = useTranslation();

  return (
    <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-emerald-600" />
          {t('credits.byok_title')}
        </CardTitle>
        <CardDescription>
          {t('credits.byok_description')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <span>{t('credits.byok_feature1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <span>{t('credits.byok_feature2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <span>{t('credits.byok_feature3')}</span>
          </li>
        </ul>
        
        <Link href="/app/settings">
          <Button variant="outline" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('credits.add_keys')}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

