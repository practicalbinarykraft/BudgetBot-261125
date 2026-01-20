/**
 * PWA Install Prompt Component
 * 
 * FOR JUNIORS: This component shows installation prompts for Android and iOS.
 * It detects the platform and shows appropriate instructions.
 * 
 * Features:
 * - Auto-detects Android/iOS
 * - Shows native install button for Android (beforeinstallprompt event)
 * - Shows manual instructions for iOS (Safari doesn't support beforeinstallprompt)
 * - Hides when app is already installed
 */

'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Listen for beforeinstallprompt event (Android Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if user previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or dismissed
  if (isStandalone || isDismissed) {
    return null;
  }

  // iOS instructions
  const iOSInstructions = (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Для установки на iPhone/iPad:
      </p>
      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
        <li>Нажмите кнопку <span className="font-semibold text-foreground">Поделиться</span> <span className="text-lg">📤</span> внизу экрана</li>
        <li>Прокрутите вниз и выберите <span className="font-semibold text-foreground">«На экран «Домой»</span></li>
        <li>Подтвердите установку</li>
      </ol>
    </div>
  );

  // Android instructions
  const androidInstructions = (
    <div className="space-y-3">
      {deferredPrompt ? (
        <>
          <p className="text-sm text-muted-foreground">
            Нажмите кнопку ниже для установки приложения на главный экран:
          </p>
          <Button onClick={handleInstallClick} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Установить приложение
          </Button>
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Для установки на Android:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
            <li>Откройте меню браузера (три точки в правом верхнем углу)</li>
            <li>Выберите <span className="font-semibold text-foreground">«Установить приложение»</span> или <span className="font-semibold text-foreground">«Добавить на главный экран»</span></li>
            <li>Подтвердите установку</li>
          </ol>
        </div>
      )}
    </div>
  );

  // Desktop/other platforms
  const desktopInstructions = (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Откройте этот сайт на мобильном устройстве (Android или iPhone) для установки приложения.
      </p>
    </div>
  );

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Установите Budget Buddy</CardTitle>
              <CardDescription className="mt-1">
                Добавьте приложение на главный экран для быстрого доступа
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDismiss}
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isIOS && iOSInstructions}
        {isAndroid && androidInstructions}
        {!isIOS && !isAndroid && desktopInstructions}
      </CardContent>
    </Card>
  );
}
