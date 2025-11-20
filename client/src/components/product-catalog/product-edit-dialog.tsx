import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from '@/i18n/context';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ProductCatalog } from '@shared/schemas/product-catalog';
import { apiRequest, queryClient } from '@/lib/queryClient';

const editProductSchema = z.object({
  name: z.string().min(1, 'productEdit.nameRequired'),
  category: z.string().optional(),
  brand: z.string().optional(),
  weight: z.string().optional(),
  unit: z.string().optional(),
});

type EditProductFormData = z.infer<typeof editProductSchema>;

interface ProductEditDialogProps {
  product: ProductCatalog;
}

export function ProductEditDialog({ product }: ProductEditDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      name: product.name,
      category: product.category || '',
      brand: product.brand || '',
      weight: product.weight || '',
      unit: product.unit || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EditProductFormData) => {
      return await apiRequest('PATCH', `/api/product-catalog/${product.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-catalog', product.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['/api/product-catalog'] });
      toast({
        title: t('productEdit.success'),
      });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: t('productEdit.error'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: EditProductFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-edit-product">
          <Edit className="w-4 h-4 mr-2" />
          {t('productEdit.edit')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('productEdit.title')}</DialogTitle>
          <DialogDescription>
            {product.name}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('productEdit.name')}</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      data-testid="input-product-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('productEdit.category')} 
                    <span className="text-muted-foreground text-xs ml-2">
                      ({t('productEdit.categoryOptional')})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      data-testid="input-product-category"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('productEdit.brand')}
                    <span className="text-muted-foreground text-xs ml-2">
                      ({t('productEdit.categoryOptional')})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      data-testid="input-product-brand"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('productEdit.weight')}
                      <span className="text-muted-foreground text-xs ml-2">
                        ({t('productEdit.categoryOptional')})
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="500г"
                        data-testid="input-product-weight"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('productEdit.unit')}
                      <span className="text-muted-foreground text-xs ml-2">
                        ({t('productEdit.categoryOptional')})
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="шт"
                        data-testid="input-product-unit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel-edit"
              >
                {t('productEdit.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                data-testid="button-save-product"
              >
                {updateMutation.isPending ? t('common.loading') : t('productEdit.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
