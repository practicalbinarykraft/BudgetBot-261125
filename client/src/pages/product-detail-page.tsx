import { useParams, Link, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from '@/i18n/context';
import { ArrowLeft, Search, TrendingDown, ShoppingBag, Package, Tag, Weight, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PriceHistoryChart } from '@/components/product-catalog/price-history-chart';
import { PriceSearchModal } from '@/components/product-catalog/price-search-modal';
import { ProductEditDialog } from '@/components/product-catalog/product-edit-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ProductCatalog } from '@shared/schemas/product-catalog';
import { getCurrencySymbol, convertFromUSD } from '@/lib/currency-utils';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface PriceHistoryEntry {
  id: number;
  storeName: string;
  price: string; // USD
  purchaseDate: string;
  
  // Dual-currency fields
  priceOriginal?: string;
  currencyOriginal?: string;
  exchangeRate?: string;
}

interface PriceHistoryData {
  product: ProductCatalog;
  priceHistory: PriceHistoryEntry[];
  byStore: Record<string, PriceHistoryEntry[]>;
  statistics: {
    totalPurchases: number;
    averagePrice: string | null;
    bestPrice: string | null;
    bestStore: string | null;
  };
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: settings } = useQuery<{
    currency?: string;
    exchangeRateRUB?: string;
    exchangeRateIDR?: string;
    exchangeRateKRW?: string;
    exchangeRateEUR?: string;
    exchangeRateCNY?: string;
  }>({
    queryKey: ['/api/settings'],
  });

  const currency = settings?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);
  
  // Get exchange rate for user's currency
  const exchangeRate = currency === 'USD' ? 1 :
    currency === 'RUB' ? parseFloat(settings?.exchangeRateRUB || '92.5') :
    currency === 'IDR' ? parseFloat(settings?.exchangeRateIDR || '15750') :
    currency === 'KRW' ? parseFloat(settings?.exchangeRateKRW || '1320') :
    currency === 'EUR' ? parseFloat(settings?.exchangeRateEUR || '0.92') :
    currency === 'CNY' ? parseFloat(settings?.exchangeRateCNY || '7.24') : 1;

  const { data: product, isLoading: productLoading } = useQuery<ProductCatalog>({
    queryKey: ['/api/product-catalog', id],
    enabled: !!id,
  });

  // ИСХОДНАЯ цена из чека (приоритет) для bestPrice
  const hasOriginalPrice = product?.bestPriceOriginal && product?.bestCurrencyOriginal;
  const originalPrice = parseFloat(product?.bestPriceOriginal || '0');
  const originalCurrency = product?.bestCurrencyOriginal || 'USD';
  const originalCurrencySymbol = getCurrencySymbol(originalCurrency);
  
  // USD цена для конвертации
  const priceUsd = parseFloat(product?.bestPrice || '0');
  
  // Для старых товаров без исходной цены - конвертируем USD в пользовательскую валюту
  const priceInUserCurrency = convertFromUSD(priceUsd, currency, exchangeRate);

  // Форматирование с локализацией
  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const { data: priceData } = useQuery<PriceHistoryData>({
    queryKey: ['/api/product-catalog', id, 'price-history'],
    enabled: !!id && !!product,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/product-catalog/${id}`);
    },
    onSuccess: () => {
      toast({
        title: t('productDetail.deleteSuccess'),
      });
      // Инвалидировать все связанные кеши
      queryClient.invalidateQueries({ queryKey: ['/api/product-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['/api/product-catalog', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/product-catalog', id, 'price-history'] });
      navigate('/app/product-catalog');
    },
    onError: () => {
      toast({
        title: t('productDetail.deleteError'),
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  if (productLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{t('productDetail.notFound')}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/app/product-catalog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('productDetail.back')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Button variant="ghost" className="mb-6" asChild data-testid="button-back">
        <Link href="/product-catalog">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('productDetail.back')}
        </Link>
      </Button>

      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl font-bold" data-testid="text-product-name">{product.name}</h1>
          <div className="flex gap-2">
            <ProductEditDialog product={product} />
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" data-testid="button-delete">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('productDetail.deleteConfirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('productDetail.deleteConfirmDesc')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-delete" disabled={deleteMutation.isPending}>
                    {t('productEdit.cancel')}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="button-confirm-delete"
                  >
                    {deleteMutation.isPending ? '...' : t('productDetail.confirmDelete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {product.category && (
            <span className="flex items-center gap-1" data-testid="text-category">
              <Package className="w-4 h-4" />
              {product.category}
            </span>
          )}
          {product.brand && (
            <span className="flex items-center gap-1" data-testid="text-brand">
              <Tag className="w-4 h-4" />
              {product.brand}
            </span>
          )}
          {product.weight && (
            <span className="flex items-center gap-1" data-testid="text-weight">
              <Weight className="w-4 h-4" />
              {product.weight}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <ShoppingBag className="w-5 h-5" />
              <span className="text-sm">{t('productDetail.purchased')}</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-purchase-count">
              {product.purchaseCount} {t('productDetail.times')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2 text-green-600">
              <TrendingDown className="w-5 h-5" />
              <span className="text-sm">{t('productDetail.bestPrice')}</span>
            </div>
            <p className="text-2xl font-bold text-green-700" data-testid="text-best-price">
              {hasOriginalPrice 
                ? formatPrice(originalPrice, originalCurrency)
                : formatPrice(priceInUserCurrency, currency)
              }
            </p>
            {/* Показать USD конвертацию */}
            {hasOriginalPrice && originalCurrency !== 'USD' && (
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {formatPrice(priceUsd, 'USD')}
              </p>
            )}
            {!hasOriginalPrice && currency !== 'USD' && (
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {formatPrice(priceUsd, 'USD')}
              </p>
            )}
            {product.bestStore && (
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-best-store">
                {product.bestStore}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <TrendingDown className="w-5 h-5" />
              <span className="text-sm">{t('productDetail.averagePrice')}</span>
            </div>
            <p className="text-2xl font-bold" data-testid="text-average-price">
              {currencySymbol}{parseFloat(product.averagePrice || '0').toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={() => setShowSearchModal(true)}
        className="w-full mb-6"
        size="lg"
        data-testid="button-search-prices"
      >
        <Search className="w-5 h-5 mr-2" />
        {t('productDetail.searchPrices')}
      </Button>

      {priceData?.priceHistory && priceData.priceHistory.length > 0 && (
        <div className="mb-6">
          <PriceHistoryChart data={priceData.priceHistory} />
        </div>
      )}

      {priceData?.byStore && Object.keys(priceData.byStore).length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">{t('productDetail.byStore')}</h2>
          <div className="space-y-3">
            {Object.entries(priceData.byStore).map(([storeName, prices]) => {
              // USD цены
              const avgPriceUsd = prices.reduce((sum, p) => sum + parseFloat(p.price), 0) / prices.length;
              const minPriceUsd = Math.min(...prices.map(p => parseFloat(p.price)));
              
              // Исходные цены (если есть)
              const hasOriginal = prices.some(p => p.priceOriginal && p.currencyOriginal);
              const storeCurrency = hasOriginal ? prices.find(p => p.currencyOriginal)?.currencyOriginal || 'USD' : 'USD';
              const minOriginal = hasOriginal 
                ? Math.min(...prices.filter(p => p.priceOriginal).map(p => parseFloat(p.priceOriginal!)))
                : minPriceUsd;
              const avgOriginal = hasOriginal
                ? prices.filter(p => p.priceOriginal).reduce((sum, p) => sum + parseFloat(p.priceOriginal!), 0) / prices.filter(p => p.priceOriginal).length
                : avgPriceUsd;

              return (
                <Card key={storeName} data-testid={`card-store-${storeName}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold" data-testid={`text-store-name-${storeName}`}>
                        {storeName}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {prices.length} {t('productDetail.purchases')}
                      </span>
                    </div>
                    
                    {hasOriginal ? (
                      <div className="space-y-1">
                        <div className="flex gap-4 text-sm">
                          <span className="text-green-600 font-semibold">
                            {t('productDetail.min')}: {formatPrice(minOriginal, storeCurrency)}
                          </span>
                          <span className="text-muted-foreground">
                            {t('productDetail.avg')}: {formatPrice(avgOriginal, storeCurrency)}
                          </span>
                        </div>
                        {storeCurrency !== 'USD' && (
                          <div className="text-xs text-muted-foreground">
                            ≈ ${minPriceUsd.toFixed(2)} / ${avgPriceUsd.toFixed(2)} USD
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600 font-semibold">
                          {t('productDetail.min')}: {formatPrice(minPriceUsd, currency)}
                        </span>
                        <span className="text-muted-foreground">
                          {t('productDetail.avg')}: {formatPrice(avgPriceUsd, currency)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {showSearchModal && (
        <PriceSearchModal
          productId={parseInt(id!)}
          productName={product.name}
          currency={currency}
          onClose={() => setShowSearchModal(false)}
        />
      )}
    </div>
  );
}
