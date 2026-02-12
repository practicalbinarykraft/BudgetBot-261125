import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import type { TrendDataPoint, WishlistItem } from "../types";

export interface WishlistChartMarker {
  index: number;
  date: string;
  items: WishlistItem[];
}

/**
 * Pure function: maps wishlist items to chart marker positions.
 *
 * Rules:
 * - Skip purchased items
 * - Skip items with no prediction or no affordableDate
 * - Skip if affordableDate is outside the chart range
 * - Group multiple items on the same closest point
 */
export function computeWishlistMarkers(
  sampledData: TrendDataPoint[],
  wishlistItems: WishlistItem[],
): WishlistChartMarker[] {
  if (sampledData.length === 0 || wishlistItems.length === 0) return [];

  const firstDate = sampledData[0].date;
  const lastDate = sampledData[sampledData.length - 1].date;

  // Group by closest chart point index
  const grouped = new Map<number, WishlistItem[]>();

  for (const item of wishlistItems) {
    if (item.isPurchased) continue;
    const ad = item.prediction?.affordableDate;
    if (!ad) continue;
    if (ad < firstDate || ad > lastDate) continue;

    // Find closest point by date string comparison (ISO dates sort lexicographically)
    let closestIdx = 0;
    let closestDiff = Infinity;
    for (let i = 0; i < sampledData.length; i++) {
      const diff = Math.abs(
        new Date(sampledData[i].date).getTime() - new Date(ad).getTime(),
      );
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIdx = i;
      }
    }

    const existing = grouped.get(closestIdx) || [];
    existing.push(item);
    grouped.set(closestIdx, existing);
  }

  // Convert to sorted array
  return Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([index, items]) => ({
      index,
      date: sampledData[index].date,
      items,
    }));
}

export function useWishlistChart(sampledData: TrendDataPoint[]) {
  const wishlistQuery = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => api.get<WishlistItem[]>("/api/wishlist"),
  });

  const wishlistItems = wishlistQuery.data || [];

  const markers = useMemo(
    () => computeWishlistMarkers(sampledData, wishlistItems),
    [sampledData, wishlistItems],
  );

  return {
    markers,
    wishlistItems,
    isLoading: wishlistQuery.isLoading,
  };
}
