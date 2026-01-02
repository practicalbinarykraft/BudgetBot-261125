/**
 * Product Detail Page
 *
 * Displays product information with price history and store comparison.
 * ~130 lines - composed of smaller components.
 *
 * Junior-Friendly:
 * - Was 388 lines, now ~130 lines
 * - Header, stats, and stores list extracted to components
 * - Clear separation of concerns
 */

import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/i18n/context";
import { ArrowLeft, Search, Package } from "lucide-react";
import { useState } from "react";
import { PriceHistoryChart } from "@/components/product-catalog/price-history-chart";
import { PriceSearchModal } from "@/components/product-catalog/price-search-modal";
import { ProductHeader } from "@/components/product-catalog/product-header";
import { ProductStatsCards } from "@/components/product-catalog/product-stats-cards";
import { StoresList } from "@/components/product-catalog/stores-list";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ProductCatalog } from "@shared/schemas/product-catalog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface PriceHistoryEntry {
  id: number;
  storeName: string;
  price: string;
  purchaseDate: string;
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
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();  const { toast } = useToast();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch settings for currency
  const { data: settings } = useQuery<{
    currency?: string;
    exchangeRateRUB?: string;
    exchangeRateIDR?: string;
    exchangeRateKRW?: string;
    exchangeRateEUR?: string;
    exchangeRateCNY?: string;
  }>({
    queryKey: ["/api/settings"],
  });

  const currency = settings?.currency || "USD";
  const exchangeRate =
    currency === "USD" ? 1 :
    currency === "RUB" ? parseFloat(settings?.exchangeRateRUB || "92.5") :
    currency === "IDR" ? parseFloat(settings?.exchangeRateIDR || "15750") :
    currency === "KRW" ? parseFloat(settings?.exchangeRateKRW || "1320") :
    currency === "EUR" ? parseFloat(settings?.exchangeRateEUR || "0.92") :
    currency === "CNY" ? parseFloat(settings?.exchangeRateCNY || "7.24") : 1;

  // Fetch product
  const { data: product, isLoading: productLoading } = useQuery<ProductCatalog>({
    queryKey: ["/api/product-catalog", id],
    enabled: !!id,
  });

  // Fetch price history
  const { data: priceData } = useQuery<PriceHistoryData>({
    queryKey: ["/api/product-catalog", id, "price-history"],
    enabled: !!id && !!product,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/product-catalog/${id}`);
    },
    onSuccess: () => {
      toast({ title: t("productDetail.deleteSuccess") });
      queryClient.invalidateQueries({ queryKey: ["/api/product-catalog"] });
      navigate("/app/product-catalog");
    },
    onError: () => {
      toast({ title: t("productDetail.deleteError"), variant: "destructive" });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  // Loading state
  if (productLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl" aria-busy="true">
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

  // Not found state
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">{t("productDetail.notFound")}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/app/product-catalog">
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                {t("productDetail.back")}
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
        <Link href="/app/product-catalog">
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          {t("productDetail.back")}
        </Link>
      </Button>

      <ProductHeader
        product={product}
        showDeleteDialog={showDeleteDialog}
        onDeleteDialogChange={setShowDeleteDialog}
        onDelete={handleDelete}
        isDeleting={deleteMutation.isPending}
      />

      <ProductStatsCards
        product={product}
        currency={currency}
        exchangeRate={exchangeRate}
      />

      <Button
        onClick={() => setShowSearchModal(true)}
        className="w-full mb-6"
        size="lg"
        data-testid="button-search-prices"
      >
        <Search className="w-5 h-5 mr-2" aria-hidden="true" />
        {t("productDetail.searchPrices")}
      </Button>

      {priceData?.priceHistory && priceData.priceHistory.length > 0 && (
        <div className="mb-6">
          <PriceHistoryChart data={priceData.priceHistory} />
        </div>
      )}

      {priceData?.byStore && <StoresList byStore={priceData.byStore} currency={currency} />}

      {showSearchModal && (
        <PriceSearchModal
          productId={parseInt(id!)}
          productName={product.name}
          currency={currency}
          onClose={() => setShowSearchModal(false)}
        />
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

  );
}  );
}
