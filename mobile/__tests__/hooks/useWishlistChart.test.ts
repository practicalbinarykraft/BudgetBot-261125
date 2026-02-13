import { computeWishlistMarkers } from "../../hooks/useWishlistChart";
import type { TrendDataPoint, WishlistItem } from "../../types";

function point(date: string, capital = 1000): TrendDataPoint {
  return { date, income: 500, expense: 300, capital, assetsNet: 0, isToday: false, isForecast: false };
}

function goal(id: number, affordableDate: string | null, name = "Goal"): WishlistItem {
  return {
    id,
    userId: 1,
    name,
    amount: "1000",
    targetDate: null,
    priority: "medium",
    sortOrder: id,
    isPurchased: false,
    prediction: affordableDate
      ? { canAfford: false, freeCapital: 500, monthsToAfford: 3, affordableDate }
      : null,
  };
}

describe("computeWishlistMarkers", () => {
  const trendData: TrendDataPoint[] = [
    point("2026-01-01"),
    point("2026-01-08"),
    point("2026-01-15"),
    point("2026-01-22"),
    point("2026-01-29"),
  ];

  it("exact date match → marker at correct index", () => {
    const items = [goal(1, "2026-01-15")];
    const markers = computeWishlistMarkers(trendData, items);
    expect(markers).toHaveLength(1);
    expect(markers[0].index).toBe(2);
    expect(markers[0].date).toBe("2026-01-15");
    expect(markers[0].items).toHaveLength(1);
  });

  it("date between two points → picks closest", () => {
    const items = [goal(1, "2026-01-10")]; // closer to 2026-01-08 (index 1)
    const markers = computeWishlistMarkers(trendData, items);
    expect(markers).toHaveLength(1);
    expect(markers[0].index).toBe(1);
  });

  it("date beyond last point → no marker", () => {
    const items = [goal(1, "2026-06-01")];
    const markers = computeWishlistMarkers(trendData, items);
    expect(markers).toHaveLength(0);
  });

  it("date before first point → no marker", () => {
    const items = [goal(1, "2025-06-01")];
    const markers = computeWishlistMarkers(trendData, items);
    expect(markers).toHaveLength(0);
  });

  it("multiple items same affordableDate → one marker with items[]", () => {
    const items = [
      goal(1, "2026-01-15", "iPhone"),
      goal(2, "2026-01-15", "MacBook"),
    ];
    const markers = computeWishlistMarkers(trendData, items);
    expect(markers).toHaveLength(1);
    expect(markers[0].items).toHaveLength(2);
    expect(markers[0].items[0].name).toBe("iPhone");
    expect(markers[0].items[1].name).toBe("MacBook");
  });

  it("items with null prediction → skipped", () => {
    const items = [goal(1, null)];
    const markers = computeWishlistMarkers(trendData, items);
    expect(markers).toHaveLength(0);
  });

  it("isPurchased items → skipped", () => {
    const purchased = { ...goal(1, "2026-01-15"), isPurchased: true };
    const markers = computeWishlistMarkers(trendData, [purchased]);
    expect(markers).toHaveLength(0);
  });

  it("empty wishlist → empty markers", () => {
    const markers = computeWishlistMarkers(trendData, []);
    expect(markers).toHaveLength(0);
  });

  it("empty trendData → empty markers", () => {
    const items = [goal(1, "2026-01-15")];
    const markers = computeWishlistMarkers([], items);
    expect(markers).toHaveLength(0);
  });

  it("multiple items on different dates → multiple markers sorted by index", () => {
    const items = [
      goal(1, "2026-01-08"),
      goal(2, "2026-01-22"),
    ];
    const markers = computeWishlistMarkers(trendData, items);
    expect(markers).toHaveLength(2);
    expect(markers[0].index).toBe(1);
    expect(markers[1].index).toBe(3);
  });
});
