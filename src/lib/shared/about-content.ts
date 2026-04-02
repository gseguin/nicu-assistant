import type { CalculatorId } from './types.js';

interface AboutContent {
  title: string;
  version: string;
  description: string;
  notes: string[];
  sourceLabel: string;
}

export const aboutContent: Record<CalculatorId, AboutContent> = {
  'morphine-wean': {
    title: 'Morphine Wean Calculator',
    version: 'v1.1',
    description:
      'Calculates a step-by-step morphine weaning schedule using either a linear (fixed reduction) or compounding (percentage reduction) method.',
    notes: [
      'Supports linear mode (constant dose reduction each step) and compounding mode (percentage of current dose each step).',
      'Default parameters: 3.1 kg weight, 0.04 mg/kg/dose max dose, 10% decrease per step.',
      'Always produces a 10-step schedule. Results are a starting point — clinical judgment required.',
    ],
    sourceLabel: 'Calculation logic derived from institutional weaning protocol spreadsheet.',
  },
  formula: {
    title: 'Infant Formula Calculator',
    version: 'v1.0',
    description:
      'Calculates powder (grams and scoops) and water (mL) quantities to prepare infant formula at a target calorie concentration.',
    notes: [
      'Supports standard modified formula and human milk fortifier (BMF) modes.',
      'Displacement factors sourced from manufacturer reference data.',
      "Results must be verified against your institution's feeding protocol.",
    ],
    sourceLabel: 'Caloric density and displacement data from manufacturer specifications.',
  },
};
