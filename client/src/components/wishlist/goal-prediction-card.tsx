import { GoalPrediction } from "@/types/goal-prediction";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useTranslation } from "@/i18n/context";

interface GoalPredictionCardProps {
  prediction: GoalPrediction | null;
  amount: string;
}

export function GoalPredictionCard({ prediction, amount }: GoalPredictionCardProps) {
  const { t } = useTranslation();
  
  if (!prediction) {
    return (
      <div className="mt-3 p-3 bg-muted/30 rounded-md">
        <p className="text-sm text-muted-foreground">
          {t("wishlist.prediction.add_transactions")}
        </p>
      </div>
    );
  }

  const { canAfford, freeCapital, monthsToAfford, affordableDate } = prediction;

  if (canAfford) {
    const isValidCapital = !isNaN(freeCapital) && isFinite(freeCapital);
    
    return (
      <div className="mt-3 p-3 bg-[hsl(var(--accent)/0.5)] border border-[color:var(--accent-border)] rounded-md">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-[color:hsl(var(--accent-foreground))]" />
          <Badge variant="outline" className="border-[color:var(--accent-border)]" data-testid="badge-can-afford">
            {t("wishlist.prediction.can_afford_now")}
          </Badge>
        </div>
        {isValidCapital && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{t("wishlist.prediction.free_capital")}:</span>
            <span className="font-mono font-medium" data-testid="text-free-capital">
              ${freeCapital.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (monthsToAfford === null || !affordableDate) {
    const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    const deficit = amountNum - freeCapital;
    const isValidDeficit = !isNaN(deficit) && isFinite(deficit);
    
    return (
      <div className="mt-3 p-3 bg-[hsl(var(--destructive)/0.1)] border border-[color:hsl(var(--destructive)/0.2)] rounded-md">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-[color:hsl(var(--destructive))]" />
          <Badge variant="destructive" data-testid="badge-cannot-afford">
            {t("wishlist.prediction.not_affordable")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("wishlist.prediction.not_affordable_description")}
        </p>
        {isValidDeficit && (
          <div className="flex items-center gap-2 text-sm mt-2">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{t("wishlist.prediction.shortage")}:</span>
            <span className="font-mono font-medium text-[color:hsl(var(--destructive))]" data-testid="text-shortage">
              ${deficit.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    );
  }

  const isValidCapital = !isNaN(freeCapital) && isFinite(freeCapital);
  
  return (
    <div className="mt-3 p-3 bg-[hsl(var(--primary)/0.1)] border border-[color:hsl(var(--primary)/0.2)] rounded-md">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-4 w-4 text-[color:hsl(var(--primary))]" />
        <Badge variant="outline" className="border-[color:hsl(var(--primary)/0.3)]" data-testid="badge-affordable-soon">
          {t("wishlist.prediction.affordable_soon")}
        </Badge>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t("wishlist.prediction.estimated")}:</span>
          <span className="font-medium" data-testid="text-months-to-afford">
            {monthsToAfford} {monthsToAfford === 1 ? t("wishlist.prediction.month") : t("wishlist.prediction.months")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t("wishlist.prediction.by")}:</span>
          <span className="font-medium" data-testid="text-affordable-date">
            {format(parseISO(affordableDate), 'MMM dd, yyyy')}
          </span>
        </div>
        {isValidCapital && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{t("wishlist.prediction.free_capital")}:</span>
            <span className="font-mono font-medium" data-testid="text-free-capital">
              ${freeCapital.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
