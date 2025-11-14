import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SwipeCard } from "./swipe-card";
import { ClassificationDialog } from "./classification-dialog";
import type { Transaction, Category, PersonalTag } from "@shared/schema";

interface SwipeDeckProps {
  transactions: Transaction[];
  categories: Category[];
  tags: PersonalTag[];
  onSwipeComplete: (transactionId: number) => void;
}

type SwipeDirection = 'essential' | 'discretionary' | 'asset' | 'liability';

const SWIPE_THRESHOLD = 150;

export function SwipeDeck({ 
  transactions, 
  categories, 
  tags, 
  onSwipeComplete 
}: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showClassificationDialog, setShowClassificationDialog] = useState(false);
  const [pendingSwipe, setPendingSwipe] = useState<{
    transaction: Transaction;
    financialType: SwipeDirection;
  } | null>(null);

  const updateTransactionMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      financialType: string;
      personalTagId?: number;
      categoryId?: number;
    }) => {
      const res = await fetch(`/api/transactions/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update transaction');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/unsorted'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sorting/stats'] });
    },
  });

  const handleDragEnd = useCallback((event: any, info: any) => {
    const { offset, velocity } = info;
    const swipeX = offset.x;
    const swipeY = offset.y;
    const velocityX = velocity.x;
    const velocityY = velocity.y;

    let direction: SwipeDirection | null = null;

    if (Math.abs(swipeX) > Math.abs(swipeY)) {
      if (swipeX < -SWIPE_THRESHOLD || velocityX < -500) {
        direction = 'essential';
      } else if (swipeX > SWIPE_THRESHOLD || velocityX > 500) {
        direction = 'discretionary';
      }
    } else {
      if (swipeY < -SWIPE_THRESHOLD || velocityY < -500) {
        direction = 'asset';
      } else if (swipeY > SWIPE_THRESHOLD || velocityY > 500) {
        direction = 'liability';
      }
    }

    if (direction && transactions[currentIndex]) {
      setPendingSwipe({
        transaction: transactions[currentIndex],
        financialType: direction,
      });
      setShowClassificationDialog(true);
    }
  }, [currentIndex, transactions]);

  const handleClassificationComplete = useCallback(async (
    personalTagId?: number,
    categoryId?: number
  ) => {
    if (!pendingSwipe) return;

    await updateTransactionMutation.mutateAsync({
      id: pendingSwipe.transaction.id,
      financialType: pendingSwipe.financialType,
      personalTagId,
      categoryId,
    });

    onSwipeComplete(pendingSwipe.transaction.id);
    setCurrentIndex((prev) => prev + 1);
    setShowClassificationDialog(false);
    setPendingSwipe(null);
  }, [pendingSwipe, updateTransactionMutation, onSwipeComplete]);

  const handleSkipClassification = useCallback(async () => {
    if (!pendingSwipe) return;

    await updateTransactionMutation.mutateAsync({
      id: pendingSwipe.transaction.id,
      financialType: pendingSwipe.financialType,
    });

    onSwipeComplete(pendingSwipe.transaction.id);
    setCurrentIndex((prev) => prev + 1);
    setShowClassificationDialog(false);
    setPendingSwipe(null);
  }, [pendingSwipe, updateTransactionMutation, onSwipeComplete]);

  if (currentIndex >= transactions.length) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        No more transactions to sort!
      </div>
    );
  }

  const currentTransaction = transactions[currentIndex];
  const currentCategory = categories.find(c => c.id === currentTransaction.categoryId);
  const currentTag = tags.find(t => t.id === currentTransaction.personalTagId);

  return (
    <>
      <div className="relative h-96 w-full max-w-lg mx-auto" data-testid="swipe-deck">
        {transactions.slice(currentIndex, currentIndex + 3).map((transaction, index) => {
          const category = categories.find(c => c.id === transaction.categoryId);
          const tag = tags.find(t => t.id === transaction.personalTagId);
          const scale = 1 - index * 0.05;
          const yOffset = index * 10;

          return (
            <SwipeCard
              key={transaction.id}
              transaction={transaction}
              category={category}
              tag={tag}
              style={{
                zIndex: transactions.length - index,
                scale,
                transform: `translateY(${yOffset}px)`,
                pointerEvents: index === 0 ? 'auto' : 'none',
              }}
              dragConstraints={index === 0 ? undefined : { left: 0, right: 0, top: 0, bottom: 0 }}
              onDragEnd={index === 0 ? handleDragEnd : undefined}
            />
          );
        })}
      </div>

      <ClassificationDialog
        open={showClassificationDialog}
        onOpenChange={setShowClassificationDialog}
        transaction={pendingSwipe?.transaction}
        financialType={pendingSwipe?.financialType}
        categories={categories}
        tags={tags}
        onComplete={handleClassificationComplete}
        onSkip={handleSkipClassification}
        isLoading={updateTransactionMutation.isPending}
      />
    </>
  );
}
