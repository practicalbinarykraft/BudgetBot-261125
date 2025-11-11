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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (categoryName: string) => void;
  defaultType?: 'income' | 'expense';
}

export function CategoryCreateDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  defaultType = 'expense' 
}: Props) {
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>(defaultType);

  useEffect(() => {
    if (open) {
      setType(defaultType);
    }
  }, [open, defaultType]);
  
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; type: string }) => {
      const res = await apiRequest('POST', '/api/categories', {
        name: data.name,
        type: data.type,
        icon: 'Package',
        color: '#3b82f6'
      });
      return res.json() as Promise<{ name: string }>;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      
      onOpenChange(false);
      
      setName('');
      setType(defaultType);
      
      if (onSuccess && response.name) {
        onSuccess(response.name);
      }
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createMutation.mutate({ name: name.trim(), type });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Coffee shops"
              autoFocus
              data-testid="input-category-name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'income' | 'expense')}>
              <SelectTrigger id="category-type" data-testid="select-category-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-category"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || createMutation.isPending}
              data-testid="button-create-category"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
