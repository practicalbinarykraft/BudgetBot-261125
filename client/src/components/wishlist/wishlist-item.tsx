import { WishlistItemWithPrediction } from "@/types/goal-prediction";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Check, Calendar } from "lucide-react";
import { GoalPredictionCard } from "@/components/wishlist/goal-prediction-card";
import { format, parseISO } from "date-fns";

interface WishlistItemProps {
  item: WishlistItemWithPrediction;
  onDelete: (id: number) => void;
  onTogglePurchased: (id: number) => void;
  onSchedule: (id: number) => void;
}

const priorityColors = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

export function WishlistItem({ item, onDelete, onTogglePurchased, onSchedule }: WishlistItemProps) {
  return (
    <Card className="hover-elevate" data-testid={`wishlist-${item.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-lg">{item.name}</h3>
            <p className="text-2xl font-mono font-bold mt-2">${item.amount}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onTogglePurchased(item.id)}
            data-testid={`button-toggle-purchased-${item.id}`}
          >
            <Check className={item.isPurchased ? "text-green-600" : "text-muted-foreground"} />
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className={`w-2 h-2 rounded-full ${priorityColors[item.priority as keyof typeof priorityColors]}`} />
          <Badge variant="secondary" className="text-xs capitalize">
            {item.priority}
          </Badge>
          {item.targetDate && (
            <p className="text-xs text-muted-foreground">
              Target: {format(parseISO(item.targetDate), "MMM dd, yyyy")}
            </p>
          )}
        </div>

        <GoalPredictionCard prediction={item.prediction} amount={item.amount} />

        <div className="flex gap-2 mt-3">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onSchedule(item.id)}
            data-testid={`button-schedule-${item.id}`}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(item.id)}
            data-testid={`button-delete-wishlist-${item.id}`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
