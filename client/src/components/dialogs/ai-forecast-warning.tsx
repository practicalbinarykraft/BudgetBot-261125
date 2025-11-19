import { useTranslation } from "@/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sparkles, DollarSign, Clock } from "lucide-react";

interface AiForecastWarningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function AiForecastWarning({
  open,
  onOpenChange,
  onConfirm,
}: AiForecastWarningProps) {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="dialog-ai-forecast-warning">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('dashboard.ai_warning_title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-left">
            <p>{t('dashboard.ai_warning_description')}</p>
            
            <div className="flex items-start gap-2 p-3 rounded-md bg-muted">
              <DollarSign className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <p className="text-sm text-foreground">
                {t('dashboard.ai_warning_cost')}
              </p>
            </div>
            
            <div className="flex items-start gap-2 p-3 rounded-md bg-muted">
              <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <p className="text-sm text-foreground">
                {t('dashboard.ai_warning_cache')}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-ai-forecast">
            {t('dashboard.ai_warning_cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            data-testid="button-confirm-ai-forecast"
          >
            {t('dashboard.ai_warning_confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
