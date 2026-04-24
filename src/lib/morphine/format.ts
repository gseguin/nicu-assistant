/**
 * Format a milligram value as a 3-decimal string for display.
 * Display formatting only — never used inside calculation code (D-21).
 *
 * Defensive: returns '0.000' for NaN, Infinity, -Infinity so the hero
 * never shows 'NaN' or 'Infinity' in a clinical surface.
 */
export function formatMg(value: number): string {
  if (!Number.isFinite(value)) return '0.000';
  return value.toFixed(3);
}

/**
 * Format a percentage value as a 2-decimal string with % suffix.
 *
 * Defensive: returns '0.00%' for NaN, Infinity, -Infinity.
 */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0.00%';
  return value.toFixed(2) + '%';
}
