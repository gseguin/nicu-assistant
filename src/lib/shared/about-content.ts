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
    title: 'Infant Formula Calculator',
    version: appVersion,
    description:
      'Calculates powder (grams and scoops) and water (mL) quantities to prepare infant formula at a target calorie concentration.',
    notes: [
      'Supports standard modified formula and human milk fortifier (BMF) modes.',
      'Displacement factors sourced from manufacturer reference data.',
      "Results must be verified against your institution's feeding protocol.",
    ],
  },
};
