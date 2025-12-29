/**
 * Safe JSON parsing utilities
 * Prevents crashes from malformed JSON in callback data
 */

export type ParseResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

/**
 * Safely parse JSON with a fallback value
 * @param str - JSON string to parse
 * @param fallback - Value to return if parsing fails
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * Try to parse JSON and return a result object
 * @param str - JSON string to parse
 */
export function tryParseJson<T = unknown>(str: string): ParseResult<T> {
  try {
    const data = JSON.parse(str) as T;
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    return { success: false, error: message };
  }
}

/**
 * Parse callback data from Telegram inline buttons
 * Expected format: "action:jsonPayload" or just "action"
 */
export function parseCallbackData<T = unknown>(
  data: string
): { action: string; payload: T | null } {
  const colonIndex = data.indexOf(':');

  if (colonIndex === -1) {
    return { action: data, payload: null };
  }

  const action = data.substring(0, colonIndex);
  const jsonPart = data.substring(colonIndex + 1);

  const result = tryParseJson<T>(jsonPart);

  return {
    action,
    payload: result.success ? result.data : null,
  };
}

/**
 * Safely stringify object to JSON
 */
export function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
}
