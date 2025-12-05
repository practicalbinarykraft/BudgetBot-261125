/**
 * Product Stats Cards Component
 *
 * Displays purchase count, best price, and average price.
 * ~100 lines - focused on product statistics.
 */

import { ShoppingBag, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/i18n/context";
import { ProductCatalog } from "@shared/schemas/product-catalog";
import { getCurrencySymbol, convertFromUSD } from "@/lib/currency-utils";

interface ProductStatsCardsProps {
  product: ProductCatalog;
  currency: string;
  exchangeRate: number;
}

export function ProductStatsCards({ product, currency, exchangeRate }: ProductStatsCardsProps) {
  const { t, language } = useTranslation();
  const currencySymbol = getCurrencySymbol(currency);

  // Original price from receipt (priority)
  const hasOriginalPrice = product.bestPriceOriginal && product.bestCurrencyOriginal;
  const originalPrice = parseFloat(product.bestPriceOriginal || "0");
  const originalCurrency = product.bestCurrencyOriginal || "USD";

  // USD price for conversion
  const priceUsd = parseFloat(product.bestPrice || "0");

  // For legacy products - convert USD to user currency
  const priceInUserCurrency = convertFromUSD(priceUsd, currency, exchangeRate);

  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      {/* Purchase Count */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <ShoppingBag className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">{t("productDetail.purchased")}</span>
          </div>
          <p className="text-xl md:text-2xl font-bold" data-testid="text-purchase-count">
            {product.purchaseCount} {t("productDetail.times")}
          </p>
        </CardContent>
      </Card>

      {/* Best Price */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2 text-green-600">
            <TrendingDown className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">{t("productDetail.bestPrice")}</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-green-700" data-testid="text-best-price">
            {hasOriginalPrice
              ? formatPrice(originalPrice, originalCurrency)
              : formatPrice(priceInUserCurrency, currency)}
          </p>
          {hasOriginalPrice && originalCurrency !== "USD" && (
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {formatPrice(priceUsd, "USD")}
            </p>
          )}
          {!hasOriginalPrice && currency !== "USD" && (
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {formatPrice(priceUsd, "USD")}
            </p>
          )}
          {product.bestStore && (
            <p className="text-xs text-muted-foreground mt-1" data-testid="text-best-store">
              {product.bestStore}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Average Price */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <TrendingDown className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">{t("productDetail.averagePrice")}</span>
          </div>
          <p className="text-xl md:text-2xl font-bold" data-testid="text-average-price">
            {currencySymbol}{parseFloat(product.averagePrice || "0").toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
