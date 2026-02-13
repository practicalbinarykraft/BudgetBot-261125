export interface ReceiptErrorClassification {
  messageKey: string;
  canRetry: boolean;
}

export function classifyReceiptError(error: unknown): ReceiptErrorClassification {
  const isErrorLike = error != null && typeof error === "object" && "message" in error;
  const msg = isErrorLike ? String((error as any).message || "") : "";
  const name = isErrorLike ? String((error as any).name || "") : "";

  // Auth errors — not retryable
  if (msg === "Unauthorized") {
    return { messageKey: "receipts.error_unauthorized", canRetry: false };
  }
  if (msg.includes("INSUFFICIENT_CREDITS")) {
    return { messageKey: "receipts.error_no_credits", canRetry: false };
  }

  // Network errors — retryable
  if (
    error instanceof TypeError ||
    msg.toLowerCase().includes("network") ||
    msg.toLowerCase().includes("failed to fetch")
  ) {
    return { messageKey: "receipt.error_network", canRetry: true };
  }

  // Timeout / abort — retryable
  if (name === "AbortError" || msg.toLowerCase().includes("timeout")) {
    return { messageKey: "receipt.error_timeout", canRetry: true };
  }

  // Server errors (5xx) — retryable
  if (/Request failed: 5\d{2}/.test(msg)) {
    return { messageKey: "receipt.error_server", canRetry: true };
  }

  // Unknown — retryable (let user try again)
  return { messageKey: "receipt.error_unknown", canRetry: true };
}
