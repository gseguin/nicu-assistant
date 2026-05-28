// src/lib/shared/favorites.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile
// Source pattern: theme.svelte.ts, disclaimer.svelte.ts (module-scope $state + get accessor + init())

import { createPersistentValue } from './persistent-value.js';
import { CALCULATOR_REGISTRY } from '$lib/shell/registry.js';
import type { CalculatorId } from './types.js';

export const FAVORITES_MAX = 4;
const STORAGE_KEY = 'nicu:favorites';
const SCHEMA_VERSION = 1;

interface StoredShape {
	v: number;
	ids: string[];
}

function defaultIds(): CalculatorId[] {
	// D-09: recompute from registry so defaults adapt if registry changes
	return CALCULATOR_REGISTRY.map((c) => c.id as CalculatorId).slice(0, FAVORITES_MAX);
}

function validIds(): Set<string> {
	return new Set(CALCULATOR_REGISTRY.map((c) => c.id));
}

/**
 * D-08 six-step recovery pipeline.
 * Returns a validated, capped array. Stored order is preserved verbatim.
 *   (1) null raw → defaults
 *   (2) JSON.parse throws → defaults
 *   (3) shape validation (typeof object, v === SCHEMA_VERSION, ids array) → defaults on mismatch
 *   (4) filter ids to registry-known strings
 *   (5) cap at FAVORITES_MAX
 *   (6) empty filtered → defaults; otherwise return filtered (preserving user's order — D-21)
 */
function recover(raw: string | null): CalculatorId[] {
	if (raw === null) return defaultIds(); // first-run (D-09 — caller writes back)
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return defaultIds();
	}
	if (
		typeof parsed !== 'object' ||
		parsed === null ||
		(parsed as StoredShape).v !== SCHEMA_VERSION ||
		!Array.isArray((parsed as StoredShape).ids)
	) {
		return defaultIds();
	}
	const valid = validIds();
	const filtered = (parsed as StoredShape).ids
		.filter((id): id is string => typeof id === 'string' && valid.has(id))
		.slice(0, FAVORITES_MAX);
	if (filtered.length === 0) return defaultIds();
	// D-21: preserve user's stored order verbatim. Only filter+cap remain.
	return filtered as CalculatorId[];
}

// Module-scope seam instance (MIG-03 / D-05):
// - Custom codec: serialize wraps ids in {v:SCHEMA_VERSION,ids} so pv.write(_ids) stores
//   the same {v:1,ids:[...]} shape that the old persist() did (PITFALL-01 prevention).
//   codec.deserialize is defined for type correctness but never called — recover owns read path.
// - recover: the existing 6-step pipeline passed verbatim (seam's recover hook signature matches).
const pv = createPersistentValue<CalculatorId[]>({
	key: STORAGE_KEY,
	defaultValue: defaultIds(),
	codec: {
		serialize: (ids) => JSON.stringify({ v: SCHEMA_VERSION, ids }), // writes {v:1,ids:[...]}
		// recover owns the read path, so this must never run. Fail loudly if it does, so a
		// future regression that drops the recover hook is caught immediately rather than
		// silently bypassing the 6-step recovery pipeline with an unsound object-as-array cast.
		deserialize: (): CalculatorId[] => {
			throw new Error('favorites: deserialize must not run — recover owns the read path');
		}
	},
	recover
});

// D-07 latent-init fix: seed defaults at module scope so NavShell renders correct tabs on
// first synchronous paint before onMount fires. defaultIds() calls CALCULATOR_REGISTRY which
// is a static const — no circular deps, safe at module scope.
let _ids = $state<CalculatorId[]>(defaultIds());
let _initialized = $state(false);

export const favorites = {
	get current(): readonly CalculatorId[] {
		return _ids;
	},
	get count(): number {
		return _ids.length;
	},
	get isFull(): boolean {
		return _ids.length >= FAVORITES_MAX;
	},
	get initialized(): boolean {
		return _initialized;
	},

	has(id: CalculatorId): boolean {
		return _ids.includes(id);
	},

	canAdd(id: CalculatorId): boolean {
		return !this.has(id) && !this.isFull;
	},

	toggle(id: CalculatorId): void {
		if (this.has(id)) {
			_ids = _ids.filter((x) => x !== id);
		} else if (!this.isFull) {
			// Defense-in-depth: canAdd() is the primary gate in UI (D-10)
			// Whole-array reassignment sorted by registry order (FAV-06 / D-07).
			const registryOrder = CALCULATOR_REGISTRY.map((c) => c.id);
			const next: string[] = [..._ids, id];
			_ids = registryOrder.filter((rid) => next.includes(rid)) as CalculatorId[];
		}
		// persist fires even on no-op cap case — harmless, keeps logic simple
		pv.write(_ids); // replaces: persist(_ids)
	},

	/** Called in +layout.svelte onMount — DOM is available here */
	init(): void {
		// D-05a: one allowed raw null-probe to detect first-run.
		// pv.read() cannot distinguish "nothing stored" from "stored defaults" because
		// recover(null) returns defaultIds() — same as recover of a stale/empty store.
		// This probe is required to know when to write-back defaults (T-01 requirement).
		// PITFALL-07: getItem may throw again inside pv.read() if spy is active — both
		// catches are silent, both fall back to defaultIds(). T-18 still passes.
		let raw: string | null = null;
		try {
			raw = localStorage.getItem(STORAGE_KEY);
		} catch {
			raw = null;
		}
		const recovered = pv.read(); // seam calls recover(raw) internally
		_ids = recovered;
		_initialized = true;
		// D-09: first-run write-back — seeds defaults into storage on first visit
		if (raw === null) pv.write(recovered); // replaces: persist(recovered)
	}
};
