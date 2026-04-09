import type { GirResult, GirTitrationRow, GlucoseBucket } from './types.js';

/**
 * Current GIR (mg/kg/min).
 *
 * Formula: dextrosePct * mlPerKgPerDay * (10/60) / 24
 *          = dextrosePct * mlPerKgPerDay / 144
 *
 * Derivation:
 *   GIR (mg/kg/min) = (Rate_mL/hr * Dex% * 10) / (Weight_kg * 60)
 *   with Rate_mL/hr = Weight_kg * mlPerKgPerDay / 24, the weight cancels:
 *   GIR = (Weight * mlKgDay / 24 * Dex% * 10) / (Weight * 60)
 *       = Dex% * mlKgDay * (10 / (24 * 60))
 *       = Dex% * mlKgDay / 144
 *
 * Verified against MDCalc + Hawkes J Perinatol (PMC7286731).
 * Uses exact 10/60 — never the spreadsheet's truncated constant.
 * Parity tests allow 1% epsilon to reconcile against spreadsheet truncation.
 */
export function calculateCurrentGir(
  weightKg: number,
  dextrosePct: number,
  mlPerKgPerDay: number,
): number {
  // weightKg unused in simplified formula but kept in signature for clinical clarity + audit
  void weightKg;
  return (dextrosePct * mlPerKgPerDay * (10 / 60)) / 24;
}

/**
 * Initial rate (ml/hr) = weight * mlPerKgPerDay / 24
 * Spreadsheet: 3.93 * 65 / 24 = 10.64375 (exact).
 */
export function calculateInitialRateMlHr(weightKg: number, mlPerKgPerDay: number): number {
  return (weightKg * mlPerKgPerDay) / 24;
}

/**
 * Inverse: given target GIR, back-solve to target fluids (ml/kg/day) at the same dextrose%,
 * then to target rate (ml/hr).
 *   targetFluidsMlKgDay = targetGir * 24 / (dextrosePct * 10 / 60)
 *   targetRateMlHr      = targetFluidsMlKgDay * weightKg / 24
 *   deltaRateMlHr       = targetRateMlHr - initialRateMlHr
 */
export function calculateTitrationRows(
  weightKg: number,
  dextrosePct: number,
  mlPerKgPerDay: number,
  buckets: GlucoseBucket[],
): GirTitrationRow[] {
  const currentGir = calculateCurrentGir(weightKg, dextrosePct, mlPerKgPerDay);
  const initialRate = calculateInitialRateMlHr(weightKg, mlPerKgPerDay);

  return buckets.map((b) => {
    const targetGir = currentGir + b.targetGirDelta;
    const targetFluids = (targetGir * 24) / (dextrosePct * (10 / 60));
    const targetRate = (targetFluids * weightKg) / 24;
    return {
      bucketId: b.id,
      label: b.label,
      action: b.action,
      targetGirMgKgMin: targetGir,
      targetFluidsMlKgDay: targetFluids,
      targetRateMlHr: targetRate,
      deltaRateMlHr: targetRate - initialRate,
    };
  });
}

export function calculateGir(
  state: { weightKg: number | null; dextrosePct: number | null; mlPerKgPerDay: number | null },
  buckets: GlucoseBucket[],
): GirResult | null {
  const { weightKg, dextrosePct, mlPerKgPerDay } = state;
  if (weightKg == null || dextrosePct == null || mlPerKgPerDay == null) return null;
  return {
    currentGirMgKgMin: calculateCurrentGir(weightKg, dextrosePct, mlPerKgPerDay),
    initialRateMlHr: calculateInitialRateMlHr(weightKg, mlPerKgPerDay),
    titration: calculateTitrationRows(weightKg, dextrosePct, mlPerKgPerDay, buckets),
  };
}
