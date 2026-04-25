/**
 * Fortification formula loader.
 *
 * The 30 alphabetically-indexed formulas transcribe rows A3:D35 of
 * recipe-calculator.xlsx (Calculator tab). The 3 Kendamil entries extend
 * beyond the xlsx — Kendamil is not represented there. Their values are
 * sourced from per-variant Nutritional Profile + Mixing Instructions
 * datasheets on hcp.kendamil.com (US region).
 *
 * Kendamil audit trail (per Phase 44 D-13/D-14; raw HCP values in PLAN.md):
 *
 *   kendamil-organic  — https://hcp.kendamil.com/cdn/shop/files/Organic.pdf
 *                       region: US, fetched: 2026-04-24
 *   kendamil-classic  — https://hcp.kendamil.com/cdn/shop/files/Classic.pdf
 *                       region: US, fetched: 2026-04-24
 *   kendamil-goat     — https://hcp.kendamil.com/cdn/shop/files/Goat.pdf
 *                       region: US, fetched: 2026-04-24
 */
import type { FortificationFormula, FortificationInputRanges } from './types.js';
import config from './fortification-config.json';

const formulas: FortificationFormula[] = config.formulas;

export const inputs: FortificationInputRanges = config.inputs as FortificationInputRanges;

export function getFortificationFormulas(): FortificationFormula[] {
  return formulas;
}

export function getFormulaById(id: string): FortificationFormula | undefined {
  return formulas.find((f) => f.id === id);
}

export function formulaSupportsPackets(id: string): boolean {
  return getFormulaById(id)?.packetsSupported === true;
}
