# Architecture Research — v1.12 Feed Advance Calculator

**Project:** NICU Assistant
**Scope:** Integration of 4th clinical calculator into existing SvelteKit 2 + Svelte 5 shell
**Confidence:** HIGH (all file paths, line numbers, type unions, OKLCH tokens verified against current codebase)

---

## 1. Files to CREATE

| Path | Purpose |
|---|---|
| `src/lib/feeds/calculations.ts` | Pure functions, xlsx Sheet1 (TPN full nutrition) + Sheet2 (bedside advancement) parity. Exports `calculateBedsideAdvance(...)`, `calculateFullNutrition(...)`, `calculateIvBackfill(...)`. |
| `src/lib/feeds/calculations.test.ts` | Row-by-row parity vs Sheet1 + Sheet2, ~1% epsilon (per v1.8 GIR convention). |
| `src/lib/feeds/feeds-parity.fixtures.json` | Captured xlsx rows (both sheets) — same pattern as `gir-parity.fixtures.json`. |
| `src/lib/feeds/feeds-config.json` | Clinical input ranges (weight, ml/kg/d trophic/advance/goal, TPN dex%, SMOF ml/hr, enteral kcal/oz), dropdown option lists (trophic frequency q4h/q3h, advance cadence every feed / every other / every 3rd / BID / QD). |
| `src/lib/feeds/feeds-config.ts` | Typed wrapper over JSON (mirrors `gir-config.ts`). |
| `src/lib/feeds/feeds-config.test.ts` | Config shape tests. |
| `src/lib/feeds/types.ts` | `FeedsMode = 'bedside' \| 'full-nutrition'`, `TrophicFrequency`, `AdvanceCadence`, `FeedsStateData`. |
| `src/lib/feeds/state.svelte.ts` | `$state` singleton + sessionStorage (mirrors `src/lib/gir/state.svelte.ts`). |
| `src/lib/feeds/FeedAdvanceCalculator.svelte` | Main component — SegmentedToggle at top, two mode sections, shared weight. |
| `src/lib/feeds/FeedAdvanceCalculator.test.ts` | Component tests: empty state, bedside flow, full-nutrition flow, dropdown switching, mode toggle preserves weight, advisory rendering. |
| `src/routes/feeds/+page.svelte` | Thin route wrapper importing `FeedAdvanceCalculator`. |
| `e2e/feeds.spec.ts` | Playwright happy-path @ mobile 375 + desktop 1280, `inputmode="decimal"` regression. |
| `e2e/feeds-a11y.spec.ts` | Axe sweeps: light/dark × bedside/full-nutrition × focus state (≥4 sweeps, bringing suite to 20/20). |

## 2. Files to MODIFY

| Path | Change |
|---|---|
| `src/lib/shared/types.ts` (line 7) | **WAVE-0 LATENT BUG**: extend union `CalculatorId = 'morphine-wean' \| 'formula' \| 'gir' \| 'feeds'`. Unblocks downstream compile. |
| `src/lib/shell/registry.ts` | Append `feeds` entry; extend `identityClass` string-literal union (line 11) to include `'identity-feeds'`; import new icon from `@lucide/svelte`. |
| `src/lib/shell/NavShell.svelte` (lines 11–15) | **WAVE-0 LATENT BUG**: `activeCalculatorId` ternary chain is hardcoded — add `page.url.pathname.startsWith('/feeds') ? 'feeds'` branch. Without this, AboutSheet shows wrong content on `/feeds`. |
| `src/app.css` | Add `.identity-feeds` light + dark blocks (see §6). |
| `src/lib/shared/about-content.ts` | Add `feeds` entry to `aboutContent` Record — required by exhaustive `Record<CalculatorId, ...>` type (TS will error until added). |
| `package.json` | `"version": "1.12.0"` |
| `.planning/PROJECT.md` | Validated entries at milestone close. |

**Grep verification for `CalculatorId`**: only 4 touchpoints — `types.ts` (definition), `NavShell.svelte` (ternary + type annotation), `about-content.ts` (Record), `AboutSheet.svelte` (prop type, passive — auto-propagates).

## 3. Data Flow — Sheet1 + Sheet2 coexistence

**Recommendation: Single component, single registry entry, SegmentedToggle at top, shared weight input.**

```
[ Weight kg ]                     ← shared, always visible, persists across mode
[ Bedside | Full Nutrition ]      ← SegmentedToggle (identity-aware, v1.6 shared)
---
{#if mode === 'bedside'}
  [Trophic ml/kg/d] [Advance ml/kg/d] [Goal ml/kg/d]
  [Trophic freq dropdown: q4h÷6 / q3h÷8]
  [Advance cadence dropdown: every / every-other / every-3rd / BID / QD]
  → per-feed volume schedule
  [Total fluids ml/hr] → IV backfill rate
{:else}
  [TPN dex%] [TPN ml/hr] [SMOF ml/hr] [Enteral ml/hr] [Enteral kcal/oz]
  → Dextrose kcal, IL kcal, Enteral kcal, ml/kg, total kcal/kg
{/if}
```

**Trade-offs:**

| Option | Pro | Con | Verdict |
|---|---|---|---|
| **Single component + toggle** (recommended) | One nav tab; shared weight; one identity hue | Larger component file | ✓ Choose |
| Two registry entries | Bookmarkable modes | 5 tabs cramped on mobile 375; duplicates weight; two identity hues | ✗ Reject |
| Two components, one route, toggle | Cleaner files | Same state coupling; indirection | ✗ Reject |

Morphine v1.11 removing its linear/compounding toggle is NOT a precedent against the pattern — those modes were redundant (same formula). Sheet1 and Sheet2 are *different computations*, so the toggle is justified.

## 4. State Shape

```ts
// src/lib/feeds/types.ts
export type FeedsMode = 'bedside' | 'full-nutrition';
export type TrophicFrequency = 'q4h' | 'q3h';           // divisor 6 | 8
export type AdvanceCadence = 'every' | 'every-other' | 'every-3rd' | 'bid' | 'qd';

export interface FeedsStateData {
  mode: FeedsMode;
  weightKg: number | null;        // shared across modes

  // Bedside (Sheet2)
  trophicMlKgDay: number | null;
  advanceMlKgDay: number | null;
  goalMlKgDay: number | null;
  trophicFrequency: TrophicFrequency;
  advanceCadence: AdvanceCadence;
  totalFluidsMlHr: number | null;

  // Full nutrition (Sheet1)
  tpnDexPct: number | null;
  tpnMlHr: number | null;
  smofMlHr: number | null;
  enteralMlHr: number | null;
  enteralKcalPerOz: number | null;
}
```

Flat shape (not nested) matches `GirStateData`. Mode toggle changes which fields render, not which exist. Stale cross-mode values are harmless.

## 5. Build Order (dependency-respecting)

1. **Wave 0 — latent-bug fixes (must compile first)**: extend `CalculatorId`, add `feeds` stub to `aboutContent`, extend `NavShell` ternary, extend `identityClass` union, add `.identity-feeds` placeholder
2. **`types.ts`** for feeds module
3. **`feeds-config.json` + `feeds-config.ts` + config test**
4. **`calculations.ts` + parity fixtures + `calculations.test.ts`** — row-locked to xlsx Sheet1 + Sheet2. Gate: vitest green before UI.
5. **`state.svelte.ts`**
6. **`FeedAdvanceCalculator.svelte` + component test**
7. **`/feeds/+page.svelte` route**
8. **Finalize `.identity-feeds` OKLCH + registry wiring**
9. **AboutSheet content** — real copy citing `nutrition-calculator.xlsx` Sheet1/Sheet2
10. **Playwright happy-path spec**
11. **Axe-core a11y sweeps (REQUIRED BEFORE PR)** — light + dark × bedside + full-nutrition
12. **Version bump to 1.12.0** + PROJECT.md Validated updates

## 6. Identity Hue

**Existing hues:** Morphine 220 (Clinical Blue), Formula 195 (Teal-cyan), GIR 145 (Dextrose Green).

**Proposed: hue 30 — Warm Terracotta / Nutrition Orange.** (Pitfalls doc alternates: ~25 terracotta or ~300 magenta — final pick deferred to discuss-phase.)

Rationale: maximal hue separation (Δ≥115° from nearest), evokes "nutrition/feeds" semantically, avoids red 0–25 (error reserved).

```css
.identity-feeds {
  --color-identity:      oklch(50% 0.13 30);
  --color-identity-hero: oklch(94% 0.04 30);
}
.dark .identity-feeds,
[data-theme="dark"] .identity-feeds {
  --color-identity:      oklch(80% 0.10 30);
  --color-identity-hero: oklch(24% 0.05 30);
}
```

**⚠ AXE-CORE SWEEP REQUIRED BEFORE PR.** Per v1.5 Phase 20 Morphine pain + v1.8 Key Decision.

## 7. Wave-0 Latent Bug Summary

| File | Line | Fix |
|---|---|---|
| `src/lib/shared/types.ts` | 7 | Add `\| 'feeds'` to `CalculatorId` union |
| `src/lib/shared/about-content.ts` | 14 | Add `feeds` key to `Record<CalculatorId, AboutContent>` |
| `src/lib/shell/NavShell.svelte` | 11–15 | Extend `activeCalculatorId` ternary chain |
| `src/lib/shell/registry.ts` | 11 | Extend `identityClass` string-literal union |
| `src/lib/shared/components/AboutSheet.svelte` | 5, 11 | Passive — auto-propagates from `types.ts` |

Registry uses `id: string`; tightening to `id: CalculatorId` is optional tech-debt follow-up, out of scope for v1.12.
