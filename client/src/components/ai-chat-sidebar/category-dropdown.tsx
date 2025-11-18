import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
}

interface MLSuggestion {
  categoryId: number;
  categoryName: string;
  confidence: number;
}

interface CategoryDropdownProps {
  value: string;
  availableCategories: Category[];
  mlSuggestion?: MLSuggestion | null;
  onChange: (categoryName: string) => void;
}

export function CategoryDropdown({ 
  value, 
  availableCategories, 
  mlSuggestion,
  onChange 
}: CategoryDropdownProps) {
  return (
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
        value={value || ''} 
        onValueChange={onChange}
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
              {cat.icon && cat.icon !== 'Tag' ? `${cat.icon} ` : ''}{cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
