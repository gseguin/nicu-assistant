// src/lib/shared/persistent-value.test.ts
// Co-located tests for the PersistentValue<T> persistence seam.
// Single test surface for all persistence behavior (SEAM-04).
// Plain .ts with no top-level $state — static imports only; each createPersistentValue()
// call creates a fresh closure, so no module-reset dance needed.

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { createPersistentValue, jsonCodec, rawStringCodec } from './persistent-value.js';

// --- Fixture definitions ---
// Inline fixtures that prove the recover hook is expressive enough for both adapter patterns
// (SEAM-03). Must NOT import real adapters — Phase 56 migrates those.

/** Represents disclaimer's "raw truthy string → boolean" pattern. */
const disclaimerLikeRecover = (raw: string | null): boolean => {
	if (raw === null) return false;
	return raw === 'true';
};

/** Represents favorites' JSON + shape validation + filter + cap pattern. */
const VALID = new Set(['a', 'b', 'c', 'd', 'e']);
const CAP = 3;
const favoritesLikeRecover = (raw: string | null): string[] => {
	if (raw === null) return ['a', 'b', 'c'];
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return ['a', 'b', 'c'];
	}
	if (
		typeof parsed !== 'object' ||
		parsed === null ||
		(parsed as { v: number }).v !== 1 ||
		!Array.isArray((parsed as { ids: unknown }).ids)
	) {
		return ['a', 'b', 'c'];
	}
	const filtered = ((parsed as { ids: string[] }).ids)
		.filter((id): id is string => typeof id === 'string' && VALID.has(id))
		.slice(0, CAP);
	return filtered.length === 0 ? ['a', 'b', 'c'] : filtered;
};

// --- Global setup ---

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	// Restore stubbed globals BEFORE touching localStorage — the SSR tests stub
	// `localStorage` with `undefined`, so calling `.clear()` first would throw TypeError.
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	localStorage.clear();
});

// --- Tests ---

describe('PersistentValue — defaults and round-trip', () => {
	it('read() on empty storage returns defaultValue', () => {
		const pv = createPersistentValue({ key: 'test', defaultValue: 42 });
		expect(pv.read()).toBe(42);
	});

	it('write(value) then read() returns value (round-trip)', () => {
		const pv = createPersistentValue({ key: 'test', defaultValue: 0 });
		pv.write(99);
		expect(pv.read()).toBe(99);
	});

	it('remove() then read() returns defaultValue', () => {
		const pv = createPersistentValue({ key: 'test', defaultValue: 'hello' });
		pv.write('world');
		expect(pv.read()).toBe('world');
		pv.remove();
		expect(pv.read()).toBe('hello');
	});
});

describe('PersistentValue — SSR guard (SEAM-01)', () => {
	it('read() returns defaultValue when localStorage is undefined — does not throw', () => {
		vi.stubGlobal('localStorage', undefined);
		const pv = createPersistentValue({ key: 'k', defaultValue: 'fallback', codec: rawStringCodec });
		expect(() => pv.read()).not.toThrow();
		expect(pv.read()).toBe('fallback');
	});

	it('write() is a silent no-op when localStorage is undefined — does not throw', () => {
		vi.stubGlobal('localStorage', undefined);
		const pv = createPersistentValue({ key: 'k', defaultValue: 'x', codec: rawStringCodec });
		expect(() => pv.write('y')).not.toThrow();
	});

	it('remove() is a silent no-op when localStorage is undefined — does not throw', () => {
		vi.stubGlobal('localStorage', undefined);
		const pv = createPersistentValue({ key: 'k', defaultValue: 'x', codec: rawStringCodec });
		expect(() => pv.remove()).not.toThrow();
	});
});

describe('PersistentValue — parse failure fallback (SEAM-02)', () => {
	it('read() returns defaultValue when stored value is invalid JSON', () => {
		const pv = createPersistentValue({ key: 'test', defaultValue: { a: 1 } });
		localStorage.setItem('test', '{malformed json');
		expect(pv.read()).toEqual({ a: 1 });
	});

	it('read() returns defaultValue when getItem throws Error (private browsing)', () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('private browsing');
		});
		const pv = createPersistentValue({ key: 'test', defaultValue: 99 });
		expect(pv.read()).toBe(99);
	});
});

describe('PersistentValue — write/remove silent on throw (SEAM-02)', () => {
	it('write() does not throw when setItem throws DOMException (QuotaExceededError)', () => {
		const pv = createPersistentValue({ key: 'test', defaultValue: 0 });
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('QuotaExceededError');
		});
		expect(() => pv.write(42)).not.toThrow();
	});

	it('remove() does not throw when removeItem throws Error (security error)', () => {
		const pv = createPersistentValue({ key: 'test', defaultValue: '' });
		vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
			throw new Error('security error');
		});
		expect(() => pv.remove()).not.toThrow();
	});
});

describe('PersistentValue — recover hook disclaimer-style (SEAM-03)', () => {
	it('stored "true" + disclaimerLikeRecover → returns true', () => {
		localStorage.setItem('disc', 'true');
		const pv = createPersistentValue({
			key: 'disc',
			defaultValue: false,
			recover: disclaimerLikeRecover
		});
		expect(pv.read()).toBe(true);
	});

	it('nothing stored + disclaimerLikeRecover → returns false (hook handles null)', () => {
		const pv = createPersistentValue({
			key: 'disc',
			defaultValue: false,
			recover: disclaimerLikeRecover
		});
		expect(pv.read()).toBe(false);
	});

	it('stored "yes" (unrecognized) + disclaimerLikeRecover → returns false', () => {
		localStorage.setItem('disc', 'yes');
		const pv = createPersistentValue({
			key: 'disc',
			defaultValue: false,
			recover: disclaimerLikeRecover
		});
		expect(pv.read()).toBe(false);
	});

	// WR-01: locks the documented total-recover guarantee — if recover throws, the outer
	// try/catch in read() must fall back to defaultValue. Guards against a future refactor
	// hoisting the recover call outside the try.
	it('read() returns defaultValue when recover hook throws (does not propagate)', () => {
		localStorage.setItem('k', 'anything');
		const pv = createPersistentValue<number>({
			key: 'k',
			defaultValue: -1,
			recover: () => {
				throw new Error('boom');
			}
		});
		expect(() => pv.read()).not.toThrow();
		expect(pv.read()).toBe(-1);
	});
});

describe('PersistentValue — recover hook favorites-style (SEAM-03)', () => {
	it('stored valid array + favoritesLikeRecover → returns array with order preserved', () => {
		localStorage.setItem('fav', JSON.stringify({ v: 1, ids: ['c', 'b'] }));
		const pv = createPersistentValue({
			key: 'fav',
			defaultValue: ['a', 'b', 'c'] as string[],
			recover: favoritesLikeRecover
		});
		expect(pv.read()).toEqual(['c', 'b']);
	});

	it('stored array with unknown id + favoritesLikeRecover → unknown filtered out', () => {
		localStorage.setItem('fav', JSON.stringify({ v: 1, ids: ['b', 'unknown', 'c'] }));
		const pv = createPersistentValue({
			key: 'fav',
			defaultValue: ['a', 'b', 'c'] as string[],
			recover: favoritesLikeRecover
		});
		expect(pv.read()).toEqual(['b', 'c']);
	});

	it('stored array over cap + favoritesLikeRecover → capped at 3', () => {
		localStorage.setItem('fav', JSON.stringify({ v: 1, ids: ['a', 'b', 'c', 'd'] }));
		const pv = createPersistentValue({
			key: 'fav',
			defaultValue: ['a', 'b', 'c'] as string[],
			recover: favoritesLikeRecover
		});
		expect(pv.read()).toEqual(['a', 'b', 'c']);
	});

	it('stored invalid JSON + favoritesLikeRecover → returns defaults', () => {
		localStorage.setItem('fav', '{bad');
		const pv = createPersistentValue({
			key: 'fav',
			defaultValue: ['a', 'b', 'c'] as string[],
			recover: favoritesLikeRecover
		});
		expect(pv.read()).toEqual(['a', 'b', 'c']);
	});

	it('nothing stored + favoritesLikeRecover → returns defaults', () => {
		const pv = createPersistentValue({
			key: 'fav',
			defaultValue: ['a', 'b', 'c'] as string[],
			recover: favoritesLikeRecover
		});
		expect(pv.read()).toEqual(['a', 'b', 'c']);
	});
});

describe('PersistentValue — raw-string codec (D-01)', () => {
	it('write("dark") stores literal "dark" with no JSON quotes; read() returns "dark"', () => {
		const pv = createPersistentValue({ key: 'theme', defaultValue: 'light', codec: rawStringCodec });
		pv.write('dark');
		// Verify stored value has no JSON quotes — FOUC script requires raw 'dark', not '"dark"'
		expect(localStorage.getItem('theme')).toBe('dark');
		expect(pv.read()).toBe('dark');
	});

	it('rawStringCodec.serialize("dark") === "dark" (identity — no quotes added)', () => {
		expect(rawStringCodec.serialize('dark')).toBe('dark');
	});

	// WR-03 (rawStringCodec half): empty string is a legitimate raw value, NOT key-absence, so it
	// round-trips verbatim rather than falling back to defaultValue. Locks the divergence from the
	// jsonCodec empty-string behavior before Phase 56 raw-string adapters (theme/lastEdited) migrate.
	it('stored empty string round-trips as "" (not defaultValue)', () => {
		const pv = createPersistentValue({ key: 'k', defaultValue: 'x', codec: rawStringCodec });
		localStorage.setItem('k', '');
		expect(pv.read()).toBe('');
	});
});

describe('PersistentValue — JSON default codec', () => {
	it('write({ v: 1 }) stores JSON string; read() returns the object (round-trip)', () => {
		const pv = createPersistentValue({ key: 'obj', defaultValue: {} as { v: number } });
		pv.write({ v: 1 });
		// Verify stored value is JSON-serialized
		expect(localStorage.getItem('obj')).toBe('{"v":1}');
		expect(pv.read()).toEqual({ v: 1 });
	});

	it('jsonCodec is used by default when no codec option is supplied', () => {
		const pv = createPersistentValue({ key: 'num', defaultValue: 0 });
		pv.write(123);
		expect(localStorage.getItem('num')).toBe('123');
		expect(pv.read()).toBe(123);
	});

	// WR-02: the stored JSON literal "null" deserializes to JS null, NOT defaultValue, because
	// the raw === null guard checks for key absence, not the string "null". Locks the documented
	// edge so nullable adapters know to use recover() instead of the bare default codec.
	it('read() returns null (NOT defaultValue) when stored value is the JSON literal "null"', () => {
		const pv = createPersistentValue<number | null>({ key: 'n', defaultValue: 42 });
		localStorage.setItem('n', 'null');
		expect(pv.read()).toBeNull();
	});

	// WR-03 (jsonCodec half): a stored empty string is not key-absence, so JSON.parse('') runs
	// and throws SyntaxError → caught → defaultValue.
	it('stored empty string falls back to defaultValue (JSON.parse throws)', () => {
		const pv = createPersistentValue({ key: 'k', defaultValue: 7 });
		localStorage.setItem('k', '');
		expect(pv.read()).toBe(7);
	});
});
