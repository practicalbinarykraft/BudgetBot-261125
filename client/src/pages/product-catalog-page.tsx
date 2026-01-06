import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/i18n/context';
import { Search, Package } from 'lucide-react';
import { ProductListItem } from '@/components/product-catalog/product-list-item';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCatalog } from '@shared/schemas/product-catalog';
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

export default function ProductCatalogPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch user settings for currency and exchange rates
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
  
  // Get exchange rate for user's currency
  const exchangeRate = currency === 'USD' ? 1 :
    currency === 'RUB' ? parseFloat(settings?.exchangeRateRUB || '92.5') :
    currency === 'IDR' ? parseFloat(settings?.exchangeRateIDR || '15750') :
    currency === 'KRW' ? parseFloat(settings?.exchangeRateKRW || '1320') :
    currency === 'EUR' ? parseFloat(settings?.exchangeRateEUR || '0.92') :
    currency === 'CNY' ? parseFloat(settings?.exchangeRateCNY || '7.24') : 1;

  // Build query params
  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.append('search', searchQuery);
  if (selectedCategory && selectedCategory !== 'all') queryParams.append('category', selectedCategory);
  const queryString = queryParams.toString();

  // Fetch products
  const { data: products = [], isLoading } = useQuery<ProductCatalog[]>({
    queryKey: ['/api/product-catalog', { search: searchQuery, category: selectedCategory === 'all' ? '' : selectedCategory }],
    queryFn: async () => {
      const url = `/api/product-catalog${queryString ? `?${queryString}` : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });

  // Extract unique categories
  const categories = Array.from(
    new Set(products.map(p => p.category).filter(Boolean) as string[])
  );

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 pb-20 sm:pb-6 max-w-4xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-8 h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
              {t('productCatalog.title') || 'Каталог товаров'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t('productCatalog.subtitle') || 'Товары из ваших чеков с историей цен'}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('productCatalog.searchPlaceholder') || 'Поиск товара...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-products"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]" data-testid="select-category-filter">
            <SelectValue placeholder={t('productCatalog.allCategories') || 'Все категории'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" data-testid="select-item-all-categories">
              {t('productCatalog.allCategories') || 'Все категории'}
            </SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat} data-testid={`select-item-category-${cat}`}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

        {/* Products List */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="space-y-3" data-testid="list-products">
              {products.map(product => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  currency={currency}
                  exchangeRate={exchangeRate}
                />
              ))}
            </div>

            {/* Stats Footer */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  {t('productCatalog.totalProducts') || 'Всего товаров'}: {' '}
                  <span className="font-semibold" data-testid="text-total-products">
                    {products.length}
                  </span>
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                {searchQuery
                  ? t('productCatalog.noResults') || 'Ничего не найдено'
                  : t('productCatalog.empty') || 'Пока нет товаров'}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('productCatalog.emptyHint') || 'Загрузите чек через OCR чтобы добавить товары'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileBottomNav
          onMenuClick={() => setShowMobileMenu(true)}
          onAddClick={() => {
            toast({
              title: "Добавить транзакцию",
              description: "Функция скоро будет доступна!",
            });
          }}
          onAiChatClick={() => {
            toast({
              title: "AI Chat",
              description: "Функция AI чата скоро будет доступна!",
            });
          }}
        />
      )}

      <MobileMenuSheet
        open={showMobileMenu}
        onOpenChange={setShowMobileMenu}
      />
    </>
  );
}
