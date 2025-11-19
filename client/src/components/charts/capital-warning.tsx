import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/i18n";

interface CapitalWarningProps {
  hasNegativeCapital: boolean;
}

export function CapitalWarning({ hasNegativeCapital }: CapitalWarningProps) {
  const { t } = useTranslation();

  if (!hasNegativeCapital) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mt-4" data-testid="alert-negative-capital">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t('dashboard.budget_warning_title')}</AlertTitle>
      <AlertDescription>
        <div className="space-y-1">
          <p>{t('dashboard.budget_warning_desc')}</p>
          <p className="text-sm">{t('dashboard.budget_warning_recommendations')}</p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
