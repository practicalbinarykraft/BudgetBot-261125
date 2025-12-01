/**
 * Telegram Integration Card Component
 *
 * Telegram connection status, verification code generation, disconnect
 * Handles verification code countdown timer and clipboard copy
 * Junior-Friendly: <200 lines, focused on Telegram integration
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Copy, MessageCircle, X } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { useTranslation } from "@/i18n";
import { TelegramStatus, VerificationCodeResponse } from "./types";

interface TelegramIntegrationCardProps {
  telegramStatus: TelegramStatus | undefined;
  isTelegramLoading: boolean;
  generateCodeMutation: UseMutationResult<VerificationCodeResponse, Error, void, unknown>;
  disconnectMutation: UseMutationResult<any, Error, void, unknown>;
}

export function TelegramIntegrationCard({
  telegramStatus,
  isTelegramLoading,
  generateCodeMutation,
  disconnectMutation,
}: TelegramIntegrationCardProps) {
  const { t } = useTranslation();
  const [verificationCode, setVerificationCode] = useState<VerificationCodeResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Update verification code when mutation succeeds
  useEffect(() => {
    if (generateCodeMutation.isSuccess && generateCodeMutation.data) {
      setVerificationCode(generateCodeMutation.data);
      setCopied(false);
    }
  }, [generateCodeMutation.isSuccess, generateCodeMutation.data]);

  // Clear verification code when disconnecting
  useEffect(() => {
    if (disconnectMutation.isSuccess) {
      setVerificationCode(null);
    }
  }, [disconnectMutation.isSuccess]);

  // Countdown timer for verification code
  useEffect(() => {
    if (!verificationCode) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiresAt = new Date(verificationCode.expiresAt).getTime();
      const diff = Math.floor((expiresAt - now) / 1000);

      if (diff <= 0) {
        setTimeLeft(null);
        setVerificationCode(null);
      } else {
        setTimeLeft(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [verificationCode]);

  const handleCopyCode = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(verificationCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.telegram_integration")}</CardTitle>
        <CardDescription>{t("settings.telegram_integration.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTelegramLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <>
            <div className="flex items-center justify-between rounded-md border p-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("settings.connection_status")}</p>
                  {telegramStatus?.connected ? (
                    <p className="text-sm text-muted-foreground">
                      {t("settings.connected_as")} @{telegramStatus.username || "unknown"}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("settings.telegram_not_connected")}</p>
                  )}
                </div>
              </div>
              <Badge variant={telegramStatus?.connected ? "default" : "secondary"} data-testid="badge-telegram-status">
                {telegramStatus?.connected ? t("settings.telegram_connected") : t("settings.telegram_not_connected")}
              </Badge>
            </div>

            {telegramStatus?.connected ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("settings.connected_account")}
                </p>
                <Button
                  variant="destructive"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  data-testid="button-disconnect-telegram"
                >
                  {disconnectMutation.isPending ? `${t("settings.disconnecting")}...` : t("settings.disconnect_telegram")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {!verificationCode ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.generate_code_description")}
                    </p>
                    <Button
                      onClick={() => generateCodeMutation.mutate()}
                      disabled={generateCodeMutation.isPending}
                      data-testid="button-generate-code"
                    >
                      {generateCodeMutation.isPending ? `${t("settings.generating")}...` : t("settings.generate_code")}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4 rounded-md border p-4 bg-accent/5">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{t("settings.verification_code_label")}</p>
                      <div className="flex items-center gap-2">
                        <code className="relative rounded bg-muted px-3 py-1.5 font-mono text-2xl font-bold tracking-wider" data-testid="text-verification-code">
                          {verificationCode.code}
                        </code>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={handleCopyCode}
                          data-testid="button-copy-code"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      {timeLeft !== null && (
                        <p className="text-sm text-muted-foreground">
                          {t("settings.expires_in")}: <span className="font-medium" data-testid="text-time-left">{formatTime(timeLeft)}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 border-t pt-4">
                      <p className="text-sm font-medium">{t("settings.how_to_connect")}</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>{t("settings.telegram_step1")}</li>
                        <li>{t("settings.telegram_step2")}: /verify {verificationCode.code}</li>
                        <li>{t("settings.telegram_step3")}</li>
                      </ol>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setVerificationCode(null)}
                      data-testid="button-cancel-code"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t("settings.cancel")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
