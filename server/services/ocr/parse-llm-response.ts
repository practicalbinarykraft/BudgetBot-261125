import { logError } from '../../lib/logger';
import { normalizeItemName } from './normalize-item';
import type { ParsedReceipt } from './ocr-provider.types';

/**
 * Parse raw LLM text response into a ParsedReceipt.
 * Handles markdown-wrapped JSON, validates required fields,
 * and normalizes item names.
 *
 * Throws on invalid/unparseable responses.
 */
export function parseLlmResponse(text: string, providerLabel: string): ParsedReceipt {
  if (!text || text.trim().length === 0) {
    throw new Error(`${providerLabel} returned empty response. Receipt may be unreadable.`);
  }

  // Extract JSON from markdown block if present
  let jsonText = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  let parsed: ParsedReceipt;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    logError(`${providerLabel} OCR Parse Error`, error instanceof Error ? error : undefined, {
      responseStart: jsonText.substring(0, 300),
    });
    throw new Error(
      `Failed to parse ${providerLabel} response as JSON. Response: ${jsonText.substring(0, 200)}...`
    );
  }

  if (!parsed.items || !Array.isArray(parsed.items)) {
    throw new Error('Invalid receipt format: missing or invalid items array');
  }

  // Normalize item names for price comparison
  parsed.items = parsed.items.map(item => ({
    ...item,
    normalizedName: normalizeItemName(item.name),
  }));

  return parsed;
}
