// src/lib/shared/migration-56-02.test.ts
// Phase 56 / Task 2 byte-identity tests for favorites + lastEdited migrations (MIG-03, MIG-04).
// These are NEW tests verifying the seam is wired correctly after migration.
// The existing favorites.test.ts (T-01..T-21, SAFE-02, SAFE-03) and
// calculator-store.test.ts are the primary regression gates — do NOT edit them.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LastEdited } from './lastEdited.svelte.js';

const TEST_TS_KEY = 'test_lastEdited_ts';

// ── MIG-03: favorites stored shape — covered by favorites.test.ts T-01 ───────
// T-01 in favorites.test.ts already asserts the parsed stored shape:
//   expect(stored).toEqual({ v: 1, ids: ['feeds', 'formula', 'gir', 'morphine-wean'] })
// which directly exercises the new custom codec serialize wrapper
// (serialize: (ids) => JSON.stringify({ v: SCHEMA_VERSION, ids })). T-01 lives in the
// favorites suite where the vi.resetModules() + dynamic-import harness for the module-scope
// $state singleton is already established; duplicating that harness here is redundant and
// fragile (the static `import { LastEdited }` at the top of THIS file conflicts with
// resetModules-per-test). T-01 is the canonical MIG-03 byte-shape guard.

// ── MIG-04: lastEdited stamp byte shape ──────────────────────────────────────

describe('MIG-04: lastEdited — stamp byte shape and null-on-empty-string', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.restoreAllMocks();
	});

	it('after stamp(), stored value is a bare number string (no JSON quotes)', () => {
		const le = new LastEdited(TEST_TS_KEY);
		le.stamp();
		const raw = localStorage.getItem(TEST_TS_KEY);
		expect(raw).not.toBeNull();
		// Must be a numeric string like '1748443200000', not '"1748443200000"'
		expect(typeof raw).toBe('string');
		expect(Number.isFinite(Number(raw))).toBe(true);
	});

	it('after stamp(), stored raw === String(le.current) (byte-identical to pre-migration String(...))', () => {
		const le = new LastEdited(TEST_TS_KEY);
		le.stamp();
		// Pre-migration wrote String(this.current); the migrated jsonCodec path must
		// produce the exact same bytes — assert against the in-memory value, not just "finite".
		expect(localStorage.getItem(TEST_TS_KEY)).toBe(String(le.current));
	});

	it('stored value does NOT have JSON quotes (not \'"1748443200000"\')', () => {
		const le = new LastEdited(TEST_TS_KEY);
		le.stamp();
		const raw = localStorage.getItem(TEST_TS_KEY)!;
		// JSON.stringify(number) gives a bare number; JSON.stringify("string") gives quoted
		expect(raw).not.toMatch(/^"/);
	});

	it('constructing LastEdited with stored empty string "" → current === null (Pitfall 6 guard)', () => {
		localStorage.setItem(TEST_TS_KEY, '');
		const le = new LastEdited(TEST_TS_KEY);
		// Number('') === 0 which isFinite — the recover hook must guard against this
		expect(le.current).toBeNull();
	});

	it('clear() sets current to null and removes from localStorage', () => {
		const le = new LastEdited(TEST_TS_KEY);
		le.stamp();
		expect(le.current).not.toBeNull();
		le.clear();
		expect(le.current).toBeNull();
		expect(localStorage.getItem(TEST_TS_KEY)).toBeNull();
	});
});
