/**
 * Asset Detail Page
 *
 * Displays detailed information about a single asset.
 * ~110 lines - composed of smaller card components.
 *
 * Junior-Friendly:
 * - Was 440 lines, now ~110 lines
 * - Each card is a separate component (<100 lines)
 * - Clear separation of concerns
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { AssetWithCategory, AssetValuation } from "@/lib/types/assets";
import {
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
  AssetHeader,
  AssetValueCard,
  AssetChartCard,
  AssetCashflowCard,
  CalibrationModal,
} from "@/components/assets";

interface AssetDetailResponse {
  success: boolean;
  data: {
    asset: AssetWithCategory;
    valuations: AssetValuation[];
    change: {
      changeAmount: number;
      changePercent: number;
      ownershipYears: number;
    } | null;
  };
}

export default function AssetDetailPage() {
  const [, params] = useRoute("/app/assets/:id");

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();  const assetId = params?.id ? parseInt(params.id) : null;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCalibration, setShowCalibration] = useState(false);

  // Fetch asset data
  const { data: response, isLoading } = useQuery<AssetDetailResponse>({
    queryKey: [`/api/assets/${assetId}`],
    enabled: !!assetId,
  });

  const data = response?.data;
  const asset = data?.asset;
  const valuations = data?.valuations || [];
  const change = data?.change;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets/summary"] });
      toast({
        title: "Asset deleted",
        description: "The asset has been successfully removed.",
      });
      window.location.href = "/app/assets";
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete asset",
        variant: "destructive",
      });
    },
  });

  // Loading state
  if (isLoading) {
    return (
    <>
      <div className="space-y-6 pb-20 sm:pb-6" aria-busy="true">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Not found state
  if (!asset) {
    return (
    <>
      <div className="space-y-6 pb-20 sm:pb-6">
        <p className="text-center text-muted-foreground">Asset not found</p>
        <div className="text-center">
          <Link href="/app/assets">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back to Assets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentValue = parseFloat(asset.currentValue);
  const isPositive = (change?.changePercent || 0) >= 0;

  // Prepare chart data
  const chartData = valuations
    .map((v) => ({
      date: v.valuationDate,
      value: parseFloat(v.value),
    }))
    .reverse();

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this asset?")) {
      deleteMutation.mutate();
    }
  };

  const handleCalibrationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/assets/${assetId}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/assets/summary"] });
    setShowCalibration(false);
  };

  return (
    <>
      <div className="space-y-6 pb-20 sm:pb-6">
      {/* Back Navigation */}
      <Link href="/app/assets">
        <Button variant="outline" data-testid="button-back" aria-label="Back to assets list">
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          Back to Assets
        </Button>
      </Link>

      {/* Header with image and title */}
      <AssetHeader
        asset={asset}
        onEdit={() => {}}
        onDelete={handleDelete}
      />

      {/* Current Value */}
      <AssetValueCard
        currentValue={currentValue}
        change={change}
        onCalibrate={() => setShowCalibration(true)}
      />

      {/* Price History Chart */}
      <AssetChartCard chartData={chartData} isPositive={isPositive} />

      {/* Cash Flow */}
      <AssetCashflowCard
        monthlyIncome={parseFloat(asset.monthlyIncome || "0")}
        monthlyExpense={parseFloat(asset.monthlyExpense || "0")}
        ownershipYears={change?.ownershipYears}
      />

      {/* Notes */}
      {asset.notes && (
        <Card>
          <div className="p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Notes</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{asset.notes}</p>
          </div>
        </Card>
      )}

      {/* Calibration Modal */}
      <CalibrationModal
        open={showCalibration}
        onOpenChange={setShowCalibration}
        asset={asset}
        onSuccess={handleCalibrationSuccess}
      />
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
