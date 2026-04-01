// src/lib/shared/disclaimer.svelte.ts
// .svelte.ts extension required — $state rune must compile through Svelte preprocessor
const DISCLAIMER_KEY = 'nicu_assistant_disclaimer_v1';

let _acknowledged = $state(false);

export const disclaimer = {
	get acknowledged(): boolean {
		return _acknowledged;
	},
	init(): void {
		_acknowledged = localStorage.getItem(DISCLAIMER_KEY) === 'true';
	},
	acknowledge(): void {
		_acknowledged = true;
		try {
			localStorage.setItem(DISCLAIMER_KEY, 'true');
		} catch {
			// private browsing — acknowledge in memory only
		}
	}
};
