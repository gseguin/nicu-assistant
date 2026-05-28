// src/lib/shared/persistent-value.ts
// Persistence seam: guarded localStorage read/write/remove with per-instance codec and
// optional recover/migrate hook. Plain .ts — no Svelte rune (D-06).
// Consolidates the SSR guard + silent-catch pattern from the shared singletons and
// CalculatorStore into one audited location (SEAM-01..04).
//
// NO imports. Uses localStorage global directly — zero-import style (D-07 / PATTERNS.md).

/**
 * Per-instance codec: controls how a value of type T is serialized to/from a string
 * for localStorage storage. The seam is NOT JSON-only (D-01): adapters that store
 * raw strings (theme, disclaimer, lastEdited) pass rawStringCodec; adapters that
 * store JSON (favorites) use the default jsonCodec.
 */
export interface Codec<T> {
	serialize: (value: T) => string;
	deserialize: (raw: string) => T;
}

/**
 * Options for createPersistentValue.
 *
 * @param key          - localStorage key
 * @param defaultValue - returned when nothing is stored, SSR guard triggers, or an error occurs
 * @param codec        - serialize/deserialize strategy (defaults to JSON stringify/parse)
 * @param recover      - optional hook called with the raw string (or null) from localStorage,
 *                       fully owning the read path when present (D-02). Replaces
 *                       codec.deserialize + fallback logic. Trusts the hook to be total;
 *                       the outer try/catch in read() is last-resort defense-in-depth.
 */
export interface PersistentValueOptions<T> {
	key: string;
	defaultValue: T;
	codec?: Codec<T>;
	recover?: (raw: string | null) => T;
}

/** The object returned by createPersistentValue<T>(). */
export interface PersistentValue<T> {
	read(): T;
	write(value: T): void;
	remove(): void;
}

/**
 * JSON codec — default codec for createPersistentValue when no codec option is supplied.
 * Generic function (not a constant) so TypeScript can infer T at each call site.
 *
 * NOTE: JSON.parse('null') returns null (JavaScript null), NOT the defaultValue. The four
 * Phase 56 adapters do not store "null" intentionally. Future adapters that need nullable
 * values should use the recover hook instead of relying on the default JSON path.
 */
export function jsonCodec<T>(): Codec<T> {
	return {
		serialize: JSON.stringify,
		deserialize: JSON.parse as (s: string) => T
	};
}

/**
 * Raw-string codec — identity serialize/deserialize for adapters that store plain strings
 * (theme stores 'light'/'dark', disclaimer stores 'true', lastEdited stores a numeric string).
 *
 * D-01: The FOUC inline script in app.html reads localStorage.getItem('nicu_assistant_theme')
 * as a raw string with no JSON.parse. Using jsonCodec on theme would write '"light"' (with
 * quotes) and break the no-flash theme boot. rawStringCodec stores 'light' byte-for-byte.
 * Only valid when T = string — TypeScript enforces this at the call site.
 */
export const rawStringCodec: Codec<string> = {
	serialize: (v) => v,
	deserialize: (v) => v
};

/**
 * Creates a guarded persistence accessor for a single localStorage key.
 *
 * All three methods follow the same pattern:
 *   (1) SSR guard: early return when localStorage is not available
 *   (2) try/catch: swallow security errors, quota errors, and private-mode errors silently
 *
 * This consolidates the identical SSR guard + silent-catch pattern that was previously
 * duplicated in the shared singletons (theme, disclaimer, favorites, lastEdited) and
 * CalculatorStore into one audited location.
 */
export function createPersistentValue<T>(opts: PersistentValueOptions<T>): PersistentValue<T> {
	const codec: Codec<T> = opts.codec ?? jsonCodec<T>();

	return {
		read(): T {
			if (typeof localStorage === 'undefined') return opts.defaultValue;
			try {
				const raw = localStorage.getItem(opts.key);
				if (opts.recover) {
					// D-02: recover fully owns the read path when present, replacing
					// codec.deserialize + fallback. The outer catch is defense-in-depth
					// if recover itself throws unexpectedly.
					return opts.recover(raw);
				}
				if (raw === null) return opts.defaultValue;
				// NOTE: JSON.parse('null') returns null — see jsonCodec comment above.
				return codec.deserialize(raw);
			} catch {
				// Silent: invalid JSON, security error, or private browsing mode — fall back to default.
				return opts.defaultValue;
			}
		},

		write(value: T): void {
			if (typeof localStorage === 'undefined') return;
			try {
				localStorage.setItem(opts.key, codec.serialize(value));
			} catch {
				// Silent: private browsing mode or storage quota exceeded.
			}
		},

		remove(): void {
			if (typeof localStorage === 'undefined') return;
			try {
				localStorage.removeItem(opts.key);
			} catch {
				// Silent: private browsing mode or security error.
			}
		}
	};
}
