/**
 * Test: classifyReceiptError pure function
 * Covers all error categories: network, timeout, auth, credits, server, unknown.
 */
import { classifyReceiptError } from "../../lib/receipt-errors";

describe("classifyReceiptError", () => {
  it("classifies network errors (TypeError / Network request failed)", () => {
    const result = classifyReceiptError(new TypeError("Network request failed"));
    expect(result.messageKey).toBe("receipt.error_network");
    expect(result.canRetry).toBe(true);
  });

  it("classifies fetch abort / network errors", () => {
    const result = classifyReceiptError(new Error("Failed to fetch"));
    expect(result.messageKey).toBe("receipt.error_network");
    expect(result.canRetry).toBe(true);
  });

  it("classifies timeout errors", () => {
    const result = classifyReceiptError(new Error("timeout"));
    expect(result.messageKey).toBe("receipt.error_timeout");
    expect(result.canRetry).toBe(true);
  });

  it("classifies AbortError as timeout", () => {
    const err = new DOMException("The operation was aborted", "AbortError");
    const result = classifyReceiptError(err);
    expect(result.messageKey).toBe("receipt.error_timeout");
    expect(result.canRetry).toBe(true);
  });

  it("classifies Unauthorized errors", () => {
    const result = classifyReceiptError(new Error("Unauthorized"));
    expect(result.messageKey).toBe("receipts.error_unauthorized");
    expect(result.canRetry).toBe(false);
  });

  it("classifies INSUFFICIENT_CREDITS errors", () => {
    const result = classifyReceiptError(new Error("INSUFFICIENT_CREDITS"));
    expect(result.messageKey).toBe("receipts.error_no_credits");
    expect(result.canRetry).toBe(false);
  });

  it("classifies server errors (5xx)", () => {
    const result = classifyReceiptError(new Error("Request failed: 500"));
    expect(result.messageKey).toBe("receipt.error_server");
    expect(result.canRetry).toBe(true);
  });

  it("classifies 502 as server error", () => {
    const result = classifyReceiptError(new Error("Request failed: 502"));
    expect(result.messageKey).toBe("receipt.error_server");
    expect(result.canRetry).toBe(true);
  });

  it("classifies unknown errors", () => {
    const result = classifyReceiptError(new Error("Something weird happened"));
    expect(result.messageKey).toBe("receipt.error_unknown");
    expect(result.canRetry).toBe(true);
  });

  it("handles non-Error objects gracefully", () => {
    const result = classifyReceiptError("string error" as any);
    expect(result.messageKey).toBe("receipt.error_unknown");
    expect(result.canRetry).toBe(true);
  });
});
