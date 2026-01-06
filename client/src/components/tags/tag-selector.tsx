import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { TagBadge } from './tag-badge';
import { useQuery } from '@tanstack/react-query';
import type { PersonalTag } from '@shared/schema';

interface TagSelectorProps {
  value: number | null | undefined;
  onChange: (tagId: number | null) => void;
  disabled?: boolean;
}

export function TagSelector({ value, onChange, disabled = false }: TagSelectorProps) {
  const { data: tags = [], isLoading } = useQuery<PersonalTag[]>({
    queryKey: ['/api/tags'],
  });
  
  const selectedTag = tags.find(t => t.id === value);
  
  return (
    <Select 
      value={value?.toString() || 'none'} 
      onValueChange={(v) => onChange(v === 'none' ? null : parseInt(v))}
      disabled={disabled || isLoading}
    >
      <SelectTrigger data-testid="tag-selector-trigger" className="flex items-center h-9">
        <div className="flex items-center w-full">
          {selectedTag ? (
            <TagBadge tag={selectedTag} />
          ) : (
            <SelectValue placeholder="Select tag..." />
          )}
        </div>
      </SelectTrigger>
      
      <SelectContent>
        <SelectItem value="none" data-testid="tag-option-none">
          <span className="text-muted-foreground">No tag</span>
        </SelectItem>
        
        {tags.map(tag => (
          <SelectItem 
            key={tag.id} 
            value={tag.id.toString()}
            data-testid={`tag-option-${tag.id}`}
            className="flex items-center"
          >
            <div className="flex items-center w-full">
              <TagBadge tag={tag} />
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
