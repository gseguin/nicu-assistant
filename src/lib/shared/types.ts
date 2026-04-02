export interface SelectOption {
	value: string;
	label: string;
	group?: string;
}

export type CalculatorId = 'morphine-wean' | 'formula';

export interface CalculatorContext {
	id: CalculatorId;
	accentColor: string;
}
