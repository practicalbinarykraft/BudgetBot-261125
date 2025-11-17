import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { motion, useAnimation } from "framer-motion";
import { Calendar } from "lucide-react";
import { AISuggestionBox } from "./ai-suggestion-box";
import { useAuth } from "@/hooks/use-auth";
import { formatTransactionAmount } from "@/lib/currency-utils";
import type { Transaction, Category, PersonalTag } from "@shared/schema";

interface AIPrediction {
  categoryId: number | null;
  tagId: number | null;
  confidence: number;
}

interface SwipeCardProps {
  transaction: Transaction;
  categories: Category[];
  tags: PersonalTag[];
  onDragEnd?: (event: any, info: any) => void;
  onClassificationChange?: (categoryId: number | null, tagId: number | null) => void;
}

export function SwipeCard({
  transaction,
  categories,
  tags,
  onDragEnd,
  onClassificationChange,
}: SwipeCardProps) {
  const { user } = useAuth();
  const controls = useAnimation();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(transaction.categoryId || null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(transaction.personalTagId || null);

  useEffect(() => {
    controls.set({ x: 0, y: 0 });
  }, [transaction.id, controls]);

  const { data: prediction } = useQuery<AIPrediction>({
    queryKey: ['/api/ai/predict', transaction.id],
    enabled: !!user,
  });

  useEffect(() => {
    if (prediction && !transaction.categoryId) {
      setSelectedCategoryId(prediction.categoryId);
    }
    if (prediction && !transaction.personalTagId) {
      setSelectedTagId(prediction.tagId);
    }
  }, [prediction, transaction.categoryId, transaction.personalTagId]);

  useEffect(() => {
    onClassificationChange?.(selectedCategoryId, selectedTagId);
  }, [selectedCategoryId, selectedTagId, onClassificationChange]);

  const isExpense = transaction.type === 'expense';
  const amountColor = isExpense ? 'text-red-600' : 'text-green-600';
  const amountSign = isExpense ? '-' : '+';
  const currencyDisplay = formatTransactionAmount(transaction);
  const category = categories.find(c => c.id === selectedCategoryId);
  const tag = tags.find(t => t.id === selectedTagId);

  const handleDragEnd = async (event: any, info: any) => {
    const { offset } = info;
    const swipeX = Math.abs(offset.x);
    const swipeY = Math.abs(offset.y);
    
    if (swipeX > 150 || swipeY > 150) {
      await controls.start({ 
        x: offset.x * 2, 
        y: offset.y * 2,
        transition: { type: "spring", stiffness: 300, damping: 30 }
      });
      onDragEnd?.(event, info);
    } else {
      await controls.start({ 
        x: 0, 
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 30 }
      });
    }
  };

  return (
    <motion.div
      drag
      dragElastic={0.7}
      dragMomentum={false}
      animate={controls}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
      className="absolute inset-0"
      data-testid={`swipe-card-${transaction.id}`}
    >
      <Card className="h-full flex flex-col p-8 bg-card border-2 cursor-grab active:cursor-grabbing select-none">
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold" data-testid={`card-description-${transaction.id}`}>
              {transaction.description}
            </h3>
            <div className="space-y-1">
              <div 
                className={`text-4xl font-mono font-bold ${amountColor}`}
                data-testid={`card-amount-${transaction.id}`}
              >
                {amountSign}{currencyDisplay.mainSymbol}{currencyDisplay.mainAmount}
              </div>
              {currencyDisplay.showConversion && currencyDisplay.convertedAmount && (
                <div className="text-sm text-muted-foreground" data-testid={`card-converted-${transaction.id}`}>
                  ≈ ${currencyDisplay.convertedAmount} USD
                  {transaction.exchangeRate && (() => {
                    const rateValue = transaction.exchangeRate;
                    if (rateValue == null) return null;
                    const rate = Number(rateValue);
                    return Number.isFinite(rate) && rate !== 0 ? (
                      <span className="ml-2">
                        (курс: 1 {currencyDisplay.mainSymbol} = ${rate.toFixed(4)})
                      </span>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              <span>{format(parseISO(transaction.date), 'MMM dd, yyyy')}</span>
            </div>

            {prediction && (
              <AISuggestionBox
                categoryId={selectedCategoryId}
                tagId={selectedTagId}
                confidence={prediction.confidence}
                categories={categories}
                tags={tags}
                onCategoryChange={setSelectedCategoryId}
                onTagChange={setSelectedTagId}
              />
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
