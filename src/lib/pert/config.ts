import type {
  PertStateData,
  PertInputRanges,
  Medication,
  Formula,
  Advisory,
  ValidationMessages
} from './types.js';
import config from './pert-config.json';

const fdaAllowlist = config.fdaAllowlist as Record<string, number[]>;

function filterStrengthsByAllowlist(med: Medication): Medication {
  const allow = new Set(fdaAllowlist[med.id] ?? []);
  return {
    ...med,
    strengths: med.strengths.filter((s) => allow.has(s))
  };
}

export const defaults = config.defaults as PertStateData;
export const inputs: PertInputRanges = config.inputs as PertInputRanges;
export const medications: Medication[] = (config.dropdowns.medications as Medication[])
  .map(filterStrengthsByAllowlist)
  .filter((m) => m.strengths.length > 0);
export const formulas: Formula[] = config.dropdowns.formulas as Formula[];
export const lipaseRates: number[] = config.dropdowns.lipaseRates as number[];
export const advisories: Advisory[] = config.advisories as Advisory[];
export const validationMessages: ValidationMessages = config.validationMessages as ValidationMessages;

export function getMedicationById(id: string): Medication | undefined {
  return medications.find((m) => m.id === id);
}

export function getFormulaById(id: string): Formula | undefined {
  return formulas.find((f) => f.id === id);
}

export function getStrengthsForMedication(id: string): number[] {
  return getMedicationById(id)?.strengths ?? [];
}
