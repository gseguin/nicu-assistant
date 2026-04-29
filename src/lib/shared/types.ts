export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

export type CalculatorId = 'morphine-wean' | 'formula' | 'gir' | 'feeds' | 'uac-uvc' | 'pert';

export interface NumericInputRange {
  min: number;
  max: number;
  step: number;
}
