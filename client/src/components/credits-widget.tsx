/**
 * Credits Widget Component
 *
 * Displays user's credit balance in header with billing mode indicator
 * Click to navigate to billing page
 */

import { useQuery } from '@tanstack/react-query';
import { Coins, Sparkles, Key, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'wouter';

interface CreditsData {
  messagesRemaining: number;
  totalGranted: number;
  totalUsed: number;
  billingMode: 'free' | 'byok' | 'paid';
  hasByok: boolean;
}

export function CreditsWidget() {
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<CreditsData>({
    queryKey: ['/api/credits'],
    queryFn: async () => {
      const res = await fetch('/api/credits', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch credits: ${res.status}`);
      }
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleClick = () => {
    setLocation('/app/billing');
  };

  // Показываем skeleton при ошибке или отсутствии данных
  if (error) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Кредиты:</span>
        <div className="flex items-center gap-2 px-3 py-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Кредиты:</span>
        <div className="flex items-center gap-2 px-3 py-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    );
  }

  // BYOK mode - show unlimited badge
  if (data.billingMode === 'byok') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Кредиты:</span>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          onClick={handleClick}
        >
          <Key className="h-4 w-4" />
          <span className="hidden sm:inline">BYOK Mode</span>
          <span className="sm:hidden">∞</span>
        </Button>
      </div>
    );
  }

  // Credits mode
  const isLow = data.messagesRemaining < 5;
  const isVeryLow = data.messagesRemaining === 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Кредиты:</span>
      <Button
        variant="ghost"
        size="sm"
        className={`flex items-center gap-2 text-sm font-medium ${
          isVeryLow
            ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
            : isLow
            ? 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300'
            : 'text-primary hover:text-primary/80'
        }`}
        onClick={handleClick}
      >
        <Coins className="h-4 w-4" />
        <span className="hidden sm:inline">
          {data.messagesRemaining} {data.messagesRemaining === 1 ? 'credit' : 'credits'}
        </span>
        <span className="sm:hidden">{data.messagesRemaining}</span>
        {data.billingMode === 'free' && (
          <span className="hidden md:inline text-xs text-muted-foreground">• Free</span>
        )}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </Button>
    </div>
  );
}
