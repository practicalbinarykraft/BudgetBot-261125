import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useTranslation } from "@/i18n/context";

export function WishlistEmptyState() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="text-center py-12">
        <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t("wishlist.empty_title")}</p>
        <p className="text-sm text-muted-foreground mt-1">{t("wishlist.empty_description")}</p>
      </CardContent>
    </Card>
  );
}
