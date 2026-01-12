/**
 * Add Email Form Component
 *
 * Form for adding email to existing Telegram-only account
 * Used when user exists but missing email/password
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

type AddEmailFormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

interface AddEmailFormProps {
  onSubmit: (data: AddEmailFormData) => Promise<void>;
  isPending: boolean;
}

export function AddEmailForm({ onSubmit, isPending }: AddEmailFormProps) {
  const { t, language } = useTranslation();
  
  const addEmailSchema = useMemo(() => z.object({
    email: z.string().email(t('auth.invalid_email')),
    password: z.string().min(8, t('auth.password_min_length') || 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('password_recovery.passwords_not_match') || 'Passwords do not match',
    path: ['confirmPassword'],
  }), [language, t]);

  const form = useForm<AddEmailFormData>({
    resolver: zodResolver(addEmailSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.email')}</FormLabel>
              <FormDescription>
                {t('auth.add_email_description') || 'Add email to your account for password recovery'}
              </FormDescription>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t('auth.email_placeholder')}
                  data-testid="input-email-add"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.password')}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t('auth.password_placeholder')}
                  data-testid="input-password-add"
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
                  placeholder={t('password_recovery.confirm_password_placeholder') || 'Confirm password'}
                  data-testid="input-confirm-password-add"
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
          data-testid="button-add-email"
        >
          {isPending 
            ? (t('auth.adding_email') || 'Adding...') 
            : (t('auth.add_email_button') || 'Add Email')}
        </Button>
      </form>
    </Form>
  );
}

