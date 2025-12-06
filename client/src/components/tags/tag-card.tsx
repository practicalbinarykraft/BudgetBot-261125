import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TagBadge } from './tag-badge';
import { Edit, Trash2, Lock } from 'lucide-react';
import type { PersonalTag } from '@shared/schema';
import { useTranslation } from '@/i18n/context';

interface TagCardProps {
  tag: PersonalTag;
  stats: {
    transactionCount: number;
    totalSpent: number;
  };
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails?: () => void;
  disabled?: boolean;
}

// Helper for Russian pluralization
function getTransactionWord(count: number, t: (key: string) => string): string {
  const abs = Math.abs(count);
  const lastTwo = abs % 100;
  const lastOne = abs % 10;

  if (lastTwo >= 11 && lastTwo <= 19) {
    return t('tags.transaction_many');
  }
  if (lastOne === 1) {
    return t('tags.transaction_one');
  }
  if (lastOne >= 2 && lastOne <= 4) {
    return t('tags.transaction_few');
  }
  return t('tags.transaction_many');
}

export function TagCard({ tag, stats, onEdit, onDelete, onViewDetails, disabled = false }: TagCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="p-4 hover-elevate" data-testid={`tag-card-${tag.id}`}>
      <div className="flex items-center justify-between gap-4">
        <div 
          className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer" 
          onClick={onViewDetails}
          data-testid={`tag-card-clickable-${tag.id}`}
        >
          <TagBadge tag={tag} className="flex-shrink-0" />
          
          <div className="text-sm text-muted-foreground flex-shrink-0">
            <span data-testid={`tag-stats-count-${tag.id}`}>
              {stats?.transactionCount ?? 0} {getTransactionWord(stats?.transactionCount ?? 0, t)}
            </span>
            <span className="mx-2">·</span>
            <span data-testid={`tag-stats-total-${tag.id}`}>
              ${(stats?.totalSpent ?? 0).toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {tag.isDefault ? (
            <div
              className="flex items-center gap-1 text-xs text-muted-foreground"
              data-testid={`tag-default-badge-${tag.id}`}
            >
              <Lock className="h-3 w-3" />
              <span>{t('tags.default')}</span>
            </div>
          ) : (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={onEdit}
                disabled={disabled}
                data-testid={`button-edit-tag-${tag.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={onDelete}
                disabled={disabled}
                data-testid={`button-delete-tag-${tag.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
