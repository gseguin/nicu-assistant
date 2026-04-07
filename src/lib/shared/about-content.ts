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
      'Calculates a step-by-step morphine weaning schedule using either a linear (fixed reduction) or compounding (percentage reduction) method.',
    notes: [
      'Supports linear mode (constant dose reduction each step) and compounding mode (percentage of current dose each step).',
      'Default parameters: 3.1 kg weight, 0.04 mg/kg/dose max dose, 10% decrease per step.',
      'Always produces a 10-step schedule. Results are a starting point — clinical judgment required.',
    ],
  },
  formula: {
    title: 'Fortification Calculator',
    version: appVersion,
    description:
      'Calculates the amount of formula powder, scoops, teaspoons, tablespoons, or HMF packets needed to fortify breast milk or water to a target calorie concentration. Implements displacement-corrected math for spreadsheet parity.',
    notes: [
      'Five inputs (Base, Starting Volume, Formula, Target Calorie, Unit) and four outputs (Amount to Add, Yield, Exact kcal/oz, Suggested Starting Volume).',
      '30 formulas across 4 manufacturers (Abbott, Mead Johnson, Nestlé, Nutricia). Packets unit is only available for Similac HMF.',
      "Results must be verified against your institution's feeding protocol.",
    ],
  },
};
