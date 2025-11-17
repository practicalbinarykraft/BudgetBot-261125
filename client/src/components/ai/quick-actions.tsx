import { Button } from "@/components/ui/button";
import { Wallet, TrendingDown, Lightbulb } from "lucide-react";

interface QuickActionsProps {
  onAskQuestion: (question: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onAskQuestion, disabled = false }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2" data-testid="quick-actions">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAskQuestion("How should I distribute my budget?")}
        disabled={disabled}
        data-testid="quick-action-budget"
        className="hover-elevate"
      >
        <Wallet className="h-4 w-4 mr-1" />
        Ask about budget
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAskQuestion("Analyze my spending patterns")}
        disabled={disabled}
        data-testid="quick-action-spending"
        className="hover-elevate"
      >
        <TrendingDown className="h-4 w-4 mr-1" />
        Analyze spending
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAskQuestion("Give me tips on how to save money")}
        disabled={disabled}
        data-testid="quick-action-savings"
        className="hover-elevate"
      >
        <Lightbulb className="h-4 w-4 mr-1" />
        Savings tips
      </Button>
    </div>
  );
}
