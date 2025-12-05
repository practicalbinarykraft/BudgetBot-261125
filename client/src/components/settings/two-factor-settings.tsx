/**
 * Two-Factor Authentication Settings Component
 *
 * Allows users to enable/disable 2FA using TOTP.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n";
import { apiRequest } from "@/lib/queryClient";
import { Shield, ShieldOff, ShieldCheck, Loader2 } from "lucide-react";

interface TwoFactorStatus {
  enabled: boolean;
}

interface SetupResponse {
  secret: string;
  qrCode: string;
}

export function TwoFactorSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState("");

  // Check 2FA status
  const { data: status, isLoading } = useQuery<TwoFactorStatus>({
    queryKey: ["/api/2fa/status"],
  });

  // Setup 2FA mutation
  const setupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/2fa/setup");
      return res.json() as Promise<SetupResponse>;
    },
    onSuccess: (data) => {
      setSetupData(data);
      setShowSetupDialog(true);
    },
    onError: () => {
      toast({
        title: t("settings.2fa_setup_error"),
        variant: "destructive",
      });
    },
  });

  // Enable 2FA mutation
  const enableMutation = useMutation({
    mutationFn: async ({ secret, token }: { secret: string; token: string }) => {
      const res = await apiRequest("POST", "/api/2fa/enable", { secret, token });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/2fa/status"] });
      setShowSetupDialog(false);
      setSetupData(null);
      setVerificationCode("");
      toast({
        title: t("settings.2fa_enabled"),
        description: t("settings.2fa_enabled_description"),
      });
    },
    onError: () => {
      toast({
        title: t("settings.2fa_invalid_code"),
        variant: "destructive",
      });
    },
  });

  // Disable 2FA mutation
  const disableMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiRequest("POST", "/api/2fa/disable", { token });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/2fa/status"] });
      setShowDisableDialog(false);
      setVerificationCode("");
      toast({
        title: t("settings.2fa_disabled"),
        description: t("settings.2fa_disabled_description"),
      });
    },
    onError: () => {
      toast({
        title: t("settings.2fa_invalid_code"),
        variant: "destructive",
      });
    },
  });

  const handleEnableClick = () => {
    setupMutation.mutate();
  };

  const handleVerifyAndEnable = () => {
    if (!setupData || verificationCode.length !== 6) return;
    enableMutation.mutate({ secret: setupData.secret, token: verificationCode });
  };

  const handleDisable = () => {
    if (verificationCode.length !== 6) return;
    disableMutation.mutate(verificationCode);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" aria-hidden="true" />
            {t("settings.2fa_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" aria-label={t("common.loading")} />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status?.enabled ? (
              <ShieldCheck className="w-5 h-5 text-green-500" aria-hidden="true" />
            ) : (
              <Shield className="w-5 h-5" aria-hidden="true" />
            )}
            {t("settings.2fa_title")}
          </CardTitle>
          <CardDescription>{t("settings.2fa_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {status?.enabled ? (
            <div className="space-y-4">
              <p className="text-sm text-green-600 dark:text-green-400">
                {t("settings.2fa_status_enabled")}
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDisableDialog(true)}
                aria-label={t("settings.2fa_disable")}
              >
                <ShieldOff className="w-4 h-4 mr-2" aria-hidden="true" />
                {t("settings.2fa_disable")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("settings.2fa_status_disabled")}
              </p>
              <Button
                onClick={handleEnableClick}
                disabled={setupMutation.isPending}
                aria-label={t("settings.2fa_enable")}
              >
                {setupMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" aria-hidden="true" />
                )}
                {t("settings.2fa_enable")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings.2fa_setup_title")}</DialogTitle>
            <DialogDescription>{t("settings.2fa_setup_description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {setupData?.qrCode && (
              <div className="flex justify-center">
                <img
                  src={setupData.qrCode}
                  alt={t("settings.2fa_qr_alt")}
                  className="w-48 h-48 border rounded-lg"
                />
              </div>
            )}
            <p className="text-sm text-center text-muted-foreground">
              {t("settings.2fa_manual_entry")}
            </p>
            {setupData?.secret && (
              <code className="block p-2 text-center bg-muted rounded text-sm font-mono">
                {setupData.secret}
              </code>
            )}
            <div className="space-y-2">
              <Label htmlFor="verification-code">{t("settings.2fa_enter_code")}</Label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-lg tracking-widest"
                aria-label={t("settings.2fa_enter_code")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleVerifyAndEnable}
              disabled={verificationCode.length !== 6 || enableMutation.isPending}
            >
              {enableMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
              )}
              {t("settings.2fa_verify_enable")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings.2fa_disable_title")}</DialogTitle>
            <DialogDescription>{t("settings.2fa_disable_description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disable-code">{t("settings.2fa_enter_code")}</Label>
              <Input
                id="disable-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-lg tracking-widest"
                aria-label={t("settings.2fa_enter_code")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={verificationCode.length !== 6 || disableMutation.isPending}
            >
              {disableMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
              )}
              {t("settings.2fa_disable")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
