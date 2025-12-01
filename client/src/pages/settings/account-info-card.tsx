/**
 * Account Info Card Component
 *
 * Displays user account information (name, email)
 * Junior-Friendly: <50 lines, simple display component
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/i18n";

export function AccountInfoCard() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.account_information")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">{t("common.name")}</p>
          <p className="font-medium">{user?.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("settings.email")}</p>
          <p className="font-medium">{user?.email}</p>
        </div>
      </CardContent>
    </Card>
  );
}
