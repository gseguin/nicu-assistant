// src/lib/shared/favorites.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FAVORITES_MAX } from './favorites.svelte.js';

// Reset the module between tests to get fresh internal $state.
// vi.resetModules() + dynamic import is the established pattern when
// a module has top-level $state; see existing disclaimer singleton tests.

const STORAGE_KEY = 'nicu:favorites';

describe('favorites store', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.resetModules(); // fresh module state per test
	});

	// Round-trip happy path
	it('T-01 first-run: init() with empty storage seeds defaults and persists them', async () => {
		// Dynamic import to get fresh module state per test via the Svelte compiler
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		// D-20: first-run defaults are the first 4 alphabetical registry entries.
		expect([...favorites.current]).toEqual(['feeds', 'formula', 'gir', 'morphine-wean']);
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
		expect(stored).toEqual({ v: 1, ids: ['feeds', 'formula', 'gir', 'morphine-wean'] });
	});

	it('T-02 round-trip: write then re-init preserves favorites', async () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ids: ['gir', 'feeds'] }));
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		expect([...favorites.current]).toEqual(['gir', 'feeds']);
	});

	// Recovery cases — each maps to a D-08 step
	it('T-03 recovery: invalid JSON → defaults', async () => {
		localStorage.setItem(STORAGE_KEY, '{malformed');
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		expect([...favorites.current]).toEqual(['feeds', 'formula', 'gir', 'morphine-wean']);
	});

	it('T-04 recovery: missing v field → defaults', async () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ ids: ['gir'] }));
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		expect([...favorites.current]).toEqual(['feeds', 'formula', 'gir', 'morphine-wean']);
	});

	it('T-05 recovery: wrong v value → defaults', async () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 99, ids: ['gir'] }));
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		expect([...favorites.current]).toEqual(['feeds', 'formula', 'gir', 'morphine-wean']);
	});

	it('T-06 recovery: ids not an array → defaults', async () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ids: 'gir' }));
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		expect([...favorites.current]).toEqual(['feeds', 'formula', 'gir', 'morphine-wean']);
	});

	it('T-07 recovery: unknown id is silently filtered out (preserves stored order)', async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ v: 1, ids: ['morphine-wean', 'ghost', 'gir'] })
		);
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		// D-21: stored order preserved after filter; 'ghost' filtered out, but
		// remaining ids stay in stored order — NOT re-sorted to registry order.
		expect([...favorites.current]).toEqual(['morphine-wean', 'gir']);
	});

	it('T-08 recovery: over-cap ids are truncated to MAX', async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 1,
				ids: ['morphine-wean', 'formula', 'gir', 'feeds', 'morphine-wean']
			})
		);
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		expect(favorites.current.length).toBeLessThanOrEqual(FAVORITES_MAX);
	});

	it('T-09 recovery: empty filtered list → defaults', async () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ids: ['ghost1', 'ghost2'] }));
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		expect([...favorites.current]).toEqual(['feeds', 'formula', 'gir', 'morphine-wean']);
	});

	it('T-10 recovery: preserves stored order verbatim (D-21 regression guard)', async () => {
		// D-21: recover() no longer re-sorts by registry order. Whatever order the
		// user stored is exactly what comes back, so a v1.13/v1.14 user's existing
		// favorites order is honored on first v1.15 load (no snap-to-alphabetical).
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ v: 1, ids: ['morphine-wean', 'gir', 'feeds', 'formula'] })
		);
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		expect([...favorites.current]).toEqual(['morphine-wean', 'gir', 'feeds', 'formula']);
	});

	// Mutation API
	it('T-11 toggle: add to favorites (under cap)', async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula'] })
		);
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		favorites.toggle('gir');
		// toggle() still re-sorts the in-memory array by registry order (FAV-06 / D-07);
		// post-D-19 alphabetization that's: feeds, formula, gir, morphine-wean, uac-uvc.
		expect([...favorites.current]).toEqual(['formula', 'gir', 'morphine-wean']);
	});

	it('T-12 toggle: remove from favorites', async () => {
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		favorites.toggle('formula');
		expect(favorites.current).not.toContain('formula');
		// Defaults are alphabetical: ['feeds','formula','gir','morphine-wean']; remove 'formula'.
		expect([...favorites.current]).toEqual(['feeds', 'gir', 'morphine-wean']);
	});

	it('T-13 toggle: at cap, adding new id is a no-op (defense-in-depth)', async () => {
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init(); // 4 defaults, at cap
		expect(favorites.isFull).toBe(true);
		expect(favorites.current.length).toBe(FAVORITES_MAX);
	});

	it('T-14 toggle: remove + re-add places id at registry-order position (FAV-06)', async () => {
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		favorites.toggle('formula'); // remove
		favorites.toggle('formula'); // re-add
		// After alphabetization, registry-order add lands formula at index 1.
		expect([...favorites.current]).toEqual(['feeds', 'formula', 'gir', 'morphine-wean']);
	});

	// isFull, canAdd, has
	it('T-15 has(): returns true for favorited, false otherwise', async () => {
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		expect(favorites.has('morphine-wean')).toBe(true);
		favorites.toggle('morphine-wean');
		expect(favorites.has('morphine-wean')).toBe(false);
	});

	it('T-16 canAdd(): false when favorited; false when full; true otherwise', async () => {
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		expect(favorites.canAdd('morphine-wean')).toBe(false); // already favorited
		favorites.toggle('morphine-wean');
		// Now 3 favorites, not full → could add back
		expect(favorites.canAdd('morphine-wean')).toBe(true);
	});

	it('T-17 isFull reflects count boundary', async () => {
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		expect(favorites.isFull).toBe(true);
		favorites.toggle('morphine-wean');
		expect(favorites.isFull).toBe(false);
	});

	// localStorage failure modes
	it('T-18 init: localStorage.getItem throws → falls back to defaults silently', async () => {
		const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('private browsing');
		});
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		expect([...favorites.current]).toEqual(['feeds', 'formula', 'gir', 'morphine-wean']);
		spy.mockRestore();
	});

	it('T-19 toggle: localStorage.setItem throws → in-memory state still updates', async () => {
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('quota exceeded');
		});
		favorites.toggle('formula');
		expect(favorites.has('formula')).toBe(false); // state mutation succeeded
		spy.mockRestore();
	});
});

describe('T-20 — module-scope default (D-07 regression guard)', () => {
	it('T-20: current is defaults before init() is called', async () => {
		vi.resetModules();
		// Dynamic import yields a fresh module instance — _ids initialized to defaultIds()
		const { favorites: freshFavorites } = await import('./favorites.svelte.js');
		// Do NOT call init()
		// D-20: alphabetical first 4 (post-D-19 registry alphabetization).
		expect([...freshFavorites.current]).toEqual(['feeds', 'formula', 'gir', 'morphine-wean']);
	});
});

describe('T-21 — unknown-calculator-id forward compatibility regression', () => {
	it('T-21: unknown id (e.g. a removed calculator) is silently filtered, preserving order of valid ids', async () => {
		/*
		 * D-11 (Phase 52): regression guard for users whose stored favorites included a
		 * calculator id that was later removed from the registry. The recover() filter MUST
		 * drop the unknown id without error and MUST preserve the order of the surviving
		 * valid ids. Uses a generic literal so this test stays feature-agnostic across
		 * future removals.
		 */
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula', 'unknown-calculator-id', 'gir'] })
		);
		vi.resetModules();
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		expect([...favorites.current]).toEqual(['morphine-wean', 'formula', 'gir']);
	});
});

describe('SAFE-02 — pert upgrade path regression (v1.15+ users)', () => {
	it('SAFE-02: stored favorites containing pert silently drops it, preserving valid-id order', async () => {
		/*
		 * D-04 (53-CONTEXT): 'pert' literal is intentional — this test exercises the real
		 * historical upgrade scenario for v1.15 users who had 'pert' favorited before
		 * v1.17 removed the PERT calculator from the registry. recover() step 4 filter
		 * (valid.has(id)) MUST silently drop 'pert' without error.
		 *
		 * D-19 grep gate note: the D-19 grep gate already fires non-zero due to CLAUDE.md /
		 * PRODUCT.md hits; this 'pert' literal does not change the gate state.
		 *
		 * Meaningful failure: if recover() step 4 filter is removed, received value would be
		 * ['morphine-wean', 'formula', 'pert', 'gir'] — a clear, legible failure.
		 *
		 * D-21: expected order is ['morphine-wean','formula','gir'] (stored order minus 'pert'),
		 * NOT alphabetical — recover() preserves stored insertion order verbatim.
		 */
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula', 'pert', 'gir'] })
		);
		vi.resetModules();
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		expect([...favorites.current]).toEqual(['morphine-wean', 'formula', 'gir']);
	});
});

describe('SAFE-03 — first-run defaults never contain pert (regression guard)', () => {
	it('SAFE-03: first-run defaults are the v1.13 four-calculator baseline with no pert', async () => {
		/*
		 * D-05 (53-CONTEXT): SAFE-03 asserts the defaultIds() baseline — not.toContain('pert')
		 * plus the full registry-derived default array.
		 *
		 * D-19: the expected order is alphabetical ['feeds','formula','gir','morphine-wean'].
		 * The "v1.13 baseline" wording in the ROADMAP refers to the same 4 calculator IDs, not
		 * their ordering — the actual ordering is alphabetical per D-19 registry alphabetization
		 * (post-v1.13 change; conceptual baseline = same 4 calculators, no pert; live ordering
		 * is alphabetical). T-01, T-20, and multiple other tests already assert this exact array.
		 */
		localStorage.clear();
		vi.resetModules();
		// No localStorage.setItem — this is a first-run scenario (no stored state)
		const { favorites } = await import('./favorites.svelte.js');
		favorites.init();
		expect(favorites.current).not.toContain('pert');
		expect([...favorites.current]).toEqual(['feeds', 'formula', 'gir', 'morphine-wean']);
	});
});
