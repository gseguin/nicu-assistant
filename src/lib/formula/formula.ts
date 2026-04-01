// src/lib/formula/formula.ts
// Pure formula calculation functions for infant formula recipe computation.
// No side effects, no Svelte imports, no app state — fully testable and auditable.
//
// Source of truth: Recipe Calculator.xlsx.ods, "Modified Recipes" sheet.

import { type BrandConfig } from '$lib/formula/formula-config';

// ============================================================
// Types
// ============================================================

export interface FormulaResult {
  mL_water: number;
  g_powder: number;
  scoops: number | null;
  packets: number | null;
  tbsp: number | null;
  tsp: number | null;
}

/**
 * Result for Breast Milk Fortifier (BMF) mode.
 * Identical structure to FormulaResult but labeled mL_ebm for clarity.
 */
export interface BMFResult extends Omit<FormulaResult, 'mL_water'> {
  mL_ebm: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================
// Constants
// ============================================================

/**
 * Standard fluid ounce to milliliter conversion: 1 fl oz = 29.57 mL.
 * Referenced in Recipe Calculator.xlsx.ods, cell E7 (column label "29.57").
 */
const ML_PER_OZ = 29.57;

// ============================================================
// Input Validation
// ============================================================

/**
 * Validate recipe inputs before calculation.
 *
 * Returns { valid: true, errors: [] } when all inputs are acceptable.
 * Returns { valid: false, errors: [...] } with descriptive messages for each
 * invalid input — suitable for displaying in a clinical UI.
 *
 * @param desired_kcal_oz - Target calorie concentration in kcal per fluid oz (must be > 0)
 * @param total_mL        - Total desired recipe volume in mL (must be > 0)
 */
export function validateRecipeInputs(
  desired_kcal_oz: number,
  total_mL: number
): ValidationResult {
  const errors: string[] = [];

  if (!isFinite(desired_kcal_oz) || desired_kcal_oz <= 0) {
    errors.push('Target calorie concentration must be greater than 0');
  }

  if (!isFinite(total_mL) || total_mL <= 0) {
    errors.push('Total volume must be greater than 0');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Breast Milk Fortifier inputs.
 *
 * @param desired_kcal_oz      - Target calorie concentration (must be > baseline)
 * @param total_mL             - Total desired volume (must be > 0)
 * @param baseline_ebm_kcal_oz - Baseline EBM calorie density (usually 20, must be > 0)
 */
export function validateBMFInputs(
  desired_kcal_oz: number,
  total_mL: number,
  baseline_ebm_kcal_oz: number
): ValidationResult {
  const { errors } = validateRecipeInputs(desired_kcal_oz, total_mL);

  if (!isFinite(baseline_ebm_kcal_oz) || baseline_ebm_kcal_oz <= 0) {
    errors.push('Baseline EBM calories must be greater than 0');
  }

  if (desired_kcal_oz <= baseline_ebm_kcal_oz) {
    errors.push('Target calories must be greater than baseline EBM calories');
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// Core Recipe Calculation
// ============================================================

/**
 * Calculate a Modified Formula recipe from brand data, desired calorie
 * concentration, and desired total volume.
 *
 * ── FORMULA DERIVATION ──────────────────────────────────────────────────────
 *
 * Verified against Recipe Calculator.xlsx.ods, "Modified Recipes" sheet.
 * Cell references below correspond to that spreadsheet.
 *
 * INPUTS (from spreadsheet):
 *   E4  = displacement_mL_per_g   (e.g., 0.76 mL/g)
 *   E6  = kcal_per_g              (e.g., 4.69 kcal/g)
 *   E7  = 29.57                   (mL per fluid oz, standard conversion)
 *   E8  = desired_kcal_oz         (e.g., 28 kcal/oz)
 *   E10 = total_mL                (e.g., 237 mL)
 *   E12 = g_per_scoop             (e.g., 9.5 g/scoop)
 *
 * SPREADSHEET FORMULAS:
 *
 *   C7  concentration_factor  = (E8 / E6) / (E7 - (E8 / E6) × E4)
 *   H7  mL_water              = E10 / (1 + C7 × E4)
 *   H8  g_powder              = H7 × C7
 *   H9  scoops                = H8 / E12
 *
 * ALGEBRAIC SIMPLIFICATION:
 *
 *   Let k = desired_kcal_oz / kcal_per_g     (powder mass needed per mL at 1 kcal/oz)
 *   Let C = k / (29.57 - k × disp)           (concentration factor C7)
 *
 *   g_powder = mL_water × C
 *            = [total_mL / (1 + C × disp)] × C
 *            = total_mL × C / (1 + C × disp)
 *
 *   Substitute C = k / (29.57 - k × disp):
 *            = total_mL × [k / (29.57 - k×disp)]
 *                       / [1 + (k / (29.57 - k×disp)) × disp]
 *            = total_mL × k / [(29.57 - k×disp) + k×disp]
 *            = total_mL × k / 29.57
 *
 *   RESULT:
 *     g_powder = (desired_kcal_oz × total_mL) / (29.57 × kcal_per_g)
 *
 *   Importantly, displacement does NOT appear in the g_powder formula directly.
 *   It enters only in the water calculation:
 *     mL_water = total_mL − (g_powder × displacement_mL_per_g)
 *
 * VERIFICATION (spreadsheet reference row with E4=0.76):
 *   Inputs:  displacement=0.76, kcal/g=4.69, desired=28 kcal/oz, total=237 mL
 *   g_powder = (28 × 237) / (29.57 × 4.69)  = 47.850... → rounds to 47.9 g
 *   mL_water = 237 − (47.850 × 0.76)        = 200.634... → rounds to 201 mL
 *   scoops   = 47.850 / 9.5                 = 5.036...   → rounds to 5.0 scoops
 *   These match spreadsheet cells H7=200.63, H8=47.85, H9=5.04 exactly.
 *
 * NOTE ON PLAN DISCREPANCY:
 *   The plan frontmatter listed the formula as:
 *     g_powder = (desired_kcal_oz × total_mL) / (29.57 × kcal_per_g + displacement × kcal_per_g)
 *   This is mathematically incorrect (produces ~46.65 g vs correct 47.85 g for reference row).
 *   The spreadsheet was verified as the authoritative source; the formula above is correct.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *
 * @param brand           - Brand configuration (displacement, kcal/g, scoop sizes)
 * @param desired_kcal_oz - Target calorie concentration in kcal per fluid oz
 * @param total_mL        - Total desired recipe volume in mL
 * @returns FormulaResult with all recipe outputs (nulls for non-applicable measurements)
 * @throws Error if inputs are invalid or brand lacks calorie data (kcalPerG is null)
 */
export function calculateRecipe(
  brand: BrandConfig,
  desired_kcal_oz: number,
  total_mL: number
): FormulaResult {
  const validation = validateRecipeInputs(desired_kcal_oz, total_mL);
  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }

  if (brand.kcalPerG === null) {
    throw new Error(
      `Brand "${brand.brand}" does not have calorie density data (kcalPerG is null). Cannot calculate recipe.`
    );
  }

  // Step 1: Calculate powder mass needed.
  //   g_powder = (desired_kcal_oz × total_mL) / (29.57 × kcal_per_g)
  //   Algebraically derived from concentration_factor approach in spreadsheet.
  //   Displacement does NOT appear here — see derivation comment above.
  const g_powder_exact = (desired_kcal_oz * total_mL) / (ML_PER_OZ * brand.kcalPerG);
  const g_powder = Math.round(g_powder_exact * 10) / 10; // 1 decimal place (D-10)

  // Step 2: Calculate water volume.
  //   Powder displaces water: subtract the volume occupied by powder.
  //   mL_water = total_mL − (g_powder × displacement_mL_per_g)
  const mL_water_exact = total_mL - g_powder * brand.displacementMlPerG;
  const mL_water = Math.round(mL_water_exact); // whole mL (D-10)

  // Step 3: Calculate dispensing measures.
  const scoops = calculateScoops(g_powder, brand);
  const packets = brand.packetLabel !== null ? calculatePackets(g_powder, brand.packetLabel) : null;
  const tbsp = brand.gPerTbsp !== null ? Math.round((g_powder / brand.gPerTbsp) * 10) / 10 : null;
  const tsp = brand.gPerTsp !== null ? Math.round((g_powder / brand.gPerTsp) * 10) / 10 : null;

  return { mL_water, g_powder, scoops, packets, tbsp, tsp };
}

/**
 * Calculate a Breast Milk Fortifier (BMF) recipe.
 *
 * Used to fortify expressed breast milk (EBM) with powder to reach a target
 * calorie concentration. Accounts for powder displacement.
 *
 * ALGEBRAIC DERIVATION:
 *   Let k_target = desired_kcal_oz / 29.57    (Target kcal/mL)
 *   Let k_base   = baseline_ebm_kcal_oz / 29.57 (Baseline EBM kcal/mL)
 *   Let k_powder = kcal_per_g                  (Powder kcal/g)
 *   Let d        = displacement_mL_per_g       (Powder displacement mL/g)
 *   Let V_total  = total_mL
 *
 *   Total Calories = V_ebm * k_base + g_powder * k_powder
 *   Total Volume   = V_ebm + g_powder * d
 *
 *   Substitute V_ebm = V_total - g_powder * d:
 *   V_total * k_target = (V_total - g_powder * d) * k_base + g_powder * k_powder
 *   V_total * k_target = V_total * k_base - g_powder * d * k_base + g_powder * k_powder
 *   V_total * (k_target - k_base) = g_powder * (k_powder - d * k_base)
 *
 *   g_powder = V_total * (k_target - k_base) / (k_powder - d * k_base)
 *
 * @param brand                - Brand configuration
 * @param desired_kcal_oz      - Target calorie concentration in kcal per fluid oz
 * @param total_mL             - Total desired recipe volume in mL
 * @param baseline_ebm_kcal_oz - Baseline EBM calorie density (default 20)
 */
export function calculateBMF(
  brand: BrandConfig,
  desired_kcal_oz: number,
  total_mL: number,
  baseline_ebm_kcal_oz: number = 20
): BMFResult {
  const validation = validateBMFInputs(desired_kcal_oz, total_mL, baseline_ebm_kcal_oz);
  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }

  if (brand.kcalPerG === null) {
    throw new Error(
      `Brand "${brand.brand}" lacks calorie data. Cannot calculate BMF.`
    );
  }

  const k_target = desired_kcal_oz / ML_PER_OZ;
  const k_base = baseline_ebm_kcal_oz / ML_PER_OZ;
  const k_powder = brand.kcalPerG;
  const d = brand.displacementMlPerG;

  // g_powder = V_total * (k_target - k_base) / (k_powder - d * k_base)
  const g_powder_exact = (total_mL * (k_target - k_base)) / (k_powder - d * k_base);
  const g_powder = Math.round(g_powder_exact * 10) / 10;

  // mL_ebm = total_mL - (g_powder * displacement)
  const mL_ebm_exact = total_mL - g_powder * d;
  const mL_ebm = Math.round(mL_ebm_exact);

  // dispensing measures (re-use logic)
  const scoops = calculateScoops(g_powder, brand);
  const packets = brand.packetLabel !== null ? calculatePackets(g_powder, brand.packetLabel) : null;
  const tbsp = brand.gPerTbsp !== null ? Math.round((g_powder / brand.gPerTbsp) * 10) / 10 : null;
  const tsp = brand.gPerTsp !== null ? Math.round((g_powder / brand.gPerTsp) * 10) / 10 : null;

  return { mL_ebm, g_powder, scoops, packets, tbsp, tsp };
}

// ============================================================
// Dispensing Helpers
// ============================================================

/**
 * Calculate the number of scoops for a given powder mass.
 *
 * Returns null if the brand uses packet-based or weight-only dispensing
 * (i.e., brand.gPerScoop is null).
 *
 * Rounded to 1 decimal place (D-10).
 *
 * @param g_powder - Powder mass in grams
 * @param brand    - Brand configuration
 */
export function calculateScoops(g_powder: number, brand: BrandConfig): number | null {
  if (brand.gPerScoop === null) {
    return null;
  }
  return Math.round((g_powder / brand.gPerScoop) * 10) / 10;
}

/**
 * Calculate the number of packets for a given powder mass.
 *
 * Parses the packet label (e.g., "1 pkt = 80 g") to extract grams per packet.
 * Returns null if the label cannot be parsed.
 *
 * Rounded to 1 decimal place (D-10).
 *
 * @param g_powder    - Powder mass in grams
 * @param packetLabel - Human-readable label, e.g., "1 pkt = 80 g"
 */
export function calculatePackets(g_powder: number, packetLabel: string): number | null {
  const g_per_packet = parsePacketSize(packetLabel);
  if (g_per_packet === null) {
    return null;
  }
  return Math.round((g_powder / g_per_packet) * 10) / 10;
}

/**
 * Extract the grams-per-packet numeric value from a packet label string.
 *
 * Handles labels of the form "1 pkt = X g" (case-insensitive).
 * Known packet labels from Displacement.xlsx (D-12):
 *   - Tolerex:           "1 pkt = 80 g"     → 80
 *   - Vivonex Pediatric: "1 pkt = 48.5 g"   → 48.5
 *   - Vivonex Plus:      "1 pkt = 79.5 g"   → 79.5
 *
 * Returns null if the pattern does not match or the value is not a finite positive number.
 *
 * @param packetLabel - Raw label string from formula-config.json
 */
export function parsePacketSize(packetLabel: string): number | null {
  // Match "= X g" or "= X.Y g" anywhere in the string (case-insensitive)
  const match = packetLabel.match(/=\s*([\d.]+)\s*g/i);
  if (!match) {
    return null;
  }
  const value = parseFloat(match[1]);
  if (!isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

// ============================================================
// Output Formatting
// ============================================================

/**
 * Format a numeric recipe output for display.
 *
 * Returns an empty string when value is null (non-applicable measurement).
 * Returns "{value} {unit}" otherwise (e.g., "150 mL", "9.5 g", "2.0 scoops").
 *
 * @param value - Numeric value to format, or null for N/A
 * @param unit  - Unit label (e.g., "mL", "g", "scoops")
 */
export function formatOutput(value: number | null, unit: string): string {
  if (value === null) {
    return '';
  }
  return `${value} ${unit}`;
}
