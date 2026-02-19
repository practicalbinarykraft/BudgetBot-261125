/**
 * Shared prompt builder for OCR receipt parsing.
 * Used by all providers — single source of truth for the prompt format.
 */
export function buildReceiptPrompt(isMulti: boolean): string {
  return `
Parse this receipt ${isMulti ? '(split across multiple photos — combine all items into ONE result)' : 'image'} and extract structured data.

Return ONLY valid JSON in this exact format (no explanations, no markdown):
{
  "total": 180000,
  "currency": "IDR",
  "merchant": "Moris Grocier",
  "date": "2025-11-17",
  "items": [
    {
      "name": "Orange Juice 1L",
      "quantity": 2,
      "pricePerUnit": 32000,
      "totalPrice": 64000
    },
    {
      "name": "Bread White",
      "quantity": 1,
      "pricePerUnit": 25000,
      "totalPrice": 25000
    }
  ]
}

Required fields:
1. total - final receipt total (number)
2. currency - 3-letter currency code (USD, IDR, RUB, EUR, etc.) - detect from receipt symbols or context
3. merchant - store/merchant name (string)
4. date - purchase date in YYYY-MM-DD format (string)
5. items - array of purchased items with:
   - name: item description from receipt (string)
   - quantity: number of units (default 1 if not specified)
   - pricePerUnit: price for one unit (number)
   - totalPrice: total price for this item (number)

Rules:
- All prices in original currency (keep as shown on receipt)
- Detect currency from symbols: $ → USD, Rp → IDR, ₽ → RUB, € → EUR
- If currency symbol unclear, infer from merchant location/name
- If quantity not specified, use 1
- Calculate: pricePerUnit = totalPrice / quantity
- Extract ALL items from receipt${isMulti ? ' across ALL photos' : ''}
- ${isMulti ? 'Deduplicate items if same item appears on overlapping photos' : ''}
- Return ONLY valid JSON, no other text
  `.trim();
}
