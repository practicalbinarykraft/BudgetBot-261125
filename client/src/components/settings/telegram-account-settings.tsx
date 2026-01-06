/**
 * Telegram Account Settings Component
 *
 * Allows users to link/unlink their Telegram account
 */

import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

interface User {
  id: number;
  email: string | null;
  name: string;
  telegramId: string | null;
  telegramUsername: string | null;
}

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
    onTelegramLinkAuth?: (user: TelegramUser) => void;
  }
}

export function TelegramAccountSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const linkMutation = useMutation({
    mutationFn: async (telegramData: TelegramUser) => {
      const response = await fetch('/api/auth/link-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link Telegram');
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: '✅ Telegram linked!',
        description: 'Your Telegram account has been successfully linked',
      });

      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      isLoadingRef.current = false;
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Failed to link Telegram',
        description: error.message,
        variant: 'destructive',
      });

      isLoadingRef.current = false;
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/unlink-telegram', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlink Telegram');
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: '✅ Telegram unlinked',
        description: 'Your Telegram account has been unlinked',
      });

      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Failed to unlink Telegram',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    // Define callback for Telegram widget (for linking)
    window.onTelegramLinkAuth = async (telegramUser: TelegramUser) => {
      if (isLoadingRef.current) {
        console.log('Already processing Telegram link, ignoring duplicate call');
        return;
      }

      isLoadingRef.current = true;
      console.log('Telegram link callback received:', telegramUser);

      linkMutation.mutate(telegramUser);
    };

    // Load Telegram Login Widget script if not linked
    if (!user?.telegramId && containerRef.current && !containerRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      // IMPORTANT: Replace with your actual bot username (without @)
      script.setAttribute('data-telegram-login', 'BudgetBuddyAIBot'); // TODO: Update with your bot username!
      script.setAttribute('data-size', 'medium');
      script.setAttribute('data-radius', '8');
      script.setAttribute('data-onauth', 'onTelegramLinkAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      containerRef.current.appendChild(script);
    }

    // Cleanup
    return () => {
      delete window.onTelegramLinkAuth;
    };
  }, [user?.telegramId, linkMutation]);

  const handleUnlink = () => {
    if (!user?.email) {
      toast({
        title: '⚠️ Cannot unlink',
        description: 'You must add email and password first before unlinking Telegram',
        variant: 'destructive',
      });
      return;
    }

    if (confirm('Are you sure you want to unlink your Telegram account?')) {
      unlinkMutation.mutate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-500" />
          Telegram Account
        </CardTitle>
        <CardDescription>
          Link your Telegram account for quick login and bot integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        {user?.telegramId ? (
          // Telegram is linked
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-600">✓ Connected</Badge>
                  {user.telegramUsername && (
                    <span className="text-sm text-muted-foreground">
                      @{user.telegramUsername}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  You can login using Telegram on the auth page
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleUnlink}
                disabled={!user.email || unlinkMutation.isPending}
              >
                {unlinkMutation.isPending ? 'Unlinking...' : 'Unlink'}
              </Button>
            </div>

            <Separator />

            <div className="text-sm space-y-2">
              <h4 className="font-medium">Benefits:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Quick login without password</li>
                <li>Seamless integration with Telegram bot</li>
                <li>Sync data between web and bot</li>
              </ul>
            </div>

            {!user.email && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  ⚠️ You cannot unlink Telegram without adding email and password first
                </p>
              </div>
            )}
          </div>
        ) : (
          // Telegram is NOT linked
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Link your Telegram account to enable:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>One-click login</li>
                <li>Telegram bot integration</li>
                <li>Data synchronization</li>
              </ul>
            </div>

            <Separator />

            <div className="flex flex-col items-start gap-3">
              <p className="text-sm font-medium">Click to connect:</p>
              <div ref={containerRef} className="w-full flex justify-start" />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 After linking, you'll be able to login with just one click using Telegram
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
