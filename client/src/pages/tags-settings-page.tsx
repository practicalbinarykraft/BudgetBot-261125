import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { TagCard } from '@/components/tags/tag-card';
import { CreateTagDialog } from '@/components/tags/create-tag-dialog';
import { Plus, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { PersonalTag } from '@shared/schema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/i18n/context';

export default function TagsSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<PersonalTag | null>(null);
  const [deletingTag, setDeletingTag] = useState<PersonalTag | null>(null);
  const { t } = useTranslation();
  
  const { data: tags = [], isLoading } = useQuery<PersonalTag[]>({
    queryKey: ['/api/tags'],
  });
  
  const { data: tagStats = {} } = useQuery<Record<number, { transactionCount: number; totalSpent: number }>>({
    queryKey: ['/api/tags/stats', tags.map(t => t.id)],
    queryFn: async () => {
      if (tags.length === 0) return {};
      
      const statsPromises = tags.map(async (tag) => {
        try {
          const stats = await fetch(`/api/tags/${tag.id}/stats`).then(r => r.json());
          return [tag.id, stats];
        } catch {
          return [tag.id, { transactionCount: 0, totalSpent: 0 }];
        }
      });
      
      const results = await Promise.all(statsPromises);
      return Object.fromEntries(results);
    },
    enabled: tags.length > 0,
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (tagId: number) => {
      return await apiRequest('DELETE', `/api/tags/${tagId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      toast({ description: t('tags.deleted_successfully') });
      setDeletingTag(null);
    },
    onError: (error: any) => {
      toast({ 
        description: error.message || 'Failed to delete tag', 
        variant: 'destructive' 
      });
    },
  });
  
  const handleEdit = (tag: PersonalTag) => {
    setEditingTag(tag);
    setDialogOpen(true);
  };
  
  const handleDelete = (tag: PersonalTag) => {
    setDeletingTag(tag);
  };
  
  const handleViewDetails = (tagId: number) => {
    navigate(`/tags/${tagId}`);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTag(null);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-tags-settings">
            {t('tags.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('tags.organize')}
          </p>
        </div>
        
        <Button 
          onClick={() => setDialogOpen(true)}
          data-testid="button-create-tag"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('tags.create_tag')}
        </Button>
      </div>
      
      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground mb-4">
            {t('tags.no_tags')}
          </p>
          <Button 
            variant="outline" 
            onClick={() => setDialogOpen(true)}
            data-testid="button-create-first-tag"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('tags.create_first_tag')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tags.map((tag) => (
            <TagCard
              key={tag.id}
              tag={tag}
              stats={tagStats[tag.id] || { transactionCount: 0, totalSpent: 0 }}
              onEdit={() => handleEdit(tag)}
              onDelete={() => handleDelete(tag)}
              onViewDetails={() => handleViewDetails(tag.id)}
              disabled={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
      
      <CreateTagDialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        editTag={editingTag}
      />
      
      <AlertDialog open={!!deletingTag} onOpenChange={() => setDeletingTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tags.delete_tag')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tags.delete_confirm')} "{deletingTag?.name}"?
              {t('tags.delete_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTag && deleteMutation.mutate(deletingTag.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? t('tags.deleting') : t('tags.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
