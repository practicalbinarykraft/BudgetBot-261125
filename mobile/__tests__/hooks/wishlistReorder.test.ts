import { buildReorderPayload } from "../../hooks/useWishlistReorder";
import type { WishlistItem } from "../../types";

function item(id: number, sortOrder: number): WishlistItem {
  return {
    id,
    userId: 1,
    name: `Item ${id}`,
    amount: "100",
    targetDate: null,
    priority: "medium",
    sortOrder,
    isPurchased: false,
    prediction: null,
  };
}

describe("buildReorderPayload", () => {
  it("assigns sortOrder 1..N in order", () => {
    const items = [item(10, 0), item(20, 0), item(30, 0)];
    const payload = buildReorderPayload(items);
    expect(payload).toEqual([
      { id: 10, sortOrder: 1 },
      { id: 20, sortOrder: 2 },
      { id: 30, sortOrder: 3 },
    ]);
  });

  it("preserves item ids after reorder", () => {
    const items = [item(30, 0), item(10, 0), item(20, 0)]; // dragged order
    const payload = buildReorderPayload(items);
    expect(payload[0].id).toBe(30);
    expect(payload[1].id).toBe(10);
    expect(payload[2].id).toBe(20);
  });

  it("empty list → empty payload", () => {
    const payload = buildReorderPayload([]);
    expect(payload).toEqual([]);
  });

  it("single item → [{ id, sortOrder: 1 }]", () => {
    const payload = buildReorderPayload([item(5, 0)]);
    expect(payload).toEqual([{ id: 5, sortOrder: 1 }]);
  });
});
