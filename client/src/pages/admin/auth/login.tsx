/**
 * Admin Login Page
 *
 * Login page for admin panel
 * Junior-Friendly: Simple form, clear validation
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "@/i18n/context";

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const requestBody = { email, password };
      
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        credentials: 'include',
      });

      if (!response.ok) {
        // Если ответ не OK, парсим ошибку
        const errorData = await response.json().catch(() => ({ error: t('admin.auth.login.error.unknown') }));
        if (response.status === 400) {
          setError(errorData.error || t('admin.auth.login.error.validation'));
        } else if (response.status === 401) {
          setError(t('admin.auth.login.error.invalid_credentials'));
        } else if (response.status === 403) {
          setError(t('admin.auth.login.error.access_denied'));
        } else {
          setError(errorData.error || t('admin.auth.login.error.network', { status: response.status }));
        }
        return;
      }

      const admin = await response.json();
      
      // Успешный вход - редирект на dashboard
      // Небольшая задержка, чтобы сессия точно установилась
      setTimeout(() => {
        setLocation("/admin/dashboard");
      }, 100);
    } catch (err: unknown) {
      // Обработка ошибок
      if (import.meta.env.DEV) {
        console.error('Login error:', err);
      }
      if (err instanceof Error) {
        const statusMatch = err.message.match(/^(\d+):/);
        if (statusMatch) {
          const status = parseInt(statusMatch[1], 10);
          if (status === 400) {
            setError(t('admin.auth.login.error.validation'));
          } else if (status === 401) {
            setError(t('admin.auth.login.error.invalid_credentials'));
          } else if (status === 403) {
            setError(t('admin.auth.login.error.access_denied'));
          } else {
            setError(t('admin.auth.login.error.network', { status }));
          }
        } else {
          setError(err.message || t('admin.auth.login.error.generic'));
        }
      } else {
        setError(t('admin.auth.login.error.unknown'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t('admin.auth.login.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('admin.auth.login.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('admin.auth.login.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('admin.auth.login.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('admin.auth.login.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('admin.auth.login.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t('admin.auth.login.submitting') : t('admin.auth.login.submit')}
            </Button>

            {import.meta.env.MODE === 'development' && (
              <div className="text-xs text-center text-gray-500 mt-4">
                <p>{t('admin.auth.login.demo_credentials')}</p>
                <p>admin@budgetbot.app / admin123</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

