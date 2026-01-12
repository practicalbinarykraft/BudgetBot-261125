/**
 * Card Header with Help Button Component
 *
 * Reusable card header with optional help tooltip
 * Junior-Friendly: Simple wrapper, clear props
 */

import { useState } from "react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/i18n/context";

interface CardHeaderWithHelpProps {
  title: string;
  description?: string;
  helpKey?: string; // i18n key for help tooltip (e.g., 'admin.dashboard.mrr_growth.help')
}

export function CardHeaderWithHelp({ title, description, helpKey }: CardHeaderWithHelpProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  return (
    <CardHeader>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {helpKey && (
          <TooltipProvider delayDuration={200}>
            <Tooltip open={isOpen} onOpenChange={setIsOpen}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleClick}
                  className="text-gray-400 hover:text-gray-600 transition-colors mt-1"
                  aria-label={t('admin.common.help')}
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-semibold">{t(`${helpKey}.title`)}</p>
                  <p className="text-xs">{t(`${helpKey}.description`)}</p>
                  {t(`${helpKey}.calculation`) !== `${helpKey}.calculation` && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">{t('admin.common.calculation')}: </span>
                      {t(`${helpKey}.calculation`)}
                    </p>
                  )}
                  {t(`${helpKey}.purpose`) !== `${helpKey}.purpose` && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">{t('admin.common.purpose')}: </span>
                      {t(`${helpKey}.purpose`)}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </CardHeader>
  );
}
