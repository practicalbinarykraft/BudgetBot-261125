import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown,
  Calendar,
  DollarSign
} from "lucide-react";
import { AISuggestionBox } from "./ai-suggestion-box";
import { useAuth } from "@/hooks/use-auth";
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(transaction.categoryId || null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(transaction.personalTagId || null);

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
  const amount = parseFloat(transaction.amount);
  const category = categories.find(c => c.id === selectedCategoryId);
  const tag = tags.find(t => t.id === selectedTagId);

  return (
    <motion.div
      drag
      dragElastic={0.7}
      onDragEnd={onDragEnd}
      whileTap={{ cursor: 'grabbing' }}
      className="absolute inset-0"
      data-testid={`swipe-card-${transaction.id}`}
    >
      <Card className="h-full flex flex-col p-8 bg-card border-2 cursor-grab active:cursor-grabbing select-none">
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">{transaction.description}</h3>
            <div className={`text-4xl font-mono font-bold ${amountColor}`}>
              {amountSign}${Math.abs(amount).toFixed(2)}
            </div>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              <span>{format(parseISO(transaction.date), 'MMM dd, yyyy')}</span>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm">{transaction.currency}</span>
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

        <div className="grid grid-cols-2 gap-4 pt-6 border-t">
          <div className="flex items-center gap-3 justify-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <ArrowLeft className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium">Essential</span>
          </div>
          <div className="flex items-center gap-3 justify-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <ArrowRight className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium">Discretionary</span>
          </div>
          <div className="flex items-center gap-3 justify-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <ArrowUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium">Asset</span>
          </div>
          <div className="flex items-center gap-3 justify-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <ArrowDown className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm font-medium">Liability</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
