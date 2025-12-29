import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/i18n/context';
import type { PersonalTag, InsertPersonalTag } from '@shared/schema';
import { User, Heart, Home, Users, Baby, UserPlus, Briefcase, Gift, Dog, Cat } from 'lucide-react';

interface CreateTagDialogProps {
  open: boolean;
  onClose: () => void;
  editTag?: PersonalTag | null;
}

const ICON_OPTIONS = [
  { name: 'User', component: User },
  { name: 'Heart', component: Heart },
  { name: 'Home', component: Home },
  { name: 'Users', component: Users },
  { name: 'Baby', component: Baby },
  { name: 'UserPlus', component: UserPlus },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Gift', component: Gift },
  { name: 'Dog', component: Dog },
  { name: 'Cat', component: Cat },
];
const COLOR_OPTIONS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#6366f1', '#84cc16'];

export function CreateTagDialog({ open, onClose, editTag }: CreateTagDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('User');
  const [color, setColor] = useState('#3b82f6');
  const [type, setType] = useState<'personal' | 'shared' | 'person'>('person');
  
  // Sync form state when editTag changes
  useEffect(() => {
    if (editTag) {
      setName(editTag.name);
      setIcon(editTag.icon || 'User');
      setColor(editTag.color || '#3b82f6');
      setType(editTag.type as 'personal' | 'shared' | 'person' || 'person');
    } else {
      setName('');
      setIcon('User');
      setColor('#3b82f6');
      setType('person');
    }
  }, [editTag, open]);
  
  const createMutation = useMutation({
    mutationFn: async (data: InsertPersonalTag) => {
      return await apiRequest('POST', '/api/tags', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      toast({ description: t('tags.created_successfully') });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        description: error.message || t('tags.create_failed'),
        variant: 'destructive'
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertPersonalTag>) => {
      return await apiRequest('PATCH', `/api/tags/${editTag!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      toast({ description: t('tags.updated_successfully') });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        description: error.message || t('tags.update_failed'),
        variant: 'destructive'
      });
    },
  });
  
  const handleClose = () => {
    setName('');
    setIcon('User');
    setColor('#3b82f6');
    setType('person');
    onClose();
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ description: t('tags.name_required'), variant: 'destructive' });
      return;
    }
    
    const data: InsertPersonalTag = { name: name.trim(), icon, color, type };
    
    if (editTag) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };
  
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-testid="dialog-create-tag">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editTag ? t('tags.edit_tag') : t('tags.create_new_tag')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="tag-name">{t('tags.name')}</Label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('tags.name_placeholder')}
                disabled={isPending}
                data-testid="input-tag-name"
              />
            </div>

            <div>
              <Label htmlFor="tag-icon">{t('tags.icon')}</Label>
              <Select value={icon} onValueChange={setIcon} disabled={isPending}>
                <SelectTrigger id="tag-icon" data-testid="select-tag-icon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(({ name: iconName, component: IconComponent }) => (
                    <SelectItem key={iconName} value={iconName}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{t(`tags.icon.${iconName}`)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tag-color">{t('tags.color')}</Label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    disabled={isPending}
                    data-testid={`color-option-${c}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="tag-type">{t('tags.type')}</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)} disabled={isPending}>
                <SelectTrigger id="tag-type" data-testid="select-tag-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">{t('tags.type_person')}</SelectItem>
                  <SelectItem value="personal">{t('tags.type_personal')}</SelectItem>
                  <SelectItem value="shared">{t('tags.type_shared')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              data-testid="button-cancel-tag"
            >
              {t('tags.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-testid="button-save-tag"
            >
              {isPending ? t('tags.saving') : editTag ? t('tags.update') : t('tags.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
