/**
 * Recovery Code Form Component
 *
 * Form for entering 6-digit recovery code
 * Validates code format and sends to backend
 *
 * Junior-Friendly: ~90 lines, clear validation
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useTranslation } from "@/i18n/context";
import { useMemo } from "react";

type RecoveryCodeFormData = {
  code: string;
};

interface RecoveryCodeFormProps {
  onSubmit: (data: RecoveryCodeFormData) => Promise<void>;
  isPending: boolean;
  emailOrTelegramId: string;
}

export function RecoveryCodeForm({ onSubmit, isPending, emailOrTelegramId }: RecoveryCodeFormProps) {
  const { t, language } = useTranslation();
  
  const recoveryCodeSchema = useMemo(() => z.object({
    code: z
      .string()
      .length(6, t('password_recovery.code_length') || 'Code must be exactly 6 digits')
      .regex(/^\d+$/, t('password_recovery.code_numeric') || 'Code must contain only numbers'),
  }), [language, t]);

  const form = useForm<RecoveryCodeFormData>({
    resolver: zodResolver(recoveryCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  // Auto-format: only allow digits, max 6 characters
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    form.setValue('code', value, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('password_recovery.enter_code') || 'Recovery Code'}</FormLabel>
              <FormDescription>
                {t('password_recovery.code_description') || 'Enter the 6-digit code sent to your Telegram'}
              </FormDescription>
              <FormControl>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  data-testid="input-recovery-code"
                  {...field}
                  onChange={handleCodeChange}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isPending || form.watch('code').length !== 6}
          data-testid="button-verify-code"
        >
          {isPending 
            ? (t('password_recovery.verifying') || 'Verifying...') 
            : (t('password_recovery.verify_code') || 'Verify Code')}
        </Button>
      </form>
    </Form>
  );
}

