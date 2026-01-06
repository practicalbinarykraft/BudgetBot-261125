import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/i18n/context";
import { LanguageToggle } from "@/components/language-toggle";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { TelegramLoginButton } from "@/components/auth/telegram-login-button";
import { TelegramLinkPrompt } from "@/components/auth/telegram-link-prompt";
import { useTelegramMiniApp } from "@/hooks/use-telegram-miniapp";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Wallet, TrendingUp, Bot, Camera, DollarSign } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isMiniApp, initData, telegramUser } = useTelegramMiniApp();
  
  const [activeTab, setActiveTab] = useState("login");
  const [showLinkPrompt, setShowLinkPrompt] = useState(false);
  const [pendingTelegramId, setPendingTelegramId] = useState<string | null>(null);
  const [isCheckingMiniApp, setIsCheckingMiniApp] = useState(false);

  // Handle Mini App authentication on mount
  useEffect(() => {
    if (isMiniApp && initData && !user && !isCheckingMiniApp) {
      handleMiniAppAuth();
    }
  }, [isMiniApp, initData, user, isCheckingMiniApp]);

  async function handleMiniAppAuth() {
    if (!initData) return;
    
    setIsCheckingMiniApp(true);
    
    try {
      const response = await fetch('/api/telegram/webapp-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.autoLogin) {
        // Scenario 2: Auto-login (telegram_id already linked)
        window.location.href = '/app/dashboard';
      } else if (data.requiresRegistration) {
        // Scenario 1: Show registration form
        setActiveTab('register');
        setPendingTelegramId(data.telegramId);
      } else if (data.requiresEmail) {
        // User exists but missing email - show email form
        toast({
          title: 'Требуется email',
          description: 'Пожалуйста, добавьте email к вашему аккаунту',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Mini App auth error:', error);
      toast({
        title: 'Ошибка авторизации',
        description: 'Не удалось авторизоваться через Telegram',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingMiniApp(false);
    }
  }

  const onLogin = async (data: { email: string; password: string }) => {
    try {
      const user = await loginMutation.mutateAsync(data);
      
      // After successful login, offer Telegram linking if in Mini App
      if (isMiniApp && initData && !user.telegramId) {
        setPendingTelegramId(telegramUser?.id?.toString() || null);
        setShowLinkPrompt(true);
      } else {
        setLocation('/app/dashboard');
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const onRegister = async (data: { name: string; email: string; password: string }) => {
    try {
      // If in Mini App, include telegram data
      const registerData = isMiniApp && pendingTelegramId
        ? { ...data, telegramId: pendingTelegramId, telegramData: telegramUser }
        : data;

      const response = await fetch('/api/auth/register-miniapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const result = await response.json();
      
      // Update user in query cache
      queryClient.setQueryData(['/api/user'], result.user);

      // Offer Telegram linking if telegramId was provided
      if (result.shouldOfferTelegramLink && result.telegramId) {
        setPendingTelegramId(result.telegramId);
        setShowLinkPrompt(true);
      } else {
        setLocation('/app/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка регистрации',
        description: error.message || 'Не удалось зарегистрироваться',
        variant: 'destructive',
      });
    }
  };

  async function handleLinkTelegram() {
    if (!initData || !pendingTelegramId) {
      setShowLinkPrompt(false);
      setLocation('/app/dashboard');
      return;
    }

    try {
      const response = await fetch('/api/auth/link-telegram-miniapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: pendingTelegramId,
          initData,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to link Telegram');
      }

      // Save to localStorage
      localStorage.setItem('telegramLinked', 'true');

      toast({
        title: '✅ Готово!',
        description: 'В следующий раз вход будет автоматическим',
      });

      setShowLinkPrompt(false);
      setLocation('/app/dashboard');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось связать Telegram аккаунт',
        variant: 'destructive',
      });
      setShowLinkPrompt(false);
      setLocation('/app/dashboard');
    }
  }

  function handleDeclineLink() {
    localStorage.setItem('telegramLinkPrompted', 'true');
    setShowLinkPrompt(false);
    setLocation('/app/dashboard');
  }

  if (user) {
    return <Redirect to="/" />;
  }

  if (isCheckingMiniApp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 bg-background relative">
        <div className="absolute top-4 right-4">
          <LanguageToggle />
        </div>
        
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Wallet className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">{t('auth.app_title')}</h1>
            </div>
            <p className="text-muted-foreground">{t('auth.app_description')}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">{t('auth.login')}</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">{t('auth.register')}</TabsTrigger>
            </TabsList>

            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "login" ? t('auth.welcome_back') : t('auth.create_account')}
                </CardTitle>
                <CardDescription>
                  {activeTab === "login" 
                    ? t('auth.login_description')
                    : t('auth.register_description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TabsContent value="login" className="mt-0 space-y-4" key={`login-${language}`}>
                  <LoginForm
                    onSubmit={onLogin}
                    isPending={loginMutation.isPending}
                  />

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t('auth.or_continue_with')}
                      </span>
                    </div>
                  </div>

                  {/* Telegram Login */}
                  <TelegramLoginButton />
                </TabsContent>

                <TabsContent value="register" className="mt-0 space-y-4" key={`register-${language}`}>
                  <RegisterForm
                    onSubmit={onRegister}
                    isPending={registerMutation.isPending}
                  />

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t('auth.or_continue_with')}
                      </span>
                    </div>
                  </div>

                  {/* Telegram Login */}
                  <TelegramLoginButton />
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center p-8 bg-primary text-primary-foreground">
        <div className="max-w-md space-y-6">
          <h2 className="text-3xl font-bold">{t('auth.hero_title')}</h2>
          <p className="text-lg opacity-90">{t('auth.hero_subtitle')}</p>
          <ul className="space-y-4 text-base">
            <li className="flex items-start gap-3">
              <TrendingUp className="h-6 w-6 mt-0.5 flex-shrink-0" />
              <span>{t('auth.feature_tracking')}</span>
            </li>
            <li className="flex items-start gap-3">
              <Bot className="h-6 w-6 mt-0.5 flex-shrink-0" />
              <span>{t('auth.feature_ai')}</span>
            </li>
            <li className="flex items-start gap-3">
              <DollarSign className="h-6 w-6 mt-0.5 flex-shrink-0" />
              <span>{t('auth.feature_goals')}</span>
            </li>
            <li className="flex items-start gap-3">
              <Camera className="h-6 w-6 mt-0.5 flex-shrink-0" />
              <span>{t('auth.feature_secure')}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Telegram Link Prompt */}
      {showLinkPrompt && (
        <TelegramLinkPrompt
          open={showLinkPrompt}
          onAccept={handleLinkTelegram}
          onDecline={handleDeclineLink}
        />
      )}
    </div>
  );
}
