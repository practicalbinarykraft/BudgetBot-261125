import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ActionPreview } from './action-preview';
import { ConfirmationButtons } from './confirmation-buttons';
import { Sparkles } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

interface MLSuggestion {
  categoryId: number;
  categoryName: string;
  confidence: number;
}

interface ConfirmationCardProps {
  action: string;
  params: Record<string, any>;
  mlSuggestion?: MLSuggestion | null;
  availableCategories?: Category[] | null;
  onConfirm: (finalParams: Record<string, any>) => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmationCard({
  action,
  params,
  mlSuggestion,
  availableCategories,
  onConfirm,
  onCancel
}: ConfirmationCardProps) {
  const [loading, setLoading] = useState(false);
  const [editableParams, setEditableParams] = useState(params);
  
  const isAddTransaction = action === 'add_transaction';
  const hasCategories = availableCategories && availableCategories.length > 0;
  
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(editableParams);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCategoryChange = (categoryName: string) => {
    setEditableParams({
      ...editableParams,
      category: categoryName
    });
  };
  
  return (
    <Card 
      className="border-2 border-primary bg-primary/5 
                 animate-in slide-in-from-bottom-4 duration-300"
      data-testid="card-confirmation"
    >
      <CardContent className="p-4 space-y-3">
        <ActionPreview action={action} params={editableParams} />
        
        <div className="bg-muted p-3 rounded-md text-sm space-y-2">
          {/* Render category dropdown FIRST for add_transaction (before other params) */}
          {isAddTransaction && hasCategories && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground capitalize text-xs">
                  Category:
                </span>
                {mlSuggestion && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs gap-1"
                    data-testid="badge-ml-confidence"
                  >
                    <Sparkles className="w-3 h-3" />
                    {Math.round(mlSuggestion.confidence * 100)}%
                  </Badge>
                )}
              </div>
              <Select 
                value={editableParams.category || ''} 
                onValueChange={handleCategoryChange}
                data-testid="select-category"
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem 
                      key={cat.id} 
                      value={cat.name}
                      data-testid={`option-category-${cat.id}`}
                    >
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Render other params (skip category as it's rendered above) */}
          {Object.entries(editableParams).map(([key, value]) => {
            // Skip category - already rendered above
            if (key === 'category' && isAddTransaction && hasCategories) {
              return null;
            }
            
            // Default parameter display
            return (
              <div key={key} className="flex justify-between gap-4">
                <span className="text-muted-foreground capitalize">{key}:</span>
                <span className="font-medium text-right break-all">
                  {String(value)}
                </span>
              </div>
            );
          })}
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
