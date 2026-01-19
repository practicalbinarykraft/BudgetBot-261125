/**
 * TelegramLinkPrompt Component
 *
 * Dialog that prompts user to link Telegram account for faster login
 * Junior-Friendly: ~60 lines, simple and clear
 */

import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { useTranslation } from '@/i18n/context';
import { useToast } from '@/hooks/use-toast';
import { getTelegramBotUsername } from '@/lib/env';
import type { TelegramUser } from '@shared/types/telegram';

interface TelegramLinkPromptProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  isMiniApp?: boolean; // If true, use initData; if false, use Telegram Login Widget
}

/**
 * Prompt dialog for linking Telegram account
 * 
 * Shows after registration/login to offer Telegram linking
 * for faster future logins
 */
export function TelegramLinkPrompt({
  open,
  onAccept,
  onDecline,
  isMiniApp = false,
}: TelegramLinkPromptProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // For web version: Setup Telegram Login Widget
  useEffect(() => {
    if (!open || isMiniApp) return; // Only for web version

    // Store previous callback to restore it on cleanup (if exists)
    // This prevents conflicts when multiple components use the same callback
    const previousCallback = window.onTelegramLinkAuth;

    // Define callback for Telegram widget
    const linkAuthCallback = async (user: TelegramUser) => {
      if (isLoadingRef.current) {
        console.log('Already processing Telegram link, ignoring duplicate call');
        return;
      }

      isLoadingRef.current = true;
      console.log('Telegram link callback received:', user);

      try {
        const response = await fetch('/api/auth/link-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
          credentials: 'include',
        });

        const result = await response.json();

        if (response.ok) {
          // Save to localStorage
          localStorage.setItem('telegramLinked', 'true');
          
          toast({
            title: t('auth.link_telegram_success') || '✅ Done!',
            description: t('auth.link_telegram_success_description') || 'Next time you can log in automatically',
          });
          
          // Call onAccept to close dialog and redirect
          onAccept();
        } else {
          console.error('Telegram link failed:', result);
          toast({
            title: t('auth.link_telegram_error') || '❌ Error',
            description: result.error || t('auth.link_telegram_error_description') || 'Failed to link Telegram account',
            variant: 'destructive',
          });
          isLoadingRef.current = false;
        }
      } catch (error) {
        console.error('Telegram link error:', error);
        toast({
          title: t('auth.link_telegram_error') || '❌ Error',
          description: t('auth.link_telegram_error_description') || 'Failed to link Telegram account',
          variant: 'destructive',
        });
        isLoadingRef.current = false;
      }
    };

    // Assign callback to window
    window.onTelegramLinkAuth = linkAuthCallback;

    // Load Telegram Login Widget script if not already loaded
    if (widgetContainerRef.current && !widgetContainerRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', getTelegramBotUsername());
      script.setAttribute('data-size', 'medium');
      script.setAttribute('data-radius', '8');
      script.setAttribute('data-onauth', 'onTelegramLinkAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      widgetContainerRef.current.appendChild(script);
    }

    // Cleanup: Restore previous callback or remove if this was the only one
    // This prevents conflicts with other components using the same callback
    // Note: cleanup runs on unmount, not when 'open' changes
    return () => {
      // Only cleanup if this component's callback is still active
      // Check by comparing function reference to prevent removing other component's callback
      if (window.onTelegramLinkAuth === linkAuthCallback) {
        // Restore previous callback if it existed, otherwise delete
        if (previousCallback) {
          window.onTelegramLinkAuth = previousCallback;
        } else {
          delete window.onTelegramLinkAuth;
        }
      }
    };
  }, [open, isMiniApp, onAccept, toast, t]);

  // For Mini App: Direct accept
  const handleAccept = () => {
    if (isMiniApp) {
      onAccept(); // Mini App uses initData, handled by parent
    } else {
      // Web version: Widget will call onAccept via callback
      // Just wait for widget interaction
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDecline()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <DialogTitle>{t('auth.link_telegram_title')}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {t('auth.link_telegram_description')}
          </DialogDescription>
        </DialogHeader>
        
        {/* For web version: Show Telegram Login Widget */}
        {!isMiniApp && (
          <div className="flex justify-center py-4">
            <div ref={widgetContainerRef} className="flex justify-center" />
          </div>
        )}
        
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onDecline}
            className="w-full sm:w-auto"
          >
            {t('auth.link_telegram_later')}
          </Button>
          {isMiniApp && (
            <Button
              onClick={handleAccept}
              className="w-full sm:w-auto"
            >
              {t('auth.link_telegram_accept')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

