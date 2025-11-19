import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingDown, Store, Calendar } from "lucide-react";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import { useTranslation } from "@/i18n/context";
import { ProductCatalog } from "@shared/schemas/product-catalog";

interface ProductListItemProps {
  product: ProductCatalog;
}

export function ProductListItem({ product }: ProductListItemProps) {
  const { language } = useTranslation();
  const locale = language === 'ru' ? ru : enUS;

  const formattedDate = product.lastPurchaseDate
    ? format(parseISO(product.lastPurchaseDate), "d MMM yyyy", { locale })
    : null;

  return (
    <Link href={`/product-catalog/${product.id}`}>
      <Card
        className="hover-elevate cursor-pointer transition-all"
        data-testid={`card-product-${product.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Product info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <h3
                  className="font-semibold truncate"
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

              {/* Metadata */}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {product.bestStore && (
                  <div className="flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    <span>{product.bestStore}</span>
                  </div>
                )}
                {formattedDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formattedDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Price & Stats */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {product.bestPrice && (
                <div className="flex items-center gap-1 text-lg font-bold">
                  <TrendingDown className="w-4 h-4 text-green-600" />
                  <span data-testid={`text-best-price-${product.id}`}>
                    {parseFloat(product.bestPrice).toFixed(2)} ₽
                  </span>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                <span data-testid={`text-purchase-count-${product.id}`}>
                  {product.purchaseCount}x
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
