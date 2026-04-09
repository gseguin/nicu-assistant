/**
 * Normalize raw text pasted into a numeric input so downstream parsing is locale-safe.
 *
 * Rules (in order):
 *   1. Trim ASCII + unicode whitespace (including \t, \n, \r, NBSP)
 *   2. Replace commas with decimal points (fr-CA / fr-FR locale paste from EPIC)
 *
 * We do NOT parseFloat here — caller owns validation. This helper is idempotent
 * and safe to call on any string. Non-numeric content passes through unchanged
 * (minus trimming / comma swap) so the NumericInput component can display the
 * user's invalid entry and surface an advisory warning.
 */
export function normalizeNumericInput(raw: string): string {
  return raw
    .trim()
    .replace(/\u00A0/g, '')   // strip non-breaking spaces from EPIC rich-text paste
    .replace(/,/g, '.');      // locale comma → decimal point
}
