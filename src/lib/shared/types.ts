export interface SelectOption {
	value: string;
	label: string;
	group?: string;
}

export type CalculatorId = 'pert' | 'formula';

export interface CalculatorContext {
	id: CalculatorId;
	accentColor: string;
}
