import type { CalculatorId } from './types.js';

interface AboutContent {
  title: string;
  version: string;
  description: string;
  notes: string[];
  sourceLabel: string;
}

export const aboutContent: Record<CalculatorId, AboutContent> = {
  pert: {
    title: 'PERT Dosing Calculator',
    version: 'v1.0',
    description:
      'Calculates pancreatic enzyme replacement therapy (PERT) capsule doses based on meal fat content, lipase activity rate, and selected medication brand.',
    notes: [
      'Supports meal mode (fat grams + lipase rate) and tube-feed mode.',
      'All FDA-approved PERT brands and strengths included.',
      'Results are a starting point — clinical judgment required for final dosing.',
    ],
    sourceLabel: 'Clinical data from FDA-approved PERT prescribing information.',
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
