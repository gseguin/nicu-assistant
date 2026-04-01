// src/lib/shared/index.ts
export { theme } from './theme.svelte.js';
export { disclaimer } from './disclaimer.svelte.js';
export { setCalculatorContext, getCalculatorContext } from './context.js';
export type { SelectOption, CalculatorId, CalculatorContext } from './types.js';
// Components are re-exported after Plan 02-04 create them:
// export { default as SelectPicker } from './components/SelectPicker.svelte';
// export { default as DisclaimerModal } from './components/DisclaimerModal.svelte';
// export { default as NumericInput } from './components/NumericInput.svelte';
// export { default as ResultsDisplay } from './components/ResultsDisplay.svelte';
// export { default as AboutSheet } from './components/AboutSheet.svelte';
