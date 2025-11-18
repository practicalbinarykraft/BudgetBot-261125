import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';

interface ConfirmationButtonsProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmationButtons({ 
  onConfirm, 
  onCancel, 
  loading 
}: ConfirmationButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        onClick={onConfirm}
        disabled={loading}
        className="flex-1"
        data-testid="button-confirm-action"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Executing...
          </>
        ) : (
          <>
            <Check className="w-4 h-4 mr-2" />
            Execute
          </>
        )}
      </Button>
      <Button
        onClick={onCancel}
        disabled={loading}
        variant="outline"
        data-testid="button-cancel-action"
      >
        <X className="w-4 h-4 mr-2" />
        Cancel
      </Button>
    </div>
  );
}
