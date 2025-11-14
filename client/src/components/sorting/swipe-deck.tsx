import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SwipeCard } from "./swipe-card";
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
  const [currentCategoryId, setCurrentCategoryId] = useState<number | null>(null);
  const [currentTagId, setCurrentTagId] = useState<number | null>(null);
  
  const prevLengthRef = useRef(transactions.length);
  
  useEffect(() => {
    const prevLength = prevLengthRef.current;
    const newLength = transactions.length;
    
    if (newLength < prevLength) {
      const delta = prevLength - newLength;
      setCurrentIndex((prev) => Math.max(0, prev - delta));
    } else if (newLength === 0) {
      setCurrentIndex(0);
    }
    
    prevLengthRef.current = newLength;
  }, [transactions.length]);

  const saveTrainingMutation = useMutation({
    mutationFn: async (data: {
      transactionDescription: string;
      transactionAmount?: string;
      merchantName?: string;
      aiSuggestedCategoryId?: number;
      aiSuggestedTagId?: number;
      aiConfidence?: number;
      userChosenCategoryId?: number;
      userChosenTagId?: number;
      userChosenType?: string;
    }) => apiRequest('POST', '/api/ai/training', data),
  });

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
      queryClient.invalidateQueries({ queryKey: ['/api/ai/training-stats'] });
    },
  });

  const handleDragEnd = useCallback(async (event: any, info: any) => {
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
      const transaction = transactions[currentIndex];
      
      await updateTransactionMutation.mutateAsync({
        id: transaction.id,
        financialType: direction,
        personalTagId: currentTagId || undefined,
        categoryId: currentCategoryId || undefined,
      });

      await saveTrainingMutation.mutateAsync({
        transactionDescription: transaction.description,
        transactionAmount: transaction.amount,
        userChosenCategoryId: currentCategoryId || undefined,
        userChosenTagId: currentTagId || undefined,
        userChosenType: direction,
      });

      onSwipeComplete(transaction.id);
      setCurrentIndex((prev) => prev + 1);
      setCurrentCategoryId(null);
      setCurrentTagId(null);
    }
  }, [currentIndex, transactions, currentCategoryId, currentTagId, updateTransactionMutation, saveTrainingMutation, onSwipeComplete]);

  const handleClassificationChange = useCallback((categoryId: number | null, tagId: number | null) => {
    setCurrentCategoryId(categoryId);
    setCurrentTagId(tagId);
  }, []);

  if (currentIndex >= transactions.length || !transactions[currentIndex]) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        No more transactions to sort!
      </div>
    );
  }

  return (
    <div className="relative h-96 w-full max-w-lg mx-auto" data-testid="swipe-deck">
      {transactions.slice(currentIndex, currentIndex + 3).map((transaction, index) => {
        const scale = 1 - index * 0.05;
        const yOffset = index * 10;

        return (
          <SwipeCard
            key={transaction.id}
            transaction={transaction}
            categories={categories}
            tags={tags}
            style={{
              zIndex: transactions.length - index,
              scale,
              transform: `translateY(${yOffset}px)`,
              pointerEvents: index === 0 ? 'auto' : 'none',
            }}
            dragConstraints={index === 0 ? undefined : { left: 0, right: 0, top: 0, bottom: 0 }}
            onDragEnd={index === 0 ? handleDragEnd : undefined}
            onClassificationChange={index === 0 ? handleClassificationChange : undefined}
          />
        );
      })}
    </div>
  );
}
