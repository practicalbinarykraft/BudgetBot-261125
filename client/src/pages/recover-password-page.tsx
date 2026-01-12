/**
 * Recover Password Page
 *
 * Multi-step password recovery flow:
 * 1. Request recovery code (email/telegramId)
 * 2. Verify code → get reset token
 * 3. Reset password with token
 *
 * Junior-Friendly: ~150 lines, clear step-by-step flow
 */

import { useState } from "react";
import { useLocation, Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestRecoveryForm } from "@/components/auth/request-recovery-form";
import { RecoveryCodeForm } from "@/components/auth/recovery-code-form";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/context";

type RecoveryStep = 'request' | 'verify' | 'reset';

export default function RecoverPasswordPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [step, setStep] = useState<RecoveryStep>('request');
  const [emailOrTelegramId, setEmailOrTelegramId] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [isPending, setIsPending] = useState(false);

  // STEP 1: Request recovery code
  async function handleRequestRecovery(data: { emailOrTelegramId: string }) {
    setIsPending(true);
    try {
      const response = await fetch('/api/auth/request-password-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrTelegramId: data.emailOrTelegramId }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to request recovery code');
      }

      setEmailOrTelegramId(data.emailOrTelegramId);
      setStep('verify');
      toast({
        title: t('password_recovery.request_success') || '✅ Recovery code sent!',
        description: t('password_recovery.check_telegram') || 'Check your Telegram for the code',
      });
    } catch (error: any) {
      toast({
        title: t('password_recovery.request_error') || '❌ Error',
        description: error.message || 'Failed to request recovery code',
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  }

  // STEP 2: Verify recovery code
  async function handleVerifyCode(data: { code: string }) {
    setIsPending(true);
    try {
      const response = await fetch('/api/auth/verify-recovery-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrTelegramId,
          code: data.code,
        }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok || !result.resetToken) {
        throw new Error(result.error || 'Invalid or expired code');
      }

      setResetToken(result.resetToken);
      setStep('reset');
      toast({
        title: t('password_recovery.verify_success') || '✅ Code verified!',
        description: t('password_recovery.now_reset_password') || 'Now you can reset your password',
      });
    } catch (error: any) {
      toast({
        title: t('password_recovery.verify_error') || '❌ Invalid code',
        description: error.message || 'The code is invalid or expired',
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  }

  // STEP 3: Reset password
  async function handleResetPassword(data: { newPassword: string; confirmPassword: string }) {
    setIsPending(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: data.newPassword,
        }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      toast({
        title: t('password_recovery.reset_success') || '✅ Password reset!',
        description: t('password_recovery.can_login_now') || 'You can now login with your new password',
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        setLocation('/login');
      }, 2000);
    } catch (error: any) {
      toast({
        title: t('password_recovery.reset_error') || '❌ Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Wallet className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">
              {t('password_recovery.title') || 'Password Recovery'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {step === 'request' && (t('password_recovery.step1_description') || 'Enter your email or Telegram ID')}
            {step === 'verify' && (t('password_recovery.step2_description') || 'Enter the 6-digit code from Telegram')}
            {step === 'reset' && (t('password_recovery.step3_description') || 'Set your new password')}
          </p>
        </div>

        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => setLocation('/login')}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('password_recovery.back_to_login') || 'Back to Login'}
        </Button>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className={`flex items-center gap-2 ${step === 'request' ? 'text-primary font-semibold' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step === 'request' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              1
            </div>
            <span>{t('password_recovery.step1') || 'Request'}</span>
          </div>
          <div className="w-8 h-px bg-muted" />
          <div className={`flex items-center gap-2 ${step === 'verify' ? 'text-primary font-semibold' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step === 'verify' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <span>{t('password_recovery.step2') || 'Verify'}</span>
          </div>
          <div className="w-8 h-px bg-muted" />
          <div className={`flex items-center gap-2 ${step === 'reset' ? 'text-primary font-semibold' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step === 'reset' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              3
            </div>
            <span>{t('password_recovery.step3') || 'Reset'}</span>
          </div>
        </div>

        {/* Forms */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'request' && (t('password_recovery.request_title') || 'Request Recovery Code')}
              {step === 'verify' && (t('password_recovery.verify_title') || 'Verify Code')}
              {step === 'reset' && (t('password_recovery.reset_title') || 'Reset Password')}
            </CardTitle>
            <CardDescription>
              {step === 'request' && (t('password_recovery.request_description') || 'We will send a recovery code to your Telegram')}
              {step === 'verify' && (t('password_recovery.verify_description') || 'Enter the 6-digit code you received')}
              {step === 'reset' && (t('password_recovery.reset_description') || 'Choose a strong password')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'request' && (
              <RequestRecoveryForm
                onSubmit={handleRequestRecovery}
                isPending={isPending}
              />
            )}
            {step === 'verify' && (
              <RecoveryCodeForm
                onSubmit={handleVerifyCode}
                isPending={isPending}
                emailOrTelegramId={emailOrTelegramId}
              />
            )}
            {step === 'reset' && (
              <ResetPasswordForm
                onSubmit={handleResetPassword}
                isPending={isPending}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

