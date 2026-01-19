import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/i18n/context";
import { LanguageToggle } from "@/components/language-toggle";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { TelegramLoginButton } from "@/components/auth/telegram-login-button";
import { TelegramLinkPrompt } from "@/components/auth/telegram-link-prompt";
import { AddEmailForm } from "@/components/auth/add-email-form";
import { useTelegramMiniApp } from "@/hooks/use-telegram-miniapp";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { queryClient } from "@/lib/queryClient";
import { Wallet, TrendingUp, Bot, Camera, DollarSign } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const { isMiniApp, initData, telegramUser } = useTelegramMiniApp();
  
  const [activeTab, setActiveTab] = useState("login");
  const [showLinkPrompt, setShowLinkPrompt] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [pendingTelegramId, setPendingTelegramId] = useState<string | null>(null);
  const [isCheckingMiniApp, setIsCheckingMiniApp] = useState(false);
  const [linkPromptCount, setLinkPromptCount] = useState(0);
  const [isAddingEmail, setIsAddingEmail] = useState(false);

  // Load prompt decline count from localStorage on mount
  useEffect(() => {
    const count = parseInt(localStorage.getItem('telegramLinkDeclined') || '0', 10);
    setLinkPromptCount(count);
  }, []);

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
        setShowEmailForm(true);
        setPendingTelegramId(data.telegramId || null);
      }
    } catch (error) {
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
      
      // Увеличиваем задержку, чтобы сессия успела установиться
      // invalidateQueries в use-auth.tsx также имеет задержку 200ms
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // After successful login, offer Telegram linking
      // Show in Mini App if initData available, or in web (always available via widget)
      // Only show if user hasn't declined 3+ times and hasn't dismissed permanently
      const shouldShow = 
        !user.telegramId &&
        linkPromptCount < 3 &&
        !localStorage.getItem('telegramLinkDismissed');
      
      if (shouldShow) {
        // In Mini App, use initData; in web, will use Telegram Login Widget
        if (isMiniApp && initData) {
          setPendingTelegramId(telegramUser?.id?.toString() || null);
        } else {
          // For web, we'll use Telegram Login Widget in the prompt
          setPendingTelegramId(null); // Will be set when user clicks widget
        }
        setShowLinkPrompt(true);
      } else {
        // Redirect to dashboard-v2 on mobile devices, otherwise to dashboard
        const dashboardPath = isMobile ? '/app/dashboard-v2' : '/app/dashboard';
        setLocation(dashboardPath);
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
      // Only show if user hasn't declined 3+ times and hasn't dismissed permanently
      const shouldShow = 
        result.shouldOfferTelegramLink && 
        result.telegramId &&
        linkPromptCount < 3 &&
        !localStorage.getItem('telegramLinkDismissed');
      
      if (shouldShow) {
        setPendingTelegramId(result.telegramId);
        setShowLinkPrompt(true);
      } else {
        // Redirect to dashboard-v2 on mobile devices, otherwise to dashboard
        const dashboardPath = isMobile ? '/app/dashboard-v2' : '/app/dashboard';
        setLocation(dashboardPath);
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
    // For Mini App: use initData
    if (isMiniApp && initData && pendingTelegramId) {
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
          title: t('auth.link_telegram_success') || '✅ Готово!',
          description: t('auth.link_telegram_success_description') || 'В следующий раз вход будет автоматическим',
        });

        setShowLinkPrompt(false);
        setLocation('/app/dashboard');
      } catch (error) {
        toast({
          title: t('auth.link_telegram_error') || 'Ошибка',
          description: t('auth.link_telegram_error_description') || 'Не удалось связать Telegram аккаунт',
          variant: 'destructive',
        });
        setShowLinkPrompt(false);
        setLocation('/app/dashboard');
      }
    } else {
      // For web: Telegram Login Widget will handle linking via callback in TelegramLinkPrompt
      // This function is called by widget callback after successful linking
      // Just close and redirect
      setShowLinkPrompt(false);
      setLocation('/app/dashboard');
    }
  }

  function handleDeclineLink() {
    // Increment decline count
    const newCount = linkPromptCount + 1;
    localStorage.setItem('telegramLinkDeclined', newCount.toString());
    setLinkPromptCount(newCount);
    
    // If declined 3+ times, mark as permanently dismissed
    if (newCount >= 3) {
      localStorage.setItem('telegramLinkDismissed', 'true');
    }
    
    setShowLinkPrompt(false);
    setLocation('/app/dashboard');
  }

  async function handleAddEmail(data: { email: string; password: string; confirmPassword: string }) {
    setIsAddingEmail(true);
    try {
      const response = await fetch('/api/auth/add-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          telegramId: pendingTelegramId || telegramUser?.id?.toString(),
          initData: isMiniApp ? initData : undefined, // Only send initData in Mini App
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add email');
      }

      const result = await response.json();
      
      // Update user in query cache
      queryClient.setQueryData(['/api/user'], result.user);

      toast({
        title: t('auth.email_added_success') || '✅ Email added!',
        description: t('auth.email_added_description') || 'Your account is now more secure',
      });

      setShowEmailForm(false);
      
      // After adding email, offer Telegram linking if available
      if (isMiniApp && initData && pendingTelegramId) {
        setShowLinkPrompt(true);
      } else {
        // Redirect to dashboard-v2 on mobile devices, otherwise to dashboard
        const dashboardPath = isMobile ? '/app/dashboard-v2' : '/app/dashboard';
        setLocation(dashboardPath);
      }
    } catch (error: any) {
      toast({
        title: t('auth.email_add_error') || '❌ Error',
        description: error.message || 'Failed to add email',
        variant: 'destructive',
      });
    } finally {
      setIsAddingEmail(false);
    }
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
          isMiniApp={isMiniApp}
        />
      )}

      {/* Add Email Form Dialog */}
      {showEmailForm && (
        <Dialog open={showEmailForm} onOpenChange={(isOpen) => !isOpen && setShowEmailForm(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('auth.add_email_title') || 'Add Email to Account'}</DialogTitle>
              <DialogDescription>
                {t('auth.add_email_dialog_description') || 'Please add an email address and password to your account for better security and password recovery.'}
              </DialogDescription>
            </DialogHeader>
            <AddEmailForm
              onSubmit={handleAddEmail}
              isPending={isAddingEmail}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
