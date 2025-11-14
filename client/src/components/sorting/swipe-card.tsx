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
  DollarSign,
  Tag,
  User
} from "lucide-react";
import type { Transaction, Category, PersonalTag } from "@shared/schema";

interface SwipeCardProps {
  transaction: Transaction;
  category?: Category;
  tag?: PersonalTag;
  style?: React.CSSProperties;
  dragConstraints?: any;
  onDragEnd?: (event: any, info: any) => void;
}

export function SwipeCard({
  transaction,
  category,
  tag,
  style,
  dragConstraints,
  onDragEnd,
}: SwipeCardProps) {
  const isExpense = transaction.type === 'expense';
  const amountColor = isExpense ? 'text-red-600' : 'text-green-600';
  const amountSign = isExpense ? '-' : '+';

  return (
    <motion.div
      style={style}
      drag
      dragConstraints={dragConstraints}
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
              {amountSign}${Math.abs(transaction.amount).toFixed(2)}
            </div>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              <span>{format(parseISO(transaction.date), 'MMM dd, yyyy')}</span>
            </div>

            {category && (
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-muted-foreground" />
                <Badge variant="secondary">{category.name}</Badge>
              </div>
            )}

            {tag && (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <Badge variant="outline">{tag.name}</Badge>
              </div>
            )}

            <div className="flex items-center gap-3 text-muted-foreground">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm">{transaction.currency}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 pt-6 border-t">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium">Essential</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-medium">Discretionary</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <ArrowUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium">Asset</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <ArrowDown className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-xs font-medium">Liability</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
