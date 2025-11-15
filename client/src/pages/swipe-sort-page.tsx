import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy, Zap, Flame, Sparkles } from "lucide-react";
import { SwipeDeck } from "@/components/sorting/swipe-deck";
import { TrainingHeader } from "@/components/sorting/training-header";
import { SwipeInstructions } from "@/components/sorting/swipe-instructions";
import type { Transaction, Category, PersonalTag, TrainingStats } from "@shared/schema";

interface SortingStats {
  unsortedCount: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  totalSorted: number;
}

export default function SwipeSortPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [sessionTransactionsSorted, setSessionTransactionsSorted] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);

  const { data: stats, isLoading: statsLoading } = useQuery<SortingStats>({
    queryKey: ['/api/sorting/stats'],
    enabled: !!user,
  });

  const { data: unsortedData, isLoading: transactionsLoading } = useQuery<{ count: number; transactions: Transaction[] }>({
    queryKey: ['/api/analytics/unsorted'],
    enabled: !!user,
  });
  
  const unsortedTransactions = unsortedData?.transactions ?? [];

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    enabled: !!user,
  });

  const { data: tags } = useQuery<PersonalTag[]>({
    queryKey: ['/api/tags'],
    enabled: !!user,
  });

  const { data: trainingStats } = useQuery<TrainingStats>({
    queryKey: ['/api/ai/training-stats'],
    enabled: !!user,
  });

  const saveSortingSessionMutation = useMutation({
    mutationFn: async (transactionsSorted: number) => {
      const res = await fetch('/api/sorting/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionsSorted }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to save sorting session');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sorting/stats'] });
    },
  });

  const handleSwipeComplete = useCallback((transactionId: number) => {
    setSessionTransactionsSorted((prev) => {
      const nextCount = prev + 1;
      
      if (nextCount % 5 === 0) {
        saveSortingSessionMutation.mutate(nextCount);
      }
      
      return nextCount;
    });
    
    setSessionPoints((prev) => prev + 10);
  }, [saveSortingSessionMutation]);

  const handleFinishSession = useCallback(async () => {
    if (sessionTransactionsSorted > 0) {
      await saveSortingSessionMutation.mutateAsync(sessionTransactionsSorted);
    }
    setLocation('/transactions');
  }, [sessionTransactionsSorted, saveSortingSessionMutation, setLocation]);

  if (statsLoading || transactionsLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setLocation('/transactions')} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card className="p-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </Card>
      </div>
    );
  }

  if (!unsortedTransactions || unsortedTransactions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setLocation('/transactions')} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card className="p-12 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-semibold mb-2">All Sorted!</h2>
          <p className="text-muted-foreground mb-6">
            No unsorted transactions remaining. Great job!
          </p>
          <Button onClick={() => setLocation('/transactions')} data-testid="button-done">
            Back to Transactions
          </Button>
        </Card>
      </div>
    );
  }

  const totalUnsorted = stats?.unsortedCount ?? 0;
  const progressPercent = totalUnsorted > 0 
    ? Math.round(((totalUnsorted - unsortedTransactions.length) / totalUnsorted) * 100)
    : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={handleFinishSession} data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Finish
        </Button>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2" data-testid="text-session-points">
            <Zap className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold">+{sessionPoints}</span>
          </div>
          <div className="flex items-center gap-2" data-testid="text-current-streak">
            <Flame className="w-5 h-5 text-orange-600" />
            <span className="font-semibold">{stats?.currentStreak ?? 0}</span>
          </div>
        </div>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {unsortedTransactions.length} remaining
          </span>
          <span className="text-sm text-muted-foreground">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" data-testid="progress-sorting" />
      </Card>

      {trainingStats && trainingStats.totalExamples < 10 && (
        <Card className="p-4 mb-6 bg-primary/10 border-primary/20" data-testid="onboarding-hint">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Train Your AI Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Classify transactions to teach your AI. After {10 - trainingStats.totalExamples} more examples, 
                it will start predicting categories and tags automatically!
              </p>
            </div>
          </div>
        </Card>
      )}

      <SwipeInstructions />

      <TrainingHeader />

      <SwipeDeck
        transactions={unsortedTransactions}
        categories={categories ?? []}
        tags={tags ?? []}
        onSwipeComplete={handleSwipeComplete}
      />
    </div>
  );
}
