// Fortification calculation core. Pure function, no Svelte / DOM / I/O.
// Mirrors the recipe-calculator.xlsx Calculator tab. See Plan 09-02 Formula Reference.

import type {
  FortificationInputs,
  FortificationResult,
  FortificationFormula,
  UnitType,
  BaseType
} from './types.js';

const ML_PER_OZ = 29.57;
const HMF_ID = 'similac-hmf';

const BASE_KCAL: Record<BaseType, number> = {
  'breast-milk': 20,
  water: 0
};

/** Gram mass of the added powder for a given unit. See Plan 09-02 Formula Reference (B-4). */
function gramsAdded(amount: number, unit: UnitType, formula: FortificationFormula): number {
  switch (unit) {
    case 'grams':
      return amount;
    case 'scoops':
      return amount * formula.grams_per_scoop;
    case 'packets':
      return amount * formula.grams_per_scoop; // packets == scoops branch in xlsx (B-4)
    case 'teaspoons':
      return amount * 2.5;
    case 'tablespoons':
      return amount * 7.5;
  }
}

/** Inverse of the general CALC-02 formula: solve for volume given a fixed gram mass. */
function inverseGeneralVolume(
  grams: number,
  targetKcal: number,
  baseKcal: number,
  disp: number,
  cal: number
): number {
  const numerSlope = targetKcal - baseKcal;
  if (numerSlope === 0) return 0;
  return (grams * (ML_PER_OZ * cal - disp * targetKcal)) / numerSlope;
}

const ZERO_RESULT: FortificationResult = {
  amountToAdd: 0,
  yieldMl: 0,
  exactKcalPerOz: 0,
  suggestedStartingVolumeMl: '0 (0 oz)'
};

/** Branch tag — which formula path produced amountToAdd. Drives the SSV inverse. */
type Branch =
  | { kind: 'packets-hmf-22' }
  | { kind: 'packets-hmf-24' }
  | { kind: 'bm-tsp-22' }
  | { kind: 'bm-tsp-24' }
  | { kind: 'general' };

/**
 * Compute the fortification recipe for a given formula, base, volume, target kcal/oz, and unit.
 * Pure function — matches recipe-calculator.xlsx Calculator tab to spreadsheet parity.
 */
export function calculateFortification(inputs: FortificationInputs): FortificationResult {
  const { formula, base, volumeMl, targetKcalOz, unit } = inputs;

  if (!(volumeMl > 0)) return ZERO_RESULT;

  const baseKcal = BASE_KCAL[base];
  const disp = formula.displacement_factor;
  const cal = formula.calorie_concentration;
  const isHMF = formula.id === HMF_ID;

  let amountToAdd = 0;
  let branch: Branch = { kind: 'general' };

  // Precedence: Packets → BM+Tsp shortcut → general formula.
  if (unit === 'packets') {
    if (isHMF && targetKcalOz === 24) {
      amountToAdd = volumeMl / 25;
      branch = { kind: 'packets-hmf-24' };
    } else if (isHMF && targetKcalOz === 22) {
      amountToAdd = volumeMl / 50;
      branch = { kind: 'packets-hmf-22' };
    } else {
      return ZERO_RESULT;
    }
  } else if (base === 'breast-milk' && unit === 'teaspoons' && targetKcalOz === 22) {
    amountToAdd = (volumeMl / 90) * 0.5;
    branch = { kind: 'bm-tsp-22' };
  } else if (base === 'breast-milk' && unit === 'teaspoons' && targetKcalOz === 24) {
    amountToAdd = (volumeMl / 90) * 1;
    branch = { kind: 'bm-tsp-24' };
  } else {
    // General formula (CALC-02) + unit conversion (CALC-03).
    const denom = ML_PER_OZ * cal - disp * targetKcalOz;
    if (denom === 0) return ZERO_RESULT;
    const grams = (volumeMl * (targetKcalOz - baseKcal)) / denom;
    switch (unit) {
      case 'grams':
        amountToAdd = grams;
        break;
      case 'scoops':
        amountToAdd = grams / formula.grams_per_scoop;
        break;
      case 'teaspoons':
        amountToAdd = grams / 2.5;
        break;
      case 'tablespoons':
        amountToAdd = grams / 7.5;
        break;
    }
    branch = { kind: 'general' };
  }

  if (!Number.isFinite(amountToAdd) || amountToAdd === 0) return ZERO_RESULT;

  const gAdded = gramsAdded(amountToAdd, unit, formula);
  const yieldMl = volumeMl + gAdded * disp;
  const exactKcalPerOz = ((baseKcal * volumeMl) / ML_PER_OZ + gAdded * cal) / (yieldMl / ML_PER_OZ);

  if (!Number.isFinite(yieldMl) || !Number.isFinite(exactKcalPerOz)) return ZERO_RESULT;

  // CALC-08: Suggested Starting Volume — round amountToAdd to whole units, back-calc volume.
  const wholeAmount = Math.round(amountToAdd);
  let suggestedV = 0;
  switch (branch.kind) {
    case 'packets-hmf-24':
      suggestedV = wholeAmount * 25;
      break;
    case 'packets-hmf-22':
      suggestedV = wholeAmount * 50;
      break;
    case 'bm-tsp-22':
      suggestedV = (wholeAmount / 0.5) * 90;
      break;
    case 'bm-tsp-24':
      suggestedV = wholeAmount * 90;
      break;
    case 'general': {
      // Convert wholeAmount back to grams via inverse of unit divisor.
      let grams = 0;
      switch (unit) {
        case 'grams':
          grams = wholeAmount;
          break;
        case 'scoops':
          grams = wholeAmount * formula.grams_per_scoop;
          break;
        case 'teaspoons':
          grams = wholeAmount * 2.5;
          break;
        case 'tablespoons':
          grams = wholeAmount * 7.5;
          break;
        case 'packets':
          grams = wholeAmount * formula.grams_per_scoop;
          break;
      }
      suggestedV = inverseGeneralVolume(grams, targetKcalOz, baseKcal, disp, cal);
      break;
    }
  }

  if (!Number.isFinite(suggestedV) || suggestedV <= 0) {
    return {
      amountToAdd,
      yieldMl,
      exactKcalPerOz,
      suggestedStartingVolumeMl: '0 (0 oz)'
    };
  }

  const mL = Math.round(suggestedV);
  const oz = (Math.round((suggestedV / ML_PER_OZ) * 10) / 10).toFixed(1);

  return {
    amountToAdd,
    yieldMl,
    exactKcalPerOz,
    suggestedStartingVolumeMl: `${mL} (${oz} oz)`
  };
}
