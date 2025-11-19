import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/i18n/context';
import { ArrowLeft, Search, TrendingDown, ShoppingBag, Package, Tag, Weight } from 'lucide-react';
import { useState } from 'react';
import { PriceHistoryChart } from '@/components/product-catalog/price-history-chart';
import { PriceSearchModal } from '@/components/product-catalog/price-search-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCatalog } from '@shared/schemas/product-catalog';
import { getCurrencySymbol } from '@/lib/currency-utils';

interface PriceHistoryEntry {
  id: number;
  storeName: string;
  price: string;
  purchaseDate: string;
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
  const { t } = useTranslation();
  const [showSearchModal, setShowSearchModal] = useState(false);

  const { data: settings } = useQuery<{ currency?: string }>({
    queryKey: ['/api/settings'],
  });

  const currency = settings?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);

  const { data: product, isLoading: productLoading } = useQuery<ProductCatalog>({
    queryKey: ['/api/product-catalog', id],
    enabled: !!id,
  });

  const { data: priceData } = useQuery<PriceHistoryData>({
    queryKey: ['/api/product-catalog', id, 'price-history'],
    enabled: !!id && !!product,
  });

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
              <Link href="/product-catalog">
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
        <h1 className="text-3xl font-bold mb-2" data-testid="text-product-name">{product.name}</h1>
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
              {currencySymbol}{parseFloat(product.bestPrice || '0').toFixed(2)}
            </p>
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
              const avgPrice = prices.reduce((sum, p) => sum + parseFloat(p.price), 0) / prices.length;
              const minPrice = Math.min(...prices.map(p => parseFloat(p.price)));

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
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600 font-semibold">
                        {t('productDetail.min')}: {currencySymbol}{minPrice.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">
                        {t('productDetail.avg')}: {currencySymbol}{avgPrice.toFixed(2)}
                      </span>
                    </div>
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
