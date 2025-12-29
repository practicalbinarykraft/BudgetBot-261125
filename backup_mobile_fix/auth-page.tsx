import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/i18n/context";
import { LanguageToggle } from "@/components/language-toggle";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { Wallet, TrendingUp, Bot, Camera, DollarSign } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState("login");

  const onLogin = (data: { email: string; password: string }) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: { name: string; email: string; password: string }) => {
    registerMutation.mutate(data);
  };

  useEffect(() => {
    if (user) {
      return;
    }
  }, [user]);

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-4 sm:p-8 bg-background relative">
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
                <TabsContent value="login" className="mt-0" key={`login-${language}`}>
                  <LoginForm 
                    onSubmit={onLogin} 
                    isPending={loginMutation.isPending} 
                  />
                </TabsContent>

                <TabsContent value="register" className="mt-0" key={`register-${language}`}>
                  <RegisterForm 
                    onSubmit={onRegister} 
                    isPending={registerMutation.isPending} 
                  />
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
    </div>
  );
}
