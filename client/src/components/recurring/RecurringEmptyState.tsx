import { Card, CardContent } from "@/components/ui/card";
import { Repeat } from "lucide-react";
import { useTranslation } from "@/i18n/context";

export function RecurringEmptyState() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="text-center py-12">
        <Repeat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t("recurring.empty_title")}</p>
        <p className="text-sm text-muted-foreground mt-1">{t("recurring.empty_hint")}</p>
      </CardContent>
    </Card>
  );
}
