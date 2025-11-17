import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, Target } from "lucide-react";
import { format, parseISO } from "date-fns";

/**
 * Tooltip component for goal markers on timeline
 * Shows goal details when hovering over a marker
 * 
 * Модульный, 60 строк, джуну понятно
 */
interface GoalTimelineTooltipProps {
  goal: {
    name: string;
    amount: string;
    targetDate: string;
    status: string;
    priority: string;
    prediction: {
      monthsToAfford: number | null;
      affordableDate: string | null;
    } | null;
  };
  position: { x: number; y: number };
}

export function GoalTimelineTooltip({ goal, position }: GoalTimelineTooltipProps) {
  if (!goal.prediction?.affordableDate) {
    return null;
  }

  const amount = parseFloat(goal.amount);
  const affordableDate = parseISO(goal.prediction.affordableDate);
  const targetDate = goal.targetDate ? parseISO(goal.targetDate) : null;
  
  // Priority badge variant (derived from targetDate proximity)
  const priorityVariant = goal.priority === "high" ? "destructive"
                        : goal.priority === "medium" ? "default"
                        : "secondary";
  
  // Offset tooltip from cursor (15px right, 15px down)
  const OFFSET_X = 15;
  const OFFSET_Y = 15;

  return (
    <Card 
      className="w-64 border-2" 
      style={{
        position: 'fixed',
        left: position.x + OFFSET_X,
        top: position.y + OFFSET_Y,
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Target className="h-4 w-4 flex-shrink-0 text-primary" />
            <h4 className="font-semibold text-sm truncate" data-testid="tooltip-goal-name">
              {goal.name}
            </h4>
          </div>
          <Badge variant={priorityVariant} className="text-xs flex-shrink-0" data-testid="tooltip-priority">
            {goal.priority}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Amount:</span>
          <span className="font-mono font-medium" data-testid="tooltip-amount">
            ${amount.toFixed(2)}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Target:</span>
          <span className="font-medium" data-testid="tooltip-target-date">
            {targetDate ? format(targetDate, 'MMM d, yyyy') : 'Not set'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-3 w-3 text-success" />
          <span className="text-muted-foreground">Affordable:</span>
          <span className="font-medium text-success" data-testid="tooltip-affordable-date">
            {format(affordableDate, 'MMM d, yyyy')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
