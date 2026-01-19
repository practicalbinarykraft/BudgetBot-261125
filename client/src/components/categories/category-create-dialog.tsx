import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/i18n/context';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (categoryName: string) => void;
  defaultType?: 'income' | 'expense';
}

// Popular emoji icons for categories
const CATEGORY_ICONS = [
  { emoji: '🍔', name: 'Food' },
  { emoji: '🚗', name: 'Transport' },
  { emoji: '🛍️', name: 'Shopping' },
  { emoji: '🎮', name: 'Entertainment' },
  { emoji: '💳', name: 'Bills' },
  { emoji: '💰', name: 'Salary' },
  { emoji: '💻', name: 'Freelance' },
  { emoji: '❓', name: 'Unaccounted' },
  { emoji: '🏠', name: 'Home' },
  { emoji: '🏥', name: 'Health' },
  { emoji: '📚', name: 'Education' },
  { emoji: '✈️', name: 'Travel' },
  { emoji: '☕', name: 'Coffee' },
  { emoji: '🍕', name: 'Pizza' },
  { emoji: '🎬', name: 'Movies' },
  { emoji: '🎵', name: 'Music' },
  { emoji: '🏋️', name: 'Fitness' },
  { emoji: '💊', name: 'Medicine' },
  { emoji: '🎁', name: 'Gifts' },
  { emoji: '🐾', name: 'Pets' },
];

export function CategoryCreateDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  defaultType = 'expense' 
}: Props) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [icon, setIcon] = useState('🍔');

  useEffect(() => {
    if (open) {
      setType(defaultType);
      setName('');
      setIcon('🍔');
    }
  }, [open, defaultType]);
  
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; icon: string }) => {
      const res = await apiRequest('POST', '/api/categories', {
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: '#3b82f6'
      });
      return res.json() as Promise<{ name: string }>;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      
      onOpenChange(false);
      
      setName('');
      setType(defaultType);
      setIcon('🍔');
      
      if (onSuccess && response.name) {
        onSuccess(response.name);
      }
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createMutation.mutate({ name: name.trim(), type, icon });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('categories.add_category_dialog')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">{t('categories.name')}</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('categories.name_placeholder')}
              autoFocus
              data-testid="input-category-name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category-type">{t('categories.type')}</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'income' | 'expense')}>
              <SelectTrigger id="category-type" data-testid="select-category-type">
                <SelectValue placeholder={t('categories.select_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">{t('categories.type_expense')}</SelectItem>
                <SelectItem value="income">{t('categories.type_income')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-icon">{t('categories.icon')}</Label>
            <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
              {CATEGORY_ICONS.map(({ emoji, name: iconName }) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl transition-all hover:scale-110 ${
                    icon === emoji ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted'
                  }`}
                  data-testid={`icon-option-${iconName}`}
                  aria-label={iconName}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-category"
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || createMutation.isPending}
              data-testid="button-create-category"
            >
              {createMutation.isPending ? t('categories.adding') : t('categories.add_category')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
