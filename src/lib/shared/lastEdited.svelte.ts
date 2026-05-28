// src/lib/shared/lastEdited.svelte.ts
// Tiny per-calculator "last edited at" timestamp layer, backed by localStorage
// under its own key (e.g. `nicu_morphine_state_ts`). Kept separate from each
// state singleton's data shape so the 5 calculators don't each need to carry
// a redundant field in their own types. Mirrors the state-singleton pattern
// (eager init + silent on storage failure).
//
// Reactive-loop notes: persist() is called from $effect blocks that already
// depend on the full state shape. Stamping with Date.now() every effect pass
// would create a value that changes on every run, which — combined with Svelte
// 5's proxied state — can re-enter the effect through unrelated subscribers.
// To keep the write idempotent from the effect's perspective, stamp() skips
// the write when the new timestamp is within a minute of the previous one
// (effects firing back-to-back during a render don't need minute-precision
// differentiation; only real human edits, separated by at least seconds,
// matter for the stale-value UX).

import { createPersistentValue } from './persistent-value.js';
import type { PersistentValue } from './persistent-value.js';

const STAMP_DEBOUNCE_MS = 60_000;

export class LastEdited {
  current = $state<number | null>(null);
  #key: string;
  #pv: PersistentValue<number | null>;

  constructor(key: string) {
    this.#key = key;
    // MIG-04 / D-07: use a recover hook (NOT a plain codec) to handle the
    // empty-string edge case. Number('') === 0 which isFinite — a bare
    // {serialize: String, deserialize: Number} codec would set current = 0
    // instead of null (PITFALL-06). The recover hook replicates the original
    // `if (raw)` falsy guard exactly.
    // SSR guard (`typeof localStorage === 'undefined'`) moves into the seam.
    this.#pv = createPersistentValue<number | null>({
      key: this.#key,
      defaultValue: null,
      recover: (raw: string | null): number | null => {
        if (!raw) return null; // handles null (nothing stored) AND '' (empty string)
        const n = Number(raw);
        return Number.isFinite(n) ? n : null; // handles non-numeric garbage
      }
    });
    // Replaces: if (typeof localStorage === 'undefined') return;
    //           try { const raw = getItem; if (raw) { n = Number(raw); current = isFinite(n) ? n : null } } catch {}
    this.current = this.#pv.read();
  }

  /** Stamp the timestamp to now. Called from the owning singleton's persist(). */
  stamp(): void {
    const now = Date.now();
    // Skip if we stamped within the debounce window — this keeps effects
    // that call persist() on every read from triggering unbounded recursion.
    if (this.current !== null && now - this.current < STAMP_DEBOUNCE_MS) return;
    this.current = now; // state update BEFORE write (stamp-outside-try semantics preserved)
    this.#pv.write(this.current); // replaces: try { localStorage.setItem(key, String(this.current)) } catch {}
    // stamp-outside-try: this.current = now runs before pv.write, so a setItem throw
    // does NOT revert this.current. calculator-store.test.ts line 125-137 relies on this.
  }

  /** Clear the timestamp. Called from the owning singleton's reset(). */
  clear(): void {
    this.current = null;
    this.#pv.remove(); // replaces: try { localStorage.removeItem(key) } catch {}
  }
}

/** Format epoch ms as a compact relative time string for the recap strip. */
export function formatLastEdited(ts: number | null, now: number = Date.now()): string | null {
  if (ts === null) return null;
  const diffMs = now - ts;
  if (diffMs < 0) return 'just now';
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

/** Stale threshold: 4 hours (matches typical NICU shift slice). */
export const STALE_THRESHOLD_MS = 4 * 60 * 60 * 1000;

export function isStale(ts: number | null, now: number = Date.now()): boolean {
  if (ts === null) return false;
  return now - ts > STALE_THRESHOLD_MS;
}
