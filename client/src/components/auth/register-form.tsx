import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useTranslation } from "@/i18n/context";
import { useMemo } from "react";

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
};

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void;
  isPending: boolean;
}

export function RegisterForm({ onSubmit, isPending }: RegisterFormProps) {
  const { t, language } = useTranslation();
  
  const registerSchema = useMemo(() => z.object({
    name: z.string().min(1, t('auth.name_required')),
    email: z.string().email(t('auth.invalid_email')),
    password: z.string().min(6, t('auth.password_min_length')),
  }), [language, t]);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.name')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('auth.name_placeholder')}
                  data-testid="input-name-register"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.email')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t('auth.email_placeholder')}
                  data-testid="input-email-register"
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
                  data-testid="input-password-register"
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
          data-testid="button-register"
        >
          {isPending ? `${t('auth.register_button')}...` : t('auth.register_button')}
        </Button>
      </form>
    </Form>
  );
}
