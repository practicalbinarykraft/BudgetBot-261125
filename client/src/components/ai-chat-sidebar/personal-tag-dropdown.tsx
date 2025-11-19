import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/i18n/context';

interface PersonalTag {
  id: number;
  name: string;
  icon?: string;
  color?: string;
}

interface PersonalTagDropdownProps {
  value: string | null | undefined;
  availableTags: PersonalTag[];
  onChange: (tagName: string | undefined) => void;
}

export function PersonalTagDropdown({ value, availableTags, onChange }: PersonalTagDropdownProps) {
  const { t } = useTranslation();
  
  if (!availableTags || availableTags.length === 0) {
    return null; // Don't render if no tags available
  }

  const handleChange = (val: string) => {
    onChange(val === 'none' ? undefined : val);
  };

  return (
    <div className="space-y-1.5">
      <span className="text-muted-foreground capitalize text-xs">
        {t('analysis.select_personal_tag')}:
      </span>
      <Select 
        value={value || 'none'} 
        onValueChange={handleChange}
        data-testid="select-personal-tag"
      >
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder={t('analysis.select_personal_tag')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" data-testid="option-tag-none">
            {t('analysis.no_personal_tag')}
          </SelectItem>
          {availableTags.map((tag) => (
            <SelectItem 
              key={tag.id} 
              value={tag.name}
              data-testid={`option-tag-${tag.id}`}
            >
              {tag.icon && tag.icon !== 'User' ? `${tag.icon} ` : ''}{tag.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
