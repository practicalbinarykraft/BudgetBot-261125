import { 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown 
} from "lucide-react";

/**
 * Swipe instructions component
 * Shows 4 directional arrows AROUND the swipe card
 * Positioned with absolute positioning on all 4 sides
 */
export function SwipeInstructions() {
  return (
    <>
      {/* LEFT: Essential - Hidden on mobile */}
      <div 
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full items-center gap-3 pr-6 pointer-events-none"
        data-testid="instruction-essential"
      >
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0 shadow-md">
          <ArrowLeft className="w-6 h-6 text-blue-600" />
        </div>
        <div className="text-right">
          <div className="font-semibold text-sm" data-testid="text-essential-label">Essential</div>
          <div className="text-xs text-muted-foreground" data-testid="text-essential-desc">Must-have</div>
        </div>
      </div>

      {/* RIGHT: Discretionary - Hidden on mobile */}
      <div 
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-full items-center gap-3 pl-6 pointer-events-none"
        data-testid="instruction-discretionary"
      >
        <div className="text-left">
          <div className="font-semibold text-sm" data-testid="text-discretionary-label">Discretionary</div>
          <div className="text-xs text-muted-foreground" data-testid="text-discretionary-desc">Optional</div>
        </div>
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0 shadow-md">
          <ArrowRight className="w-6 h-6 text-green-600" />
        </div>
      </div>

      {/* TOP: Asset */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center gap-2 pb-6 pointer-events-none"
        data-testid="instruction-asset"
      >
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center shrink-0 shadow-md">
          <ArrowUp className="w-6 h-6 text-purple-600" />
        </div>
        <div className="text-center">
          <div className="font-semibold text-sm" data-testid="text-asset-label">Asset</div>
          <div className="text-xs text-muted-foreground" data-testid="text-asset-desc">Investment</div>
        </div>
      </div>

      {/* BOTTOM: Liability */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full flex flex-col items-center gap-2 pt-6 pointer-events-none"
        data-testid="instruction-liability"
      >
        <div className="text-center">
          <div className="font-semibold text-sm" data-testid="text-liability-label">Liability</div>
          <div className="text-xs text-muted-foreground" data-testid="text-liability-desc">Depreciating</div>
        </div>
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0 shadow-md">
          <ArrowDown className="w-6 h-6 text-red-600" />
        </div>
      </div>
    </>
  );
}
