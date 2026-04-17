import type { CalculatorId } from './types.js';

declare const __APP_VERSION__: string;

interface AboutContent {
  title: string;
  version: string;
  description: string;
  notes: string[];
}

const appVersion = `v${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'}`;

export const aboutContent: Record<CalculatorId, AboutContent> = {
  'morphine-wean': {
    title: 'Morphine Wean Calculator',
    version: appVersion,
    description:
      'Calculates a step-by-step morphine weaning schedule with a fixed mg reduction per step, matching the source spreadsheet.',
    notes: [
      'Each step reduces the dose by weight × max dose × decrease % (a constant mg reduction across all 10 steps).',
      'Default parameters: 3.1 kg weight, 0.04 mg/kg/dose max dose, 10% decrease per step.',
      'Source: morphine-wean-calculator.xlsx Sheet1. Results are a starting point — clinical judgment required.'
    ]
  },
  formula: {
    title: 'Fortification Calculator',
    version: appVersion,
    description:
      'Calculates the amount of formula powder, scoops, teaspoons, tablespoons, or HMF packets needed to fortify breast milk or water to a target calorie concentration. Implements displacement-corrected math for spreadsheet parity.',
    notes: [
      'Five inputs (Base, Starting Volume, Formula, Target Calorie, Unit) and four outputs (Amount to Add, Yield, Exact kcal/oz, Suggested Starting Volume).',
      '30 formulas across 4 manufacturers (Abbott, Mead Johnson, Nestlé, Nutricia). Packets unit is only available for Similac HMF.',
      "Results must be verified against your institution's feeding protocol."
    ]
  },
  gir: {
    title: 'Glucose Infusion Rate',
    version: appVersion,
    description:
      'Calculates Current GIR (mg/kg/min) and Initial infusion rate (ml/hr) from Weight, Dextrose %, and Fluid order, with a 6-bucket glucose-driven titration helper (Target GIR / Target rate / Δ rate).',
    notes: [
      'Formula: Current GIR = (Dex% × rate ml/hr × 10) / (Weight × 60); Initial rate = (Weight × ml/kg/day) / 24.',
      'Source spreadsheet: GIR-Wean-Calculator.xlsx (CALC tab). Formula validated against MDCalc and Hawkes et al., J Perinatol 2020 (PMC7286731).',
      "The 6-bucket titration adjustment values are an institutional protocol — verify against your unit's own protocol before acting.",
      'Dextrose >12.5% requires central venous access. GIR >12 mg/kg/min warrants hyperinsulinism workup.'
    ]
  },
  feeds: {
    title: 'Feed Advance Calculator',
    version: appVersion,
    description:
      'Calculates bedside feeding advancement volumes (trophic, advance step, goal ml/feed) and full TPN + enteral nutrition totals (kcal/kg/d) for NICU patients. Supports configurable feed frequency and advance cadence.',
    notes: [
      'Bedside mode: trophic/advance/goal ml per feed from weight and ml/kg/d targets, with frequency (q2h-q6h) and cadence (every feed to once daily) dropdowns.',
      'Full nutrition mode: total kcal/kg/d from dual TPN dextrose lines, SMOF lipid, and enteral feeds. Hero output is total kcal/kg/d.',
      'Source: nutrition-calculator.xlsx Sheet1 (TPN full nutrition) + Sheet2 (bedside advancement). Results are advisory — clinical judgment required.'
    ]
  }
};
