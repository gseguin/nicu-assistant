// src/lib/shared/favorites.svelte.ts
// Svelte 5 rune syntax — .svelte.ts extension required for $state to compile
// Source pattern: theme.svelte.ts, disclaimer.svelte.ts (module-scope $state + get accessor + init())

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
 * Returns a validated, registry-ordered, capped array.
 *   (1) null raw → defaults
 *   (2) JSON.parse throws → defaults
 *   (3) shape validation (typeof object, v === SCHEMA_VERSION, ids array) → defaults on mismatch
 *   (4) filter ids to registry-known strings
 *   (5) cap at FAVORITES_MAX
 *   (6) empty filtered → defaults; otherwise re-sort by registry order
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
	const registryOrder = CALCULATOR_REGISTRY.map((c) => c.id);
	const filtered = (parsed as StoredShape).ids
		.filter((id): id is string => typeof id === 'string' && valid.has(id))
		.slice(0, FAVORITES_MAX);
	if (filtered.length === 0) return defaultIds();
	// Sort by registry order (FAV-06)
	return registryOrder.filter((id) => filtered.includes(id)) as CalculatorId[];
}

function persist(ids: readonly CalculatorId[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: SCHEMA_VERSION, ids }));
	} catch {
		// Silent: private browsing mode or storage quota exceeded
	}
}

let _ids = $state<CalculatorId[]>([]);
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
		persist(_ids);
	},

	/** Called in +layout.svelte onMount — DOM is available here */
	init(): void {
		let raw: string | null = null;
		try {
			raw = localStorage.getItem(STORAGE_KEY);
		} catch {
			raw = null;
		}
		const recovered = recover(raw);
		_ids = recovered;
		_initialized = true;
		// D-09: first-run seeding — if nothing stored, write defaults immediately
		if (raw === null) persist(recovered);
	}
};
