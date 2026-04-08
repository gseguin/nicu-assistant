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
