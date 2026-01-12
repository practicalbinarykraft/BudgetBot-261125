/**
 * Reset Password Form Component
 *
 * Form for setting new password after code verification
 * Includes password confirmation validation
 *
 * Junior-Friendly: ~100 lines, clear validation
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useTranslation } from "@/i18n/context";
import { useMemo } from "react";

type ResetPasswordFormData = {
  newPassword: string;
  confirmPassword: string;
};

interface ResetPasswordFormProps {
  onSubmit: (data: ResetPasswordFormData) => Promise<void>;
  isPending: boolean;
}

export function ResetPasswordForm({ onSubmit, isPending }: ResetPasswordFormProps) {
  const { t, language } = useTranslation();
  
  const resetPasswordSchema = useMemo(() => z.object({
    newPassword: z
      .string()
      .min(8, t('password_recovery.password_min_length') || 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('password_recovery.passwords_not_match') || 'Passwords do not match',
    path: ['confirmPassword'],
  }), [language, t]);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('password_recovery.new_password') || 'New Password'}</FormLabel>
              <FormDescription>
                {t('password_recovery.password_requirements') || 'At least 8 characters'}
              </FormDescription>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t('password_recovery.new_password_placeholder') || 'Enter new password'}
                  data-testid="input-new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('password_recovery.confirm_password') || 'Confirm Password'}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t('password_recovery.confirm_password_placeholder') || 'Confirm new password'}
                  data-testid="input-confirm-password"
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
          data-testid="button-reset-password"
        >
          {isPending 
            ? (t('password_recovery.resetting') || 'Resetting...') 
            : (t('password_recovery.reset_password') || 'Reset Password')}
        </Button>
      </form>
    </Form>
  );
}

