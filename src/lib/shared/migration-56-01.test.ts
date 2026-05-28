// src/lib/shared/migration-56-01.test.ts
// Phase 56 / Task 1 byte-identity tests for theme + disclaimer migrations (MIG-01, MIG-02).
// These are NEW tests verifying the seam is wired correctly after migration.
// The existing DisclaimerBanner.test.ts is the primary regression gate.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const THEME_KEY = 'nicu_assistant_theme';
const KEY_V1 = 'nicu_assistant_disclaimer_v1';
const KEY_V2 = 'nicu_assistant_disclaimer_v2';

// ── MIG-01: theme byte-identity ───────────────────────────────────────────────

describe('MIG-01: theme — byte-identity after migration', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.restoreAllMocks();
		// theme.svelte.ts holds module-scope `let _theme = $state(...)`; reset modules
		// between tests so each gets a fresh _theme (matches favorites.test.ts convention).
		vi.resetModules();
		// Stub DOM so theme.set() does not throw outside a browser
		vi.stubGlobal('document', {
			documentElement: {
				classList: { toggle: vi.fn() },
				setAttribute: vi.fn()
			}
		});
	});

	afterEach(() => {
		// Prevent the stubbed `document` global from leaking into later describe blocks.
		vi.unstubAllGlobals();
	});

	it('theme.set("dark") stores unquoted "dark" (not \'\"dark\"\')', async () => {
		const { theme } = await import('./theme.svelte.js');
		theme.set('dark');
		// rawStringCodec must store 'dark', not '"dark"' (FOUC constraint D-03)
		expect(localStorage.getItem(THEME_KEY)).toBe('dark');
	});

	it('theme.set("light") stores unquoted "light"', async () => {
		const { theme } = await import('./theme.svelte.js');
		theme.set('light');
		expect(localStorage.getItem(THEME_KEY)).toBe('light');
	});

	it('theme.set("dark") does NOT store JSON-quoted \'"dark"\'', async () => {
		const { theme } = await import('./theme.svelte.js');
		theme.set('dark');
		expect(localStorage.getItem(THEME_KEY)).not.toBe('"dark"');
	});
});

// ── MIG-02: disclaimer v1 key preservation ────────────────────────────────────

describe('MIG-02: disclaimer — v1 key preserved after init()', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.resetModules();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('v1-only user: acknowledged === true after disclaimer.init()', async () => {
		localStorage.setItem(KEY_V1, 'true');
		const { disclaimer } = await import('./disclaimer.svelte.js');
		disclaimer.init();
		expect(disclaimer.acknowledged).toBe(true);
	});

	it('v1-only user: localStorage key v1 is NOT deleted after disclaimer.init()', async () => {
		localStorage.setItem(KEY_V1, 'true');
		const { disclaimer } = await import('./disclaimer.svelte.js');
		disclaimer.init();
		// pvV1 must be read-only — it must still be 'true'
		expect(localStorage.getItem(KEY_V1)).toBe('true');
	});

	it('v1-only user: v2 key is written during init() migration', async () => {
		localStorage.setItem(KEY_V1, 'true');
		const { disclaimer } = await import('./disclaimer.svelte.js');
		disclaimer.init();
		expect(localStorage.getItem(KEY_V2)).toBe('true');
	});

	it('disclaimer stores "true" (unquoted) not JSON boolean', async () => {
		const { disclaimer } = await import('./disclaimer.svelte.js');
		disclaimer.init();
		disclaimer.acknowledge();
		// rawStringCodec must store literal 'true', not JSON boolean
		expect(localStorage.getItem(KEY_V2)).toBe('true');
	});
});
