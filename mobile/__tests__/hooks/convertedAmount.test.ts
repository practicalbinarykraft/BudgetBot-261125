/**
 * Test: convertedAmount calculation from exchange rates API response.
 *
 * The /api/exchange-rates endpoint returns { rates: Record<string, number>, lastUpdated, source }.
 * The computeConvertedAmount function must correctly extract rates and compute USD equivalent.
 */
import { computeConvertedAmount } from "../../hooks/useAddTransactionScreen";

describe("computeConvertedAmount", () => {
  it("converts IDR to USD correctly", () => {
    const rates = { IDR: 15750, RUB: 92.5, EUR: 0.92 };
    const result = computeConvertedAmount("157500", "IDR", rates);
    expect(result).toBe("10.00");
  });

  it("converts RUB to USD correctly", () => {
    const rates = { IDR: 15750, RUB: 92.5, EUR: 0.92 };
    const result = computeConvertedAmount("9250", "RUB", rates);
    expect(result).toBe("100.00");
  });

  it("returns null when currency is USD", () => {
    const rates = { IDR: 15750, RUB: 92.5 };
    const result = computeConvertedAmount("100", "USD", rates);
    expect(result).toBeNull();
  });

  it("returns null when rate is missing for currency", () => {
    const rates = { IDR: 15750 };
    const result = computeConvertedAmount("1000", "KRW", rates);
    expect(result).toBeNull();
  });

  it("returns null when amount is empty", () => {
    const rates = { IDR: 15750 };
    const result = computeConvertedAmount("", "IDR", rates);
    expect(result).toBeNull();
  });

  it("returns null when rate is 0", () => {
    const rates = { IDR: 0 };
    const result = computeConvertedAmount("1000", "IDR", rates);
    expect(result).toBeNull();
  });

  it("returns null when rates object is empty", () => {
    const result = computeConvertedAmount("1000", "IDR", {});
    expect(result).toBeNull();
  });

  it("handles decimal amounts correctly", () => {
    const rates = { EUR: 0.92 };
    const result = computeConvertedAmount("92", "EUR", rates);
    expect(result).toBe("100.00");
  });
});
