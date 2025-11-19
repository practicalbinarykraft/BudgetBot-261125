import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from '@/i18n/context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Store, TrendingDown, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PriceSearchResult {
  storeName: string;
  price: number;
  url?: string;
  savings?: number;
}

interface PriceSearchModalProps {
  productId: number;
  productName: string;
  onClose: () => void;
}

export function PriceSearchModal({ productId, productName, onClose }: PriceSearchModalProps) {
  const { t } = useTranslation();
  const [results, setResults] = useState<PriceSearchResult[]>([]);

  const searchMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/price-search', {
        productId,
        query: productName,
      });
      return response;
    },
    onSuccess: (data: any) => {
      setResults(data.results || []);
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-price-search">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">
            {t('productDetail.searchPrices')}
          </DialogTitle>
          <DialogDescription data-testid="text-product-name">
            {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!searchMutation.data && (
            <div className="text-center py-6">
              <Button
                onClick={() => searchMutation.mutate()}
                disabled={searchMutation.isPending}
                data-testid="button-start-search"
              >
                {searchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('productDetail.startSearch')}
              </Button>
            </div>
          )}

          {searchMutation.isPending && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">{t('common.loading')}</span>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((result, index) => (
                <Card key={index} data-testid={`card-search-result-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Store className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-semibold" data-testid={`text-store-${index}`}>
                            {result.storeName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold" data-testid={`text-price-${index}`}>
                            ${result.price.toFixed(2)}
                          </span>
                          {result.savings && result.savings > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <TrendingDown className="w-3 h-3 mr-1" />
                              {t('productDetail.save')} ${result.savings.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {result.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          data-testid={`button-visit-store-${index}`}
                        >
                          <a href={result.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {t('productDetail.visit')}
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {searchMutation.isSuccess && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('productDetail.noResults')}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
