export interface SelectOption {
	value: string;
	label: string;
	group?: string;
}

export type CalculatorId = 'morphine-wean' | 'formula' | 'gir';

export interface CalculatorContext {
	id: CalculatorId;
	accentColor: string;
}

export interface NumericInputRange {
	min: number;
	max: number;
	step: number;
}
