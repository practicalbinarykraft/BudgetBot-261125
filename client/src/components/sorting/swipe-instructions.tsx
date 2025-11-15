import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown 
} from "lucide-react";

/**
 * Swipe instructions component
 * Shows user how to classify transactions by swiping in different directions
 * Displayed at the TOP of the page, not inside individual cards
 */
export function SwipeInstructions() {
  return (
    <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 to-primary/10" data-testid="swipe-instructions">
      <h3 className="text-center text-sm font-semibold mb-4" data-testid="text-instructions-title">
        Swipe in any direction to classify:
      </h3>
      
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {/* Left: Essential */}
        <div className="flex items-center gap-3" data-testid="instruction-essential">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <ArrowLeft className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-sm" data-testid="text-essential-label">Essential</div>
            <div className="text-xs text-muted-foreground" data-testid="text-essential-desc">Must-have</div>
          </div>
        </div>
        
        {/* Right: Discretionary */}
        <div className="flex items-center gap-3" data-testid="instruction-discretionary">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <ArrowRight className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="font-medium text-sm" data-testid="text-discretionary-label">Discretionary</div>
            <div className="text-xs text-muted-foreground" data-testid="text-discretionary-desc">Optional</div>
          </div>
        </div>
        
        {/* Up: Asset */}
        <div className="flex items-center gap-3" data-testid="instruction-asset">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
            <ArrowUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="font-medium text-sm" data-testid="text-asset-label">Asset</div>
            <div className="text-xs text-muted-foreground" data-testid="text-asset-desc">Investment</div>
          </div>
        </div>
        
        {/* Down: Liability */}
        <div className="flex items-center gap-3" data-testid="instruction-liability">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <ArrowDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="font-medium text-sm" data-testid="text-liability-label">Liability</div>
            <div className="text-xs text-muted-foreground" data-testid="text-liability-desc">Depreciating</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
