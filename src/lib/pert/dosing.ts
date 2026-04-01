// src/lib/pert/dosing.ts
// Core PERT dosing formula. Pure functions — no side effects, fully testable.
// Formula structure lives in the clinical config so clinical updates don't require code edits.

import { CLINICAL_CONFIG, type FormulaDefinition, type FormulaStep } from '$lib/pert/clinical-config';

type FormulaContext = Record<string, number>;

export function runFormula(definition: FormulaDefinition, inputs: FormulaContext): number {
  const context: FormulaContext = { ...inputs };

  for (const step of definition.steps) {
    applyFormulaStep(step, context);
  }

  const result = context[definition.result];
  if (typeof result !== 'number' || Number.isNaN(result)) {
    throw new Error(`Formula did not resolve ${definition.result}`);
  }

  return result;
}

function applyFormulaStep(step: FormulaStep, context: FormulaContext) {
  if (step.op === 'multiply') {
    context[step.out] = resolveValue(context, step.left) * resolveValue(context, step.right);
    return;
  }

  if (step.op === 'divide') {
    context[step.out] = resolveValue(context, step.left) / resolveValue(context, step.right);
    return;
  }

  context[step.out] = Math.round(resolveValue(context, step.input));
}

function resolveValue(context: FormulaContext, key: string): number {
  const value = context[key];
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Formula input ${key} is not available`);
  }
  return value;
}

/**
 * Calculate total lipase units needed for a meal.
 * @param fatGrams - Fat content of meal in grams
 * @param lipaseUnitsPerGram - Prescribed lipase units per gram of fat (500 | 1000 | 2000 | 4000)
 */
export function calculateTotalLipase(fatGrams: number, lipaseUnitsPerGram: number): number {
  return runFormula(CLINICAL_CONFIG.formulas.totalLipase, {
    fatGrams,
    lipaseUnitsPerGram
  });
}

/**
 * Calculate number of capsules needed, rounded to nearest whole number.
 * Formula: capsules = ROUND((fat_g × lipase_units_per_g) / capsule_strength, 0)
 * @param fatGrams - Fat content of meal in grams
 * @param lipaseUnitsPerGram - Prescribed lipase units per gram of fat
 * @param capsuleStrength - Lipase units per capsule for the selected medication/strength
 */
export function calculateCapsules(
  fatGrams: number,
  lipaseUnitsPerGram: number,
  capsuleStrength: number
): number {
  return runFormula(CLINICAL_CONFIG.formulas.capsulesNeeded, {
    fatGrams,
    lipaseUnitsPerGram,
    capsuleStrength
  });
}

/**
 * Validate a raw fat grams string and return a validation message or null if valid.
 * Returns null when the value is valid and ready for calculation.
 */
export function validateFatGrams(raw: string): string | null {
  if (raw.trim() === '') return CLINICAL_CONFIG.validationMessages.emptyFatGrams;
  const n = parseFloat(raw);
  if (isNaN(n) || n < 0) return CLINICAL_CONFIG.validationMessages.invalidFatGrams;
  if (n === 0) return CLINICAL_CONFIG.validationMessages.zeroFatGrams;
  if (n > CLINICAL_CONFIG.maxFatGrams) return CLINICAL_CONFIG.validationMessages.maxFatGrams;
  return null;
}

/**
 * Resolve the display label for a given option value from a set of options.
 * Falls back to the value string itself if not found.
 */
export function resolveOptionLabel(
  value: string,
  options: { value: string; label: string }[]
): string {
  return options.find(o => o.value === value)?.label ?? value;
}
