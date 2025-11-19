import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WishlistItemWithPrediction } from "@/types/goal-prediction";
import { Calendar } from "lucide-react";
import { useTranslation } from "@/i18n/context";

interface SchedulePurchaseDialogProps {
  item: WishlistItemWithPrediction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (wishlistId: number, targetDate: string) => void;
}

export function SchedulePurchaseDialog({ 
  item, 
  open, 
  onOpenChange, 
  onSchedule 
}: SchedulePurchaseDialogProps) {
  const [targetDate, setTargetDate] = useState("");
  const { t } = useTranslation();

  const handleSchedule = () => {
    if (item && targetDate) {
      onSchedule(item.id, targetDate);
      setTargetDate("");
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-schedule-purchase">
        <DialogHeader>
          <DialogTitle>{t("wishlist.schedule_purchase")}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">{t("wishlist.item")}</Label>
            <p className="font-medium">{item.name}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground">{t("wishlist.amount")}</Label>
            <p className="font-medium">${item.amount}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="target-date">{t("wishlist.target_date")}</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="pl-10"
                data-testid="input-target-date"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-schedule"
          >
            {t("common.cancel")}
          </Button>
          <Button 
            onClick={handleSchedule}
            disabled={!targetDate}
            data-testid="button-confirm-schedule"
          >
            {t("wishlist.schedule")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
