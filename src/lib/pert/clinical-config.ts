import rawClinicalConfig from './clinical-config.json';

export interface Medication {
  brand: string;
  strengths: number[];
}

export interface Disclaimer {
  eyebrow: string;
  headline: string;
  body1: string;
  body2: string;
  acknowledge: string;
}

export interface ValidationMessages {
  emptyFatGrams: string;
  invalidFatGrams: string;
  zeroFatGrams: string;
}

type FormulaInput = 'fatGrams' | 'lipaseUnitsPerGram' | 'capsuleStrength';
type FormulaValue = FormulaInput | 'totalLipase' | 'capsulesRaw' | 'capsulesNeeded';

interface MultiplyStep {
  op: 'multiply';
  left: FormulaValue;
  right: FormulaValue;
  out: FormulaValue;
}

interface DivideStep {
  op: 'divide';
  left: FormulaValue;
  right: FormulaValue;
  out: FormulaValue;
}

interface RoundStep {
  op: 'round';
  input: FormulaValue;
  out: FormulaValue;
}

export type FormulaStep = MultiplyStep | DivideStep | RoundStep;

export interface FormulaDefinition {
  result: FormulaValue;
  steps: FormulaStep[];
}

export interface ClinicalConfig {
  medications: Medication[];
  lipaseRates: number[];
  disclaimer: Disclaimer;
  validationMessages: ValidationMessages;
  formulas: {
    totalLipase: FormulaDefinition;
    capsulesNeeded: FormulaDefinition;
  };
}

function assertPositiveIntegerArray(
  value: unknown,
  path: string
): asserts value is number[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${path} must be a non-empty array`);
  }

  for (const entry of value) {
    if (!Number.isInteger(entry) || entry <= 0) {
      throw new Error(`${path} must contain positive integers only`);
    }
  }
}

function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
}

function assertFormulaDefinition(value: unknown, path: string): asserts value is FormulaDefinition {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${path} must be an object`);
  }

  const maybeDefinition = value as Record<string, unknown>;
  assertString(maybeDefinition.result, `${path}.result`);

  if (!Array.isArray(maybeDefinition.steps) || maybeDefinition.steps.length === 0) {
    throw new Error(`${path}.steps must be a non-empty array`);
  }

  for (const [index, step] of maybeDefinition.steps.entries()) {
    if (typeof step !== 'object' || step === null) {
      throw new Error(`${path}.steps[${index}] must be an object`);
    }

    const maybeStep = step as Record<string, unknown>;
    if (maybeStep.op === 'multiply' || maybeStep.op === 'divide') {
      assertString(maybeStep.left, `${path}.steps[${index}].left`);
      assertString(maybeStep.right, `${path}.steps[${index}].right`);
      assertString(maybeStep.out, `${path}.steps[${index}].out`);
      continue;
    }

    if (maybeStep.op === 'round') {
      assertString(maybeStep.input, `${path}.steps[${index}].input`);
      assertString(maybeStep.out, `${path}.steps[${index}].out`);
      continue;
    }

    throw new Error(`${path}.steps[${index}].op must be multiply, divide, or round`);
  }
}

export function parseClinicalConfig(value: unknown): ClinicalConfig {
  if (typeof value !== 'object' || value === null) {
    throw new Error('clinical config must be an object');
  }

  const config = value as Record<string, unknown>;

  if (!Array.isArray(config.medications) || config.medications.length === 0) {
    throw new Error('medications must be a non-empty array');
  }

  const medications = config.medications.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`medications[${index}] must be an object`);
    }

    const medication = entry as Record<string, unknown>;
    assertString(medication.brand, `medications[${index}].brand`);
    assertPositiveIntegerArray(medication.strengths, `medications[${index}].strengths`);

    return {
      brand: medication.brand,
      strengths: medication.strengths
    };
  });

  assertPositiveIntegerArray(config.lipaseRates, 'lipaseRates');

  if (typeof config.disclaimer !== 'object' || config.disclaimer === null) {
    throw new Error('disclaimer must be an object');
  }

  const disclaimer = config.disclaimer as Record<string, unknown>;
  assertString(disclaimer.eyebrow, 'disclaimer.eyebrow');
  assertString(disclaimer.headline, 'disclaimer.headline');
  assertString(disclaimer.body1, 'disclaimer.body1');
  assertString(disclaimer.body2, 'disclaimer.body2');
  assertString(disclaimer.acknowledge, 'disclaimer.acknowledge');

  if (typeof config.validationMessages !== 'object' || config.validationMessages === null) {
    throw new Error('validationMessages must be an object');
  }

  const validationMessages = config.validationMessages as Record<string, unknown>;
  assertString(validationMessages.emptyFatGrams, 'validationMessages.emptyFatGrams');
  assertString(validationMessages.invalidFatGrams, 'validationMessages.invalidFatGrams');
  assertString(validationMessages.zeroFatGrams, 'validationMessages.zeroFatGrams');

  if (typeof config.formulas !== 'object' || config.formulas === null) {
    throw new Error('formulas must be an object');
  }

  const formulas = config.formulas as Record<string, unknown>;
  assertFormulaDefinition(formulas.totalLipase, 'formulas.totalLipase');
  assertFormulaDefinition(formulas.capsulesNeeded, 'formulas.capsulesNeeded');

  return {
    medications,
    lipaseRates: config.lipaseRates,
    disclaimer: {
      eyebrow: disclaimer.eyebrow,
      headline: disclaimer.headline,
      body1: disclaimer.body1,
      body2: disclaimer.body2,
      acknowledge: disclaimer.acknowledge
    },
    validationMessages: {
      emptyFatGrams: validationMessages.emptyFatGrams,
      invalidFatGrams: validationMessages.invalidFatGrams,
      zeroFatGrams: validationMessages.zeroFatGrams
    },
    formulas: {
      totalLipase: formulas.totalLipase,
      capsulesNeeded: formulas.capsulesNeeded
    }
  };
}

export const CLINICAL_CONFIG = parseClinicalConfig(rawClinicalConfig);
