import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ActionPreview } from './action-preview';
import { ConfirmationButtons } from './confirmation-buttons';

interface ConfirmationCardProps {
  action: string;
  params: Record<string, any>;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmationCard({
  action,
  params,
  onConfirm,
  onCancel
}: ConfirmationCardProps) {
  const [loading, setLoading] = useState(false);
  
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card 
      className="border-2 border-primary bg-primary/5 
                 animate-in slide-in-from-bottom-4 duration-300"
      data-testid="card-confirmation"
    >
      <CardContent className="p-4 space-y-3">
        <ActionPreview action={action} params={params} />
        
        <div className="bg-muted p-3 rounded-md text-sm space-y-1">
          {Object.entries(params).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4">
              <span className="text-muted-foreground capitalize">{key}:</span>
              <span className="font-medium text-right break-all">
                {String(value)}
              </span>
            </div>
          ))}
        </div>
        
        <ConfirmationButtons
          onConfirm={handleConfirm}
          onCancel={onCancel}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
}
