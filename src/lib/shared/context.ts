import { setContext, getContext } from 'svelte';
import type { CalculatorContext } from './types.js';

const CALCULATOR_CONTEXT_KEY = Symbol('calculatorContext');

export function setCalculatorContext(ctx: CalculatorContext): void {
	setContext(CALCULATOR_CONTEXT_KEY, ctx);
}

export function getCalculatorContext(): CalculatorContext {
	return (
		getContext<CalculatorContext>(CALCULATOR_CONTEXT_KEY) ?? {
			id: 'pert',
			accentColor: 'var(--color-accent)'
		}
	);
}
