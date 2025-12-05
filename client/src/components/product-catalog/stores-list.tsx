/**
 * Stores List Component
 *
 * Displays price breakdown by store.
 * ~85 lines - focused on store-level price analytics.
 */

import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/i18n/context";

interface PriceHistoryEntry {
  id: number;
  storeName: string;
  price: string;
  purchaseDate: string;
  priceOriginal?: string;
  currencyOriginal?: string;
  exchangeRate?: string;
}

interface StoresListProps {
  byStore: Record<string, PriceHistoryEntry[]>;
  currency: string;
}

export function StoresList({ byStore, currency }: StoresListProps) {
  const { t, language } = useTranslation();

  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const stores = Object.entries(byStore);

  if (stores.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="stores-heading">
      <h2 id="stores-heading" className="text-lg md:text-xl font-bold mb-4">
        {t("productDetail.byStore")}
      </h2>
      <ul className="space-y-3" role="list">
        {stores.map(([storeName, prices]) => {
          const avgPriceUsd = prices.reduce((sum, p) => sum + parseFloat(p.price), 0) / prices.length;
          const minPriceUsd = Math.min(...prices.map((p) => parseFloat(p.price)));

          const hasOriginal = prices.some((p) => p.priceOriginal && p.currencyOriginal);
          const storeCurrency = hasOriginal
            ? prices.find((p) => p.currencyOriginal)?.currencyOriginal || "USD"
            : "USD";
          const minOriginal = hasOriginal
            ? Math.min(...prices.filter((p) => p.priceOriginal).map((p) => parseFloat(p.priceOriginal!)))
            : minPriceUsd;
          const avgOriginal = hasOriginal
            ? prices.filter((p) => p.priceOriginal).reduce((sum, p) => sum + parseFloat(p.priceOriginal!), 0) /
              prices.filter((p) => p.priceOriginal).length
            : avgPriceUsd;

          return (
            <li key={storeName}>
              <Card data-testid={`card-store-${storeName}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                    <h3 className="font-semibold" data-testid={`text-store-name-${storeName}`}>
                      {storeName}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {prices.length} {t("productDetail.purchases")}
                    </span>
                  </div>

                  {hasOriginal ? (
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-green-600 font-semibold">
                          {t("productDetail.min")}: {formatPrice(minOriginal, storeCurrency)}
                        </span>
                        <span className="text-muted-foreground">
                          {t("productDetail.avg")}: {formatPrice(avgOriginal, storeCurrency)}
                        </span>
                      </div>
                      {storeCurrency !== "USD" && (
                        <div className="text-xs text-muted-foreground">
                          ≈ ${minPriceUsd.toFixed(2)} / ${avgPriceUsd.toFixed(2)} USD
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-green-600 font-semibold">
                        {t("productDetail.min")}: {formatPrice(minPriceUsd, currency)}
                      </span>
                      <span className="text-muted-foreground">
                        {t("productDetail.avg")}: {formatPrice(avgPriceUsd, currency)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
