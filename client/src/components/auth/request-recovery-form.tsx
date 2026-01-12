/**
 * Request Recovery Form Component
 *
 * Form for requesting a password recovery code
 * User enters email or Telegram ID
 *
 * Junior-Friendly: ~80 lines, clear structure
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useTranslation } from "@/i18n/context";
import { useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

type RequestRecoveryFormData = {
  emailOrTelegramId: string;
};

interface RequestRecoveryFormProps {
  onSubmit: (data: RequestRecoveryFormData) => Promise<void>;
  isPending: boolean;
  success?: boolean;
}

export function RequestRecoveryForm({ onSubmit, isPending, success }: RequestRecoveryFormProps) {
  const { t, language } = useTranslation();
  
  const requestRecoverySchema = useMemo(() => z.object({
    emailOrTelegramId: z.string().min(1, t('password_recovery.email_or_telegram_required') || 'Email or Telegram ID is required'),
  }), [language, t]);

  const form = useForm<RequestRecoveryFormData>({
    resolver: zodResolver(requestRecoverySchema),
    defaultValues: {
      emailOrTelegramId: "",
    },
  });

  if (success) {
    return (
      <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          {t('password_recovery.request_success') || '✅ Recovery code sent to your Telegram!'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="emailOrTelegramId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('password_recovery.email_or_telegram') || 'Email or Telegram ID'}</FormLabel>
              <FormDescription>
                {t('password_recovery.email_or_telegram_description') || 'Enter your email address or Telegram ID'}
              </FormDescription>
              <FormControl>
                <Input
                  type="text"
                  placeholder={t('password_recovery.email_or_telegram_placeholder') || 'email@example.com or 123456789'}
                  data-testid="input-email-telegram-recovery"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
          data-testid="button-request-recovery"
        >
          {isPending 
            ? (t('password_recovery.requesting') || 'Requesting...') 
            : (t('password_recovery.request_code') || 'Request Recovery Code')}
        </Button>
      </form>
    </Form>
  );
}

