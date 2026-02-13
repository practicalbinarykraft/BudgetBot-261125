/**
 * Test: normalizePaginatedData handles both API response formats.
 * Guards against the bug where /api/categories without ?limit returns
 * a plain array, while with ?limit returns { data: [...] }.
 */
import { normalizePaginatedData } from "../../lib/query-client";

interface Item { id: number; name: string }

const items: Item[] = [
  { id: 1, name: "Food" },
  { id: 2, name: "Transport" },
];

describe("normalizePaginatedData", () => {
  it("extracts data from paginated response { data: [...] }", () => {
    const result = normalizePaginatedData<Item>({ data: items, pagination: { total: 2 } });
    expect(result).toEqual(items);
  });

  it("returns plain array as-is", () => {
    const result = normalizePaginatedData<Item>(items);
    expect(result).toEqual(items);
  });

  it("returns [] for null", () => {
    expect(normalizePaginatedData(null)).toEqual([]);
  });

  it("returns [] for undefined", () => {
    expect(normalizePaginatedData(undefined)).toEqual([]);
  });

  it("returns [] for unexpected shape (string)", () => {
    expect(normalizePaginatedData("oops")).toEqual([]);
  });

  it("returns [] for object without data key", () => {
    expect(normalizePaginatedData({ total: 5 })).toEqual([]);
  });

  it("returns [] for { data: 'not-array' }", () => {
    expect(normalizePaginatedData({ data: "bad" })).toEqual([]);
  });
});
