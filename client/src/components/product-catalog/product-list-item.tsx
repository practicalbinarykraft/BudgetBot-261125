import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, TrendingDown, Store, Calendar, ShoppingBag, Search } from "lucide-react";
import { useLocation } from "wouter";
import { format, parseISO } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import { useTranslation } from "@/i18n/context";
import { ProductCatalog } from "@shared/schemas/product-catalog";
import { getCurrencySymbol, convertFromUSD } from "@/lib/currency-utils";

interface ProductListItemProps {
  product: ProductCatalog;
  currency?: string;
  exchangeRate?: number;
}

export function ProductListItem({ product, currency = 'USD', exchangeRate = 1 }: ProductListItemProps) {
  const { t, language } = useTranslation();
  const [, navigate] = useLocation();
  const locale = language === 'ru' ? ru : enUS;

  // ИСХОДНАЯ цена из чека (приоритет)
  const hasOriginalPrice = product.bestPriceOriginal && product.bestCurrencyOriginal;
  const originalPrice = parseFloat(product.bestPriceOriginal || '0');
  const originalCurrency = product.bestCurrencyOriginal || 'USD';
  
  // USD цена для конвертации
  const priceUsd = parseFloat(product.bestPrice || '0');
  
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

  const formattedDate = product.lastPurchaseDate
    ? format(parseISO(product.lastPurchaseDate), "d MMM yyyy", { locale })
    : null;

  const handleCardClick = () => {
    navigate(`/app/product-catalog/${product.id}`);
  };

  const handleSearchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/app/product-catalog/${product.id}`);
  };

  return (
    <Card
      className="hover-elevate cursor-pointer transition-all"
      data-testid={`card-product-${product.id}`}
      onClick={handleCardClick}
    >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Product info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <h3
                  className="font-semibold text-lg truncate"
                  data-testid={`text-product-name-${product.id}`}
                >
                  {product.name}
                </h3>
              </div>

              {/* Category badge */}
              {product.category && (
                <Badge
                  variant="secondary"
                  className="mb-2"
                  data-testid={`badge-category-${product.id}`}
                >
                  {product.category}
                </Badge>
              )}

              {/* Purchase Statistics */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <ShoppingBag className="w-4 h-4" />
                  <span data-testid={`text-purchase-count-${product.id}`}>
                    {t('productCatalog.purchased')}: {product.purchaseCount} {t('productCatalog.times')}
                  </span>
                </div>
                {formattedDate && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formattedDate}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Store */}
              {product.bestStore && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Store className="w-4 h-4" />
                  <span>{product.bestStore}</span>
                </div>
              )}
            </div>

            {/* Right: Price & Button */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {product.bestPrice && (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <TrendingDown className="w-4 h-4 text-green-600" />
                      <span className="text-lg font-bold text-green-700" data-testid={`text-best-price-${product.id}`}>
                        {hasOriginalPrice 
                          ? formatPrice(originalPrice, originalCurrency)
                          : formatPrice(priceInUserCurrency, currency)
                        }
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {t('productCatalog.bestPrice')}
                    </Badge>
                  </div>
                  {/* Показать USD конвертацию */}
                  {hasOriginalPrice && originalCurrency !== 'USD' && (
                    <span className="text-xs text-muted-foreground">
                      ≈ {formatPrice(priceUsd, 'USD')}
                    </span>
                  )}
                  {!hasOriginalPrice && currency !== 'USD' && (
                    <span className="text-xs text-muted-foreground">
                      ≈ {formatPrice(priceUsd, 'USD')}
                    </span>
                  )}
                </div>
              )}
              <Button
                size="sm"
                variant="default"
                onClick={handleSearchClick}
                data-testid={`button-search-price-${product.id}`}
              >
                <Search className="w-4 h-4 mr-1" />
                {t('productDetail.searchPrices')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
  );
}
