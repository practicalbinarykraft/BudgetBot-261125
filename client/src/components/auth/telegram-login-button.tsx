/**
 * Telegram Login Button Component
 *
 * Integrates Telegram Login Widget for OAuth authentication
 * https://core.telegram.org/widgets/login
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

export function TelegramLoginButton() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    // Define callback for Telegram widget
    window.onTelegramAuth = async (user: TelegramUser) => {
      if (isLoadingRef.current) {
        console.log('Already processing Telegram auth, ignoring duplicate call');
        return;
      }

      isLoadingRef.current = true;

      try {
        console.log('Telegram auth callback received:', user);

        const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
          console.log('Telegram login successful:', data);

          toast({
            title: data.isNewUser ? '🎉 Welcome!' : '👋 Welcome back!',
            description: data.isNewUser
              ? 'Your account has been created via Telegram'
              : 'Logged in successfully via Telegram',
          });

          // Redirect to dashboard
          setTimeout(() => {
            setLocation('/app/dashboard');
          }, 500);
        } else {
          console.error('Telegram login failed:', data);

          toast({
            title: '❌ Login failed',
            description: data.error || 'Failed to login via Telegram',
            variant: 'destructive',
          });

          isLoadingRef.current = false;
        }
      } catch (error) {
        console.error('Telegram login error:', error);

        toast({
          title: '❌ Error',
          description: 'An error occurred during Telegram login',
          variant: 'destructive',
        });

        isLoadingRef.current = false;
      }
    };

    // Load Telegram Login Widget script
    if (containerRef.current && !containerRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      // IMPORTANT: Replace with your actual bot username (without @)
      script.setAttribute('data-telegram-login', 'BudgetBuddyAIBot'); // TODO: Update with your bot username!
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '8');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      containerRef.current.appendChild(script);
    }

    // Cleanup
    return () => {
      delete window.onTelegramAuth;
    };
  }, [setLocation, toast]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} className="flex justify-center" />
      <p className="text-xs text-center text-muted-foreground">
        Quick login using Telegram
      </p>
    </div>
  );
}
