---
phase: 29
plan: 01
subsystem: gir
tags: [gir, titration, hero-swap, a11y, v1.9]
requires: []
provides: [gir-delta-rate-hero, gir-stop-card, gir-emdash-neutral]
affects: [src/lib/gir/GlucoseTitrationGrid.svelte]
tech-stack:
  added: []
  patterns:
    - "v1.8 hero pattern (text-display font-black num + text-ui tertiary unit) reused verbatim"
    - "Three-branch hero: STOP word | em-dash (Δ=0) | ▲/▼ abs ml/hr (word)"
    - "action-first ariaLabelFor composition"
key-files:
  created: []
  modified:
    - src/lib/gir/GlucoseTitrationGrid.svelte
    - src/lib/gir/GlucoseTitrationGrid.test.ts
    - e2e/gir.spec.ts
decisions:
  - "STOP card: Option A (pure-type word hero) shipped — no border/eyebrow escalation needed"
  - "Em-dash Δ=0 hero: shipped with --color-text-tertiary as planned (axe passed)"
  - "Desktop (increase)/(decrease) word color: escalated from tertiary → secondary (Finding 2 fallback applied — small-text 16px failed 4.5:1 on identity-hero in dark mode)"
metrics:
  duration: ~25min
  completed: 2026-04-09
---

# Phase 29 Plan 01: GIR Titration Hero Swap Summary

One-liner: Swapped GIR titration row hero from GIR mg/kg/min to Δ rate (▲/▼ abs ml/hr + word) on mobile cards + desktop rows, demoted GIR to rightmost secondary slot, em-dash hero for Δ=0, pure-type STOP word hero for severe-neuro, action-first aria-label — all 16 axe sweeps green in light + dark.

## What shipped

- **Mobile hero:** three-branch — STOP word (severe-neuro) | em-dash `—` (Δ=0) | `▲/▼ abs ml/hr (word)` (normal), all at `text-display font-black`.
- **Mobile secondary metrics row:** reordered to `Fluids | Rate | GIR`, now rendered for every row (including stopInfusion per Decision 5).
- **Desktop header:** reordered to `Range | Δ rate | Target fluids | Target rate | Target GIR`.
- **Desktop data row:** Δ rate cell at `text-base font-semibold` (density caveat honored — no text-display bleed). STOP row uses `col-span-4` full-row STOP qualifier. GIR cell demoted (no font-semibold).
- **`ariaLabelFor` rewrite:** action-first for normal buckets ("Glucose X. increase rate by Y ml/hr. Target GIR..."), "No change in rate" for Δ=0, "Severe neuro signs. Stop dextrose infusion." for stopInfusion.
- **No touch:** `formatDelta()`, `calculations.ts`, `GirCalculator.svelte`, role=radiogroup, keyboard nav — all unchanged.

## STOP card option shipped

**Option A (pure-type STOP word hero)** — no border escalation, no eyebrow escalation. Axe passed in both themes with only the Δ-word-color fallback applied elsewhere.

## Em-dash hero color

**`--color-text-tertiary`** as originally planned. Axe selected-bucket sweep passed in light + dark; no escalation needed for the em-dash itself.

## Axe fallback applied

One fallback from Finding 2 ladder: the **desktop `(increase)`/`(decrease)` inline span** was escalated from `--color-text-tertiary` → `--color-text-secondary`. Reason: at `text-base` (16px, normal weight), the 4.5:1 threshold applied (not 3:1 large-text), and tertiary on `--color-identity-hero` background in dark mode measured 3.61:1. Secondary clears 4.5:1. Single-line change on the desktop data row only. Mobile hero word (inside `text-ui text-tertiary`) was unaffected because mobile selected-bucket sweep passed — mobile uses card bg not identity-hero when selected at `text-ui` scale.

## Task 1 audit finding

`GirCalculator.test.ts` has exactly one hit: line 59 `getAllByText('mg/kg/min').length > 0`. This is a layout-agnostic count assertion — after the swap the grid still renders `mg/kg/min` in the secondary slot AND `GirCalculator.svelte` top-level hero still shows it. **No update required.** Test still passes.

## Gates

| Gate | Result |
|------|--------|
| GIR unit + component tests | 52/52 green |
| Full `pnpm vitest run` | 203/204 green — 1 pre-existing unrelated failure (`CALCULATOR_REGISTRY` length assertion, documented in `deferred-items.md`) |
| `pnpm svelte-check` | Pre-existing errors only (documented in `deferred-items.md`) — zero new errors from phase 29 |
| `pnpm lint` | N/A — eslint not installed in this project |
| `pnpm exec playwright test e2e/gir.spec.ts` | 6/6 green at mobile 375 + desktop 1280 |
| **16/16 axe sweeps (gir 6 + morphine 6 + fortification 4) light+dark** | **16/16 green** |

## Deviations from Plan

**1. [Rule 3 - Blocking] Test regex assertions split-text broke on new hero structure**
- **Found during:** Task 3
- **Issue:** The plan's "survive unchanged" regex assertions `/▲.*\(increase\)/` and `/▼.*\(decrease\)/` (test lines 79–87) failed because testing-library's `getByText` doesn't match across separate text-node boundaries, and the new hero splits glyph/abs/unit/word into 4 spans.
- **Fix:** Split each into two separate `getAllByText('▲')` + `getAllByText('(increase)')` assertions (same semantic guarantee, split-node-aware).
- **Files modified:** `src/lib/gir/GlucoseTitrationGrid.test.ts`
- **Commit:** included in `374fd8e` (Task 3 GREEN).

**2. [Rule 3 - Blocking] E2E Δ rate hero visibility selector collision with aria-hidden glyph**
- **Found during:** Task 4
- **Issue:** First attempt asserted `getByText('▲').first()` which matched the aria-hidden span — Playwright's `toBeVisible()` treats `aria-hidden="true"` as hidden. Second attempt matched `(increase)` but `.first()` resolved to the hidden mobile layout span on the desktop viewport (Tailwind `sm:hidden` renders but CSS-hides).
- **Fix:** Used `getByText(/\((increase|decrease)\)/).locator('visible=true').first()` to select the first actually-visible match regardless of which layout is active.
- **Files modified:** `e2e/gir.spec.ts`
- **Commit:** `a088d4c`.

**3. [Rule 1 - Bug / Finding 2 fallback] Desktop direction word contrast fail in selected dark**
- **Found during:** Task 5
- **Issue:** `(increase)`/`(decrease)` inline span at `text-base` (normal weight, 16px) on `--color-identity-hero` dark bg measured 3.61:1 against `--color-text-tertiary` — fails WCAG 1.4.3 4.5:1.
- **Fix:** Bumped that span to `--color-text-secondary` (single line change, no new tokens). Documented fallback path in plan.
- **Files modified:** `src/lib/gir/GlucoseTitrationGrid.svelte`
- **Commit:** `c4885f4`.

## Deferred Issues (pre-existing, out of scope)

See `.planning/phases/29-gir-titration-hero-swap/deferred-items.md`:
- `src/lib/shell/__tests__/registry.test.ts` — asserts length 2, registry has 3 (pre-existing).
- `pnpm svelte-check` — 5 pre-existing errors in untouched files (GirCalculator bucket type narrowing, $app modules, virtual:pwa-* modules).

## Commits

- `6d99017` — test(29-01): update component tests for Δ rate hero contract (RED)
- `374fd8e` — feat(29-01): swap GIR titration hero to Δ rate, demote GIR, STOP card, em-dash Δ=0 (GREEN)
- `a088d4c` — test(29-01): add Δ rate hero visibility assertion to gir E2E
- `c4885f4` — fix(29-01): bump desktop (increase/decrease) word to secondary for 4.5:1 on selected dark

## Known Stubs

None. All heroes wired to real row data. No placeholder copy.

## Self-Check: PASSED
- src/lib/gir/GlucoseTitrationGrid.svelte: FOUND (modified)
- src/lib/gir/GlucoseTitrationGrid.test.ts: FOUND (modified)
- e2e/gir.spec.ts: FOUND (modified)
- Commits 6d99017, 374fd8e, a088d4c, c4885f4: FOUND in git log
- 16/16 axe sweeps green: VERIFIED (Task 5 run)
- GIR vitest 52/52 green: VERIFIED (Task 3 run)
- GIR E2E 6/6 green: VERIFIED (Task 4 run)
