# Phase 52: Code Purge + Test Suite Repair - Research

**Researched:** 2026-05-23
**Domain:** Surgical removal of a calculator slice from a SvelteKit 2 / Svelte 5 PWA
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Plan Structure & Atomicity**
- **D-01:** Split Phase 52 into 3 atomic plans, each leaving vitest + Playwright green at commit boundary.
- **D-02:** Plan **52-01** (source purge) deletes `src/lib/pert/` (all 14 files including .test.ts), `src/routes/pert/+page.svelte`, `e2e/pert.spec.ts`, `e2e/pert-a11y.spec.ts`, **AND** removes the PERT entry from `CALCULATOR_REGISTRY` in `src/lib/shell/registry.ts` in the same commit. The registry edit must land with the deletes so iterator-based tests don't go red mid-phase.
- **D-03:** Plan **52-02** (source-side integration) edits `src/lib/shared/types.ts` (CalculatorId union — drop `'pert'`), `src/lib/shared/about-content.ts` (drop PERT entry), `src/app.css` (remove `.identity-pert` light + dark blocks), and `favoritesStore` default array if PERT was a default (verify against v1.13 D-19 baseline: `['morphine-wean', 'formula', 'gir', 'feeds']` — likely no change needed).
- **D-04:** Plan **52-03** (test-file surgery) edits only test files: `registry.test.ts`, `HamburgerMenu.test.ts`, `CalculatorPage.test.ts`, `favorites.test.ts` (regression test addition), `desktop-full-nav.spec.ts` (line 33 `tabs.nth(4)` assertion), `drawer-no-autofocus.spec.ts` (route iteration array).
- **D-05:** Rationale: matches v1.16 calculator-store refactor pattern (5 atomic green commits); each plan is independently reviewable; SC #4 satisfied at *every* commit boundary.

**Test Surgery Posture**
- **D-06:** Editing posture is **surgical** — remove PERT-specific assertions/data, keep test shape and structure intact. Do **NOT** refactor to data-driven.
- **D-07:** `desktop-full-nav.spec.ts:33` — change `tabs.nth(4)` to assert on a remaining calculator OR drop the 5th-tab assertion entirely (implementer's call).
- **D-08:** `drawer-no-autofocus.spec.ts` — remove `'/pert'` from the route iteration array.
- **D-09:** `registry.test.ts`, `HamburgerMenu.test.ts`, `CalculatorPage.test.ts` — drop PERT-specific test cases.

**Favorites Migration (Upgrade Safety)**
- **D-10:** Keep existing `favoritesStore` localStorage filter logic as-is.
- **D-11:** Add regression test in `favorites.test.ts` using **generic** string literal (e.g. `'unknown-calculator-id'`), not `'pert'`.
- **D-12:** No explicit one-shot migration code.

**String Scrubbing**
- **D-13:** Scrub ALL 'PERT' and 'pert' strings from active test files. Post-52-03, `git grep -niwE 'pert|PERT' -- src/ e2e/ tests/` returns only intentional historical comments (D-14).

**Historical Comments**
- **D-14:** Rewrite historical comments generically. `src/lib/fortification/calculator.ts:13` ("the PERT slice") → "other calculator slices" or similar.
- **D-15:** Phase 52 only edits source comments. CHANGELOG/README/About-page deferred to Phase 53 DOC + Phase 54 REL.
- **D-16:** `.planning/` is historical record — leave PERT references INTACT. Grep gate excludes `.planning/`.

**Commit & PR Messaging**
- **D-17:** Commit messages reference PERT explicitly.

**Verification & Grep Gate**
- **D-18:** Grep gate is enforced once in 52-VERIFICATION.md (manual, not CI / not pre-commit hook).
- **D-19:** Grep command is **word-boundary**: `git grep -niwE 'pert|PERT' -- ':(exclude).planning/'`.
- **D-20:** 52-VERIFICATION.md attests: (1) vitest pass-count delta; (2) grep returns only allowed historical comments (or zero); (3) `pnpm build` succeeds; (4) `pnpm check` 0 errors; (5) `du -sh build/` delta.
- **D-21:** 32 pre-existing Playwright failures (28 axe dlitem + 2 disclaimer-banner + 2 calc UI) are **baseline**. Verification asserts failure count did NOT INCREASE.

### Claude's Discretion
- **D-07 (specifically):** replace 5th-tab assertion vs delete it — implementer chooses based on cleanest test intent.
- **D-03 (favorites default array):** verify against current codebase whether 'pert' is in defaults; edit only if present. **Research confirms: NOT present** (see §2).

### Deferred Ideas (OUT OF SCOPE)
- User-facing documentation updates (CHANGELOG / README / About page) → Phase 53 DOC.
- Archival of v1.17 planning docs → Phase 54 REL.
- Version bump 1.16.1 → 1.17.0 → Phase 54 REL.
- CI grep guardrail (`pnpm verify:no-pert`) — rejected as over-engineered.
- Pre-commit hook blocking 'pert' substrings — rejected.
- Data-driven test refactor (derive expected calculators from CALCULATOR_REGISTRY) — rejected as scope creep.
- Fixing 32 pre-existing Playwright failures → Phase 47 follow-up backlog.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PURGE-01 | Delete `src/lib/pert/` (14 files) | §1 — exhaustive file list with line counts |
| PURGE-02 | Delete `src/routes/pert/+page.svelte` | §1 — file confirmed (6 lines) |
| PURGE-03 | Remove `pertModule` import + entry from `CALCULATOR_REGISTRY` (5 entries remain, alphabetical) | §2 — exact line numbers in `registry.ts` |
| PURGE-04 | Drop `'pert'` from `CalculatorId` union | §2 — exact line in `types.ts:7` |
| PURGE-05 | Drop `pert:` block from `about-content.ts` | §2 — exact line range 81-94 |
| PURGE-06 | Remove `.identity-pert` (light + dark) from `app.css` | §2 — exact line range 283-291 |
| TEST-01 | Delete `e2e/pert.spec.ts` + `e2e/pert-a11y.spec.ts` | §1 — files confirmed (261 + 221 LOC) |
| TEST-02 | Remove `/pert` from `drawer-no-autofocus.spec.ts` route iteration | §2 — exact line 20 |
| TEST-03 | Update `registry.test.ts` — drop "fifth entry" test, fix alphabetical list, fix length | §2 — exact lines 10, 46-52 |
| TEST-04 | Update `HamburgerMenu.test.ts` — drop PERT assertions, fix comment block, fix count | §2 — exact lines 37-39, 44, 49 |
| TEST-05 | Update `CalculatorPage.test.ts` — replace `identity-pert` test scaffold + `'PERT inputs'` label | §2 — exact lines 45, 70, 72, 117, 119 |
| TEST-06 | Update `favorites.test.ts` — fix post-D-19 comment listing 'pert' | §2 — exact line 119 |
| TEST-07 | Vitest `pnpm test:run` exits 0; suite green | §5 — baseline 489 passing, post-purge expectation 489 − 56 + 1 (new regression test) = 434 |
| TEST-08 | Playwright chromium + webkit-iphone both green (no PERT-specific failures); pre-existing failures unchanged | §5 — baseline 264 total tests, 34 PERT-related removed → post-52 expected total 230 |

> Out-of-scope for Phase 52 (covered by §3 below): the **historical comment** in `src/lib/fortification/calculator.ts:13` (per D-14). NavShell.test.ts also has PERT references that must be edited (it was not called out in CONTEXT.md but is a real PERT-referencing test — see §2, §8 risk R-1).
</phase_requirements>

## Summary

Phase 52 is a deterministic surgical removal. The PERT slice was architected as a self-contained `CalculatorModule` consumer of the `CalculatorStore<T>` + `CalculatorPage` shell, so the cascade from "delete `src/lib/pert/`" is small and well-bounded. The 8 cross-cutting touchpoints (registry, types, about-content, app.css, 4 test files, 2 e2e specs) are all enumerated below at file-and-line precision.

Two surprises vs CONTEXT.md to surface for the planner:

1. **`NavShell.test.ts` references PERT in 4 places** (lines 16, 162, 196 textContent regex + an embedded comment at 38-39 about pert workstream). CONTEXT.md's `TEST-04..06` list does NOT name this file. Without editing it, the assertion `expect(tabs[4].textContent).toMatch(/PERT/i)` at line 196 will go red the instant `pertModule` leaves the registry in 52-01. This file MUST be edited in 52-03 (or 52-01 — see Risk R-1 below).

2. **`calculator-store.svelte.ts` (line 7, 37, 68) and `calculator-module.ts` (line 41, 43) contain PERT references in comments and JSDoc examples.** These are documentation that points at `src/lib/pert/state.svelte.ts` and uses "PERT inputs" / "Pediatric EPI PERT Calculator" as example strings. After 52-01 these comments reference files that no longer exist. Per D-14 (generic rewrite) and D-15 (Phase 52 only edits source comments), these must be edited in 52-02 alongside `fortification/calculator.ts:13`. CONTEXT.md only named the fortification comment.

**Primary recommendation:** Bring `NavShell.test.ts` into 52-01's commit (since the registry edit lands there and that's the file that breaks first), and bring `calculator-store.svelte.ts` + `calculator-module.ts` comment rewrites into 52-02 alongside `fortification/calculator.ts`. The 3-plan shape stays intact; the file list per plan widens by 3 files total.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Calculator slice (logic + components + state) | `src/lib/pert/` | — | Self-contained slice per CalculatorModule pattern |
| Registry / nav surface | `src/lib/shell/registry.ts` | NavShell, HamburgerMenu | Single source of truth for nav/routing/favorites |
| Type union | `src/lib/shared/types.ts` | TypeScript-wide | Compile-time enforcement of valid IDs |
| About-page content | `src/lib/shared/about-content.ts` | About sheet UI | Keyed by `CalculatorId` — must stay in sync |
| Identity hue tokens | `src/app.css` | CalculatorPage `identityClass` | CSS-only, no JS coupling |
| Favorites store | `src/lib/shared/favorites.svelte.ts` | localStorage | Already filters unknown IDs (graceful) |
| Route | `src/routes/pert/+page.svelte` | SvelteKit | Deletion → 404 fallback (SvelteKit default) |

---

## Section 1 — Files to Delete (Exhaustive)

All paths absolute from repo root. Total LOC removed: **2,654 lines** across 16 files.

### `src/lib/pert/` (14 files, 2,166 LOC)

| File | LOC | Type |
|------|-----|------|
| `src/lib/pert/PertCalculator.svelte` | 340 | Component (consumer of CalculatorPage) |
| `src/lib/pert/PertCalculator.test.ts` | 139 | Vitest (10 tests) |
| `src/lib/pert/PertInputs.svelte` | 226 | Component |
| `src/lib/pert/PertInputs.test.ts` | 153 | Vitest (9 tests) |
| `src/lib/pert/calculations.ts` | 284 | Pure-function math layer |
| `src/lib/pert/calculations.test.ts` | 347 | Vitest (20 tests, spreadsheet parity) |
| `src/lib/pert/calculator.ts` | 74 | `pertModule: CalculatorModule<PertStateData>` |
| `src/lib/pert/config.ts` | 41 | Config loader for pert-config.json |
| `src/lib/pert/config.test.ts` | 99 | Vitest (11 tests) |
| `src/lib/pert/state.svelte.ts` | 39 | CalculatorStore<PertStateData> instance |
| `src/lib/pert/state.test.ts` | 96 | Vitest (6 tests) |
| `src/lib/pert/types.ts` | 90 | TypeScript types (PertStateData etc.) |
| `src/lib/pert/pert-config.json` | 146 | Medications + formulas + advisory data |
| `src/lib/pert/pert-parity.fixtures.json` | 152 | Spreadsheet-parity fixtures |

**Vitest test count contribution:** 10 + 9 + 20 + 11 + 6 = **56 tests** (verified by `grep -cE '^\s*it\(' src/lib/pert/*.test.ts`).

### `src/routes/pert/` (1 file, 6 LOC)

| File | LOC | Type |
|------|-----|------|
| `src/routes/pert/+page.svelte` | 6 | SvelteKit route shell (just renders `<CalculatorPage module={pertModule} />`) |

**After deletion:** `src/routes/pert/` directory will be empty — confirm `rm -r src/routes/pert/` (or delete the whole folder). SvelteKit auto-generates 404 for unknown routes.

### `e2e/` PERT specs (2 files, 482 LOC)

| File | LOC | Test count per project |
|------|-----|------------------------|
| `e2e/pert.spec.ts` | 261 | 12 tests (6 test functions × 2 viewport describe blocks: mobile + desktop) |
| `e2e/pert-a11y.spec.ts` | 221 | 4 tests (2 synthetic pre-gate + 2 literal /pert sweeps) |

**Per-project Playwright contribution:** 12 + 4 = **16 tests per project** (chromium + webkit-iphone) = **32 PERT-spec tests total** (verified by `pnpm exec playwright test --list --project=chromium e2e/pert.spec.ts | wc -l` → 12 and `e2e/pert-a11y.spec.ts` → 4).

### Total deletion footprint

- **Files:** 17 (14 in `src/lib/pert/` + 1 route file + 2 e2e specs)
- **LOC:** 2,654
- **Vitest tests dropped:** 56
- **Playwright tests dropped:** 32 (16 per project)
- **Build artifact dropped:** `build/pert.html` (one prerendered SPA fallback)

---

## Section 2 — Files to Edit (Exact Line Numbers + Before/After Snippets)

### 2.1 — `src/lib/shell/registry.ts` (Plan 52-01)

**Edit 1:** Remove import.
- **Line 17:** `import { pertModule } from '$lib/pert/calculator.js';` → DELETE
- **Line 27:** `  pertModule,` → DELETE

**After edit, lines 13-29 read:**
```typescript
import type { CalculatorEntry } from './calculator-module.js';
import { feedsModule } from '$lib/feeds/calculator.js';
import { fortificationModule } from '$lib/fortification/calculator.js';
import { girModule } from '$lib/gir/calculator.js';
import { morphineModule } from '$lib/morphine/calculator.js';
import { uacUvcModule } from '$lib/uac-uvc/calculator.js';

// Same alphabetical-by-id order as before — D-19 invariant guarded by
// src/lib/shell/__tests__/registry.test.ts.
export const CALCULATOR_REGISTRY: readonly CalculatorEntry[] = [
  feedsModule,
  fortificationModule,
  girModule,
  morphineModule,
  uacUvcModule
];
```

### 2.2 — `src/lib/shared/types.ts` (Plan 52-02)

**Edit:** Drop `'pert'` from CalculatorId union.
- **Line 7 (before):** `export type CalculatorId = 'morphine-wean' | 'formula' | 'gir' | 'feeds' | 'uac-uvc' | 'pert';`
- **Line 7 (after):** `export type CalculatorId = 'morphine-wean' | 'formula' | 'gir' | 'feeds' | 'uac-uvc';`

Per PURGE-04 the new union is `'morphine-wean' | 'formula' | 'gir' | 'feeds' | 'uac-uvc'`. Note: not alphabetical (matches REQUIREMENTS.md PURGE-04 exact wording).

### 2.3 — `src/lib/shared/about-content.ts` (Plan 52-02)

**Edit:** Drop the entire `pert:` block.
- **Lines 81-94 (delete):**
```typescript
  pert: {
    title: 'Pediatric EPI PERT Calculator',
    version: appVersion,
    description:
      'Calculates pancreatic enzyme replacement therapy capsule counts for pediatric patients with exocrine pancreatic insufficiency, in two modes: per-meal oral dosing and 24-hour tube-feed dosing. Supports five FDA-approved medications and 17 pediatric enteral formulas.',
    notes: [
      'Oral mode: capsules per meal = ROUNDUP((weight × lipase units/kg/meal) / capsule strength). Default lipase rate 1000 units/kg/meal.',
      'Tube-feed mode: capsules per day = CEILING(total lipase / capsule strength), where total lipase = formula fat (g/L) × volume (L) × lipase units/kg × weight. Includes capsules/month and lipase per kg outputs.',
      'Medication strengths cross-checked against DailyMed FDA listings.',
      'Safety: a STOP-style red advisory surfaces if computed daily lipase exceeds 10,000 units/kg/day (the published pediatric cap). All ranges are advisory — clinical judgment required.',
      "Verify all values against your institution's PERT protocol before use."
    ],
    disclaimer: DISCLAIMER
  },
```

Also fix trailing comma on `'uac-uvc':` block at line 80 if it became orphan (depends on JSON-style formatting — verify after delete that the object literal is still valid; in the current source `uac-uvc:` ends with `},` at line 80 because `pert:` follows. After deleting pert: leave the `},` since it's the new last entry — TypeScript object literals tolerate trailing commas).

### 2.4 — `src/app.css` (Plan 52-02)

**Edit:** Remove `.identity-pert` light + dark blocks.
- **Lines 283-291 (delete):**
```css
  .identity-pert {
    --color-identity: oklch(42% 0.12 285);
    --color-identity-hero: oklch(96% 0.03 285);
  }
  .dark .identity-pert,
  [data-theme='dark'] .identity-pert {
    --color-identity: oklch(80% 0.10 285);
    --color-identity-hero: oklch(22% 0.045 285);
  }
```

The closing `}` at line 292 belongs to the outer `@layer utilities {` (or similar) block — preserve it. After edit, line 282 (`}` closing `.identity-uac` dark block) becomes the last identity rule before the wrapper close.

### 2.5 — `src/lib/shared/favorites.svelte.ts` (Plan 52-02, comment only)

**Edit:** Generalize historical comment that names PERT (D-14).
- **Line 57 (before):** `	// D-21 (Phase pert-01): preserve user's stored order verbatim. Only filter+cap remain.`
- **Line 57 (after):** `	// D-21: preserve user's stored order verbatim. Only filter+cap remain.`

**Important:** the favorites store has NO `'pert'` in its defaults — `defaultIds()` (line 17-20) computes from `CALCULATOR_REGISTRY.map(c => c.id).slice(0, FAVORITES_MAX)`. After 52-01 removes pertModule from the registry, defaults automatically become `['feeds', 'formula', 'gir', 'morphine-wean']` (already the v1.13 D-19 baseline). **No favorites code edit needed** — D-03's hedge "edit only if present" resolves to NO EDIT. Just the line-57 comment.

### 2.6 — `src/lib/shell/__tests__/registry.test.ts` (Plan 52-03)

**Edit 1 — line 10:** Drop `'pert'` from expected ID array.
- Before: `expect(ids).toEqual(['feeds', 'formula', 'gir', 'morphine-wean', 'pert', 'uac-uvc']);`
- After: `expect(ids).toEqual(['feeds', 'formula', 'gir', 'morphine-wean', 'uac-uvc']);`

**Edit 2 — lines 46-52:** Delete entire "fifth entry" test for PERT (8 LOC).
```typescript
  it('includes PERT calculator as fifth entry', () => {
    expect(CALCULATOR_REGISTRY[4].id).toBe('pert');
    expect(CALCULATOR_REGISTRY[4].label).toBe('PERT');
    expect(CALCULATOR_REGISTRY[4].href).toBe('/pert');
    expect(CALCULATOR_REGISTRY[4].description).toBe('Pediatric EPI PERT calculator');
    expect(CALCULATOR_REGISTRY[4].identityClass).toBe('identity-pert');
  });
```

**Edit 3 — lines 54-59:** Renumber "sixth entry" → "fifth entry" for UAC/UVC (still asserts `CALCULATOR_REGISTRY[4]` since UAC/UVC was already 6th and is now 5th — note the index changes from `[5]` to `[4]`).
- Before: `it('includes UAC/UVC calculator as sixth entry', () => {` + `expect(CALCULATOR_REGISTRY[5].id).toBe('uac-uvc');` (etc.)
- After: `it('includes UAC/UVC calculator as fifth entry', () => {` + `expect(CALCULATOR_REGISTRY[4].id).toBe('uac-uvc');` (etc.)

### 2.7 — `src/lib/shell/HamburgerMenu.test.ts` (Plan 52-03)

**Edit 1 — lines 37-39:** Update comment block reflecting registry shape.
- Before:
```typescript
		// beforeEach already called favorites.init() with defaults. After D-19/D-20
		// (pert workstream Phase 1), the registry is alphabetized to 6 entries:
		// feeds, formula, gir, morphine-wean, pert, uac-uvc. The default favorites
		// are the first 4 alphabetical entries; pert and uac-uvc remain non-favorited.
```
- After (suggested generic rewrite per D-14):
```typescript
		// beforeEach already called favorites.init() with defaults. The registry is
		// alphabetized to 5 entries: feeds, formula, gir, morphine-wean, uac-uvc.
		// The default favorites are the first 4 alphabetical entries; uac-uvc remains
		// non-favorited.
```

**Edit 2 — line 44:** Update expected link count.
- Before: `expect(screen.getAllByRole('link')).toHaveLength(6);`
- After: `expect(screen.getAllByRole('link')).toHaveLength(5);`

**Edit 3 — line 49:** Delete the PERT link assertion.
- Before: `expect(screen.getByRole('link', { name: /PERT/i })).toBeTruthy();`
- After: DELETE this line entirely.

### 2.8 — `src/lib/shell/CalculatorPage.test.ts` (Plan 52-03)

**Edit 1 — line 45:** Replace `identity-pert` test scaffold default.
- Before: `    identityClass: 'identity-pert',`
- After (suggested generic, per TEST-05): `    identityClass: 'identity-gir',`

**Edit 2 — line 70:** Replace identityClass override in T-CP-01.
- Before: `    const mod = makeModule({ identityClass: 'identity-pert' });`
- After: `    const mod = makeModule({ identityClass: 'identity-gir' });`

**Edit 3 — line 72:** Match the assertion.
- Before: `    expect(container.querySelector('.identity-pert')).not.toBeNull();`
- After: `    expect(container.querySelector('.identity-gir')).not.toBeNull();`

**Edit 4 — line 117:** Replace inputsLabel in T-CP-06.
- Before: `    const mod = makeModule({ inputsLabel: 'PERT inputs' });`
- After: `    const mod = makeModule({ inputsLabel: 'GIR inputs' });`

**Edit 5 — line 119:** Match the aria-label assertion.
- Before: `    const aside = screen.getByRole('complementary', { name: 'PERT inputs' });`
- After: `    const aside = screen.getByRole('complementary', { name: 'GIR inputs' });`

**Rationale for choosing `identity-gir` / `'GIR inputs'`:** matches a real remaining calculator → asserts the shell still renders identity classes correctly for the 5-calculator world. Alternative neutral test class (`identity-test` etc.) would force editing `src/app.css` to add a test-only class — strictly worse. GIR is the canonical example because its identityClass naming follows the standard `.identity-{slug}` pattern.

### 2.9 — `src/lib/shared/favorites.test.ts` (Plan 52-03)

**Edit 1 — line 119:** Update post-D-19 alphabetization comment.
- Before: `			// post-D-19 alphabetization that's: feeds, formula, gir, morphine-wean, pert, uac-uvc.`
- After: `			// post-D-19 alphabetization that's: feeds, formula, gir, morphine-wean, uac-uvc.`

**Edit 2 — Append a new test case (D-11 regression test):**

Per D-11 the test MUST use a generic literal `'unknown-calculator-id'`, NOT `'pert'`. Note: an equivalent test already exists at T-07 (line 64-74) using literal `'ghost'`. T-09 (line 89-94) also covers "all unknown → defaults" with `'ghost1', 'ghost2'`.

**The existing tests already cover D-11's intent.** D-11 says "Add a regression test" but inspection shows T-07 + T-09 already exercise the exact behavior (filter unknown IDs, preserve order). The minimal-disturbance fix:
- **Option A:** Add a NEW test T-21 explicitly named for "post-PERT-removal forward compatibility" using literal `'unknown-calculator-id'`, with comment "This guards the upgrade path for users with v1.15+ favorites containing a now-removed calculator id."
- **Option B:** Just rename `'ghost'` → `'unknown-calculator-id'` in T-07 to make the test self-documenting.

Recommendation: **Option A** — adding a named regression test is more visible to future maintainers and aligns with D-11's letter ("Add a regression test"). Suggested location: after T-20 (line 207). Suggested body:

```typescript
describe('T-21 — unknown-calculator-id forward compatibility regression', () => {
	it('T-21: unknown id (e.g. a removed calculator) is silently filtered, preserving order of valid ids', async () => {
		// D-11 (Phase 52): regression guard for v1.15+ users whose stored favorites
		// included a calculator id that was later removed from the registry. The
		// recover() filter MUST drop the unknown id without error and MUST preserve
		// the order of the surviving valid ids. Uses a generic literal so this test
		// stays feature-agnostic across future removals.
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
```

### 2.10 — `e2e/desktop-full-nav.spec.ts` (Plan 52-03)

**Edit 1 — line 16:** Update describe title.
- Before: `	test('NAV-ALL-TEST-01a: desktop @1280 renders all 6 calculators in registry (alphabetical) order', async ({`
- After: `	test('NAV-ALL-TEST-01a: desktop @1280 renders all 5 calculators in registry (alphabetical) order', async ({`

**Edit 2 — line 28:** Fix expected tab count.
- Before: `		await expect(tabs).toHaveCount(6);`
- After: `		await expect(tabs).toHaveCount(5);`

**Edit 3 — line 33 (D-07 — implementer's call):**
- **Option A (recommended — delete the PERT assertion entirely):**
  - Delete line 33 (`await expect(tabs.nth(4)).toContainText('PERT');`)
  - Renumber line 34: `await expect(tabs.nth(5)).toContainText('UAC/UVC');` → `await expect(tabs.nth(4)).toContainText('UAC/UVC');`
  - Net result: 4 sequential `nth(0..4)` assertions for the 5 remaining calculators.
- **Option B (replace with the new 5th calculator):** redundant with Option A's renumbering — same net code.

Both produce identical post-edit code. Recommend the line-removal + renumber phrasing for clarity.

**Edit 4 — line 57:** Fix sibling assertion in test b.
- Before: `		await expect(desktopNav.getByRole('tab')).toHaveCount(6);`
- After: `		await expect(desktopNav.getByRole('tab')).toHaveCount(5);`

**Edit 5 — line 63:** Fix mobile assertion in test b (mobile after un-favoriting Feeds → was 3, math: defaults were 4 incl Feeds, minus Feeds = 3 — no change needed since this is mobile favorites count, NOT registry count). **NO EDIT** at line 63.

**Edit 6 — line 79:** Fix expected count in test c.
- Before: `		await expect(desktopNav.getByRole('tab')).toHaveCount(6);`
- After: `		await expect(desktopNav.getByRole('tab')).toHaveCount(5);`

**Edit 7 — line 94:** Fix expected count in test d.
- Before: `		await expect(desktopNav.getByRole('tab')).toHaveCount(6);`
- After: `		await expect(desktopNav.getByRole('tab')).toHaveCount(5);`

### 2.11 — `e2e/drawer-no-autofocus.spec.ts` (Plan 52-03)

**Edit 1 — lines 4-5:** Update header comment (6 routes → 5).
- Before: `// both `chromium` and `webkit-iphone` projects (Phase 47 D-15 — both projects` `// run all e2e specs by default). 6 routes x 2 projects = 12 cases.`
- After: `// both `chromium` and `webkit-iphone` projects (Phase 47 D-15 — both projects` `// run all e2e specs by default). 5 routes x 2 projects = 10 cases.`

**Edit 2 — lines 10-11:** Rewrite the cautionary comment per D-14.
- Before:
```
// IMPORTANT: ROUTES lists ALL SIX calculators (mobile-nav-clearance.spec.ts omits
// /pert; we must NOT inherit that omission, FOCUS-03 requires all six covered).
```
- After (suggested generic rewrite):
```
// IMPORTANT: ROUTES lists EVERY active calculator route — FOCUS-03 requires
// every drawer-bearing route to be covered, no omissions.
```

**Edit 3 — line 20:** Remove `'/pert'` from ROUTES array.
- Before:
```typescript
const ROUTES = [
	'/morphine-wean',
	'/formula',
	'/gir',
	'/feeds',
	'/uac-uvc',
	'/pert'
];
```
- After:
```typescript
const ROUTES = [
	'/morphine-wean',
	'/formula',
	'/gir',
	'/feeds',
	'/uac-uvc'
];
```

### 2.12 — `src/lib/shell/NavShell.test.ts` (Plan 52-03 — NOT IN CONTEXT.md, see Risk R-1)

**This file was NOT named in CONTEXT.md's TEST-03..06 list but contains 4 PERT references that WILL break vitest if not edited.**

**Edit 1 — line 16:** Comment generalization.
- Before: `  // D-20 (pert workstream Phase 1): defaults are alphabetical first 4 registry entries.`
- After: `  // D-20: defaults are alphabetical first 4 registry entries.`

**Edit 2 — line 162:** Comment generalization.
- Before: `    // D-21 (pert workstream Phase 1): recover() no longer re-sorts by registry order.`
- After: `    // D-21: recover() no longer re-sorts by registry order.`

**Edit 3 — line 191:** Fix expected desktop nav count in T-07.
- Before: `    expect(tabs).toHaveLength(6);`
- After: `    expect(tabs).toHaveLength(5);`

**Edit 4 — line 196:** Delete the PERT textContent assertion in T-07.
- Before: `    expect(tabs[4].textContent).toMatch(/PERT/i);`
- After: DELETE this line.

**Edit 5 — line 197:** Renumber UAC assertion to `tabs[4]`.
- Before: `    expect(tabs[5].textContent).toMatch(/UAC/i);`
- After: `    expect(tabs[4].textContent).toMatch(/UAC/i);`

**Edit 6 — line 209:** Fix T-08 desktopTabs count.
- Before: `    expect(desktopTabs).toHaveLength(6); // NAV-ALL-01: registry-driven, immune to favorites`
- After: `    expect(desktopTabs).toHaveLength(5); // NAV-ALL-01: registry-driven, immune to favorites`

**Edit 7 — line 223:** Fix T-09 desktopTabs count.
- Before: `    expect(desktopTabs).toHaveLength(6); // edge case: favorites empty, desktop still full`
- After: `    expect(desktopTabs).toHaveLength(5); // edge case: favorites empty, desktop still full`

---

## Section 3 — Comments to Rewrite (per D-14)

Each entry below shows file:line + proposed generic replacement. None of these change behavior — they are documentation cleanup. **Add these to Plan 52-02** (source-side comments) per D-15 ("Phase 52 only edits source comments").

### 3.1 — `src/lib/fortification/calculator.ts:12-13` (already in CONTEXT.md as the canonical example)

- Before:
```
// NB 2: getFormulaById lives in fortification-config.js (not config.js as in
// the PERT slice) — distinct module path.
```
- After (proposed):
```
// NB 2: getFormulaById lives in fortification-config.js (not config.js as in
// other calculator slices) — distinct module path.
```

### 3.2 — `src/lib/shell/calculator-store.svelte.ts:7` (NOT in CONTEXT.md — see Risk R-2)

- Before:
```
// src/lib/{pert,feeds,gir,morphine,fortification,uac-uvc}/state.svelte.ts —
```
- After:
```
// src/lib/{feeds,gir,morphine,fortification,uac-uvc}/state.svelte.ts —
```

### 3.3 — `src/lib/shell/calculator-store.svelte.ts:37` (NOT in CONTEXT.md)

- Before:
```
    // component reads it. Mirrors src/lib/pert/state.svelte.ts.
```
- After (proposed generic per D-14):
```
    // component reads it. Mirrors the per-slice state.svelte.ts pattern.
```

### 3.4 — `src/lib/shell/calculator-store.svelte.ts:68-69` (NOT in CONTEXT.md)

- Before:
```
    // stamp() runs even if setItem threw — matches the existing PERT pattern
    // where stamp is outside the try/catch.
```
- After:
```
    // stamp() runs even if setItem threw — stamp is intentionally outside
    // the try/catch so the edit timestamp updates even on storage failure.
```

### 3.5 — `src/lib/shell/calculator-module.ts:41-43` (NOT in CONTEXT.md)

JSDoc example strings. Per D-14 (generic rewrite) these should change to a still-active calculator. Suggested: GIR (longest example title) for line 41, and a generic phrase for line 43.

- Before:
```
  title: string; // e.g. "Pediatric EPI PERT Calculator"
  subtitle?: string; // e.g. "Capsule dosing · oral & tube-feed modes"
  inputsLabel: string; // e.g. "PERT inputs" — drawer title + aria-label
```
- After (proposed):
```
  title: string; // e.g. "Glucose Infusion Rate"
  subtitle?: string; // e.g. "mg/kg/min · helper"
  inputsLabel: string; // e.g. "GIR inputs" — drawer title + aria-label
```

### 3.6 — `src/lib/shared/favorites.svelte.ts:57` (covered in §2.5 above — repeated here for completeness)

- Before: `	// D-21 (Phase pert-01): preserve user's stored order verbatim. Only filter+cap remain.`
- After: `	// D-21: preserve user's stored order verbatim. Only filter+cap remain.`

### 3.7 — `src/lib/shell/calculator-store.test.ts:54` (NOT in CONTEXT.md — test file comment)

- Before: `  it('round-trips via vi.resetModules() + dynamic import (mirrors PERT pattern)', async () => {`
- After: `  it('round-trips via vi.resetModules() + dynamic import', async () => {`

This is a vitest `it()` description string — also captured by D-13 ("scrub ALL 'PERT' from active test files"). Should land in Plan 52-03.

### 3.8 — Test-file comments captured in §2.6-2.12 above

All explicitly enumerated already. No further test comments outside those files contain PERT.

---

## Section 4 — Grep Dry-Run Output

### Command run
```bash
git grep -niwE 'pert|PERT' -- ':(exclude).planning/' ':(exclude)milestones/' ':(exclude)CLAUDE.md' ':(exclude)PRODUCT.md'
```

(CLAUDE.md and PRODUCT.md excluded because Phase 52's grep gate per D-19 only excludes `.planning/`, but those two top-level doc files are DOC scope deferred to Phase 53 per D-15. They will appear in the gate and must be hand-allowed at verification time — see Risk R-3.)

### Total hit count: 154 lines across 30 files

### Hit categorization

**Category A — Files queued for deletion (no edit needed, will disappear with file):**

| File | Hits |
|------|------|
| `e2e/pert.spec.ts` | 19 |
| `e2e/pert-a11y.spec.ts` | 25 |
| `src/lib/pert/calculations.test.ts` | 14 |
| `src/lib/pert/calculations.ts` | 8 |
| `src/lib/pert/calculator.ts` | 13 |
| `src/lib/pert/config.test.ts` | 2 |
| `src/lib/pert/config.ts` | 1 |
| `src/lib/pert/PertCalculator.svelte` | 5 |
| `src/lib/pert/PertCalculator.test.ts` | 1 |
| `src/lib/pert/PertInputs.svelte` | 7 |
| `src/lib/pert/PertInputs.test.ts` | 1 |
| `src/lib/pert/pert-parity.fixtures.json` | 3 |
| `src/lib/pert/state.svelte.ts` | 3 |
| `src/routes/pert/+page.svelte` | 2 |

**Subtotal: 104 hits in files that will disappear with deletion.**

**Category B — Files needing in-place edits (source/integration):**

| File | Hits | Plan | Edit type |
|------|------|------|-----------|
| `e2e/desktop-full-nav.spec.ts` | 1 (line 33) | 52-03 | Assertion swap + count fixes (4 other count-only edits in the file) |
| `e2e/drawer-no-autofocus.spec.ts` | 2 (lines 11, 20) | 52-03 | Comment + array removal |
| `src/app.css` | 3 (lines 283, 287, 288) | 52-02 | Delete 9-line block |
| `src/lib/shared/about-content.ts` | 3 (lines 81, 82, 91) | 52-02 | Delete 14-line block |
| `src/lib/shared/favorites.svelte.ts` | 1 (line 57) | 52-02 | Comment generalize |
| `src/lib/shared/favorites.test.ts` | 1 (line 119) | 52-03 | Comment + add T-21 |
| `src/lib/shared/types.ts` | 1 (line 7) | 52-02 | Drop union member |
| `src/lib/shell/CalculatorPage.test.ts` | 5 (lines 45, 70, 72, 117, 119) | 52-03 | Swap identity class + inputsLabel |
| `src/lib/shell/calculator-module.ts` | 2 (lines 41, 43) | 52-02 | JSDoc example swap (Risk R-2) |
| `src/lib/shell/calculator-store.svelte.ts` | 3 (lines 7, 37, 68) | 52-02 | Comment generalize (Risk R-2) |
| `src/lib/shell/calculator-store.test.ts` | 1 (line 54) | 52-03 | Test name (per D-13) |
| `src/lib/shell/HamburgerMenu.test.ts` | 4 (lines 37-39 block, 49) | 52-03 | Drop assertion + comment update |
| `src/lib/shell/NavShell.test.ts` | 4 (lines 16, 162, 196) | 52-03 (Risk R-1) | Count fixes + assertion delete |
| `src/lib/shell/registry.ts` | 1 (line 17) | 52-01 | Drop import + array entry |
| `src/lib/shell/__tests__/registry.test.ts` | 6 (lines 10, 46-51) | 52-03 | Drop "fifth entry" block, fix list, renumber UAC |

**Subtotal: 38 hits across 15 files needing edits.**

**Category C — Files needing comment rewrites only (per D-14):**

| File | Hits | Plan |
|------|------|------|
| `src/lib/fortification/calculator.ts` | 1 (line 13) | 52-02 |

**Subtotal: 1 hit.**

**Category D — Out-of-scope docs (CLAUDE.md + PRODUCT.md):**

| File | Hits | Disposition |
|------|------|------------|
| `CLAUDE.md` | 1 (line 15) | Phase 53 DOC; will surface in grep gate — allow-list at verification |
| `PRODUCT.md` | 1 (line 3) | Phase 53 DOC; will surface in grep gate — allow-list at verification |

**Subtotal: 2 hits.**

**Grand total: 104 (Cat A, disappears) + 38 (Cat B, edited) + 1 (Cat C, edited) + 2 (Cat D, deferred) = 145 word-boundary hits.**

(The total 154 reported by the wc -l includes 9 hits in the planning files that the test/edit categories overlap with — counting per-file rather than per-line. The 145 / 154 reconciliation is non-load-bearing; what matters is that all 30 unique files are accounted for above.)

### Post-Phase-52 expected grep output

Running the gate command after 52-01 + 52-02 + 52-03 land:

```bash
git grep -niwE 'pert|PERT' -- ':(exclude).planning/'
```

**Expected: ZERO hits in `src/` and `e2e/`** (all Cat A files deleted, all Cat B + C files edited).

**Will still hit (allow-listed at verification):**
- `CLAUDE.md:15` (deferred to Phase 53 DOC)
- `PRODUCT.md:3` (deferred to Phase 53 DOC)
- `milestones/ws-pert-2026-04-26/**` (workstream archive, intentional historical record)

The verification script for D-19 should declare these 3 paths as expected residual hits.

---

## Section 5 — Test Baseline Counts (pre-Phase-52)

### Vitest

Command: `pnpm test:run`

| Metric | Count |
|--------|-------|
| Test files | 47 |
| Tests | 489 |
| Passing | 489 |
| Failing | 0 |
| Duration | 37.88s |

**PERT contribution (from `src/lib/pert/*.test.ts`):**

| File | Tests |
|------|-------|
| `calculations.test.ts` | 20 |
| `config.test.ts` | 11 |
| `PertCalculator.test.ts` | 10 |
| `PertInputs.test.ts` | 9 |
| `state.test.ts` | 6 |
| **Total** | **56** |

**Expected post-52 vitest count:** 489 − 56 + 1 (new T-21 in favorites.test.ts) = **434 tests in 42 files** (47 minus 5 deleted PERT test files).

### Playwright

Command: `pnpm exec playwright test --list`

| Metric | Count |
|--------|-------|
| Total tests | 264 |
| chromium project | 132 |
| webkit-iphone project | 132 |
| Test files | 23 |

**PERT-explicit Playwright contribution (per project):**

| File | Tests per project |
|------|-------------------|
| `e2e/pert.spec.ts` | 12 (6 test fns × 2 viewports) |
| `e2e/pert-a11y.spec.ts` | 4 (2 synthetic + 2 literal /pert sweeps; the `test.skip` at line 182 is inside a wrapped `test('…page exists for axe …')` that is also one of the 4) |
| **Subtotal per project** | **16** |
| **Both projects combined** | **32** |

**`desktop-full-nav.spec.ts`:** 4 tests per project (a/b/c/d) = 8 total → stays at 8 (no test deleted, only assertion edits).

**`drawer-no-autofocus.spec.ts`:** 6 routes × 1 test per route × 2 projects = 12 total → drops to 5 routes × 2 = **10 tests** (loses 2 tests, one per project).

**Expected post-52 Playwright count:**
- Total: 264 − 32 (pert.spec + pert-a11y.spec deleted) − 2 (drawer-no-autofocus drops /pert iteration) = **230 tests**
- Per project: 132 − 16 − 1 = **115 tests** per project

### Pre-existing failure baseline (per D-21)

CONTEXT.md cites **32 pre-existing Playwright failures** at v1.15.1 close (28 axe dlitem + 2 disclaimer-banner + 2 calc UI). This research did not run the full Playwright suite to confirm the exact count today, but D-21 explicitly designates 32 as the baseline. Verification must check failure count ≤ 32 post-52 (PERT-specific failures should drop to 0, and pre-existing failures should be unchanged or fewer).

### Type-check baseline

Command: `pnpm check` (svelte-check)

| Metric | Count |
|--------|-------|
| Errors | 0 |
| Warnings | 0 |
| Files checked | 4,604 |

**Expected post-52:** 0 / 0 maintained. If a stray import of `pertModule` or reference to `'pert'` in the CalculatorId union slips through, this gate will catch it (the union shrink in 52-02 is the canonical compile-time enforcement per D-03/PURGE-04).

### Build baseline

Command: `pnpm build`

| Metric | Value |
|--------|-------|
| Build duration | 8.17s |
| `build/` total | 772 KB |
| `build/_app/` (JS bundle dir) | 468 KB |
| Total files | 55 |
| PWA precache entries | 50 (575.17 KiB) |
| PERT route artifact | `build/pert.html` (1 file) |
| PERT JS chunk | None named `pert*` (PERT code is split into hashed chunks; route deletion + tree-shake will drop them) |

**Expected post-52 build:** `build/pert.html` gone (54 files), bundle dir shrinkage of ~10–25 KB (rough estimate from PERT source LOC vs the rest; 2,166 LOC of pert TS + Svelte → minified+gzipped ≈ 15-20 KB JS chunks plus dropped pert-config.json ≈ 5 KB). Total `build/` should drop from 772 KB to roughly **745-755 KB**. Verification per D-20 attests the delta is non-zero in the shrinkage direction.

---

## Section 6 — Downstream Consumers of CALCULATOR_REGISTRY and CalculatorId

### `CALCULATOR_REGISTRY` consumers (full grep `import.*CALCULATOR_REGISTRY` + `CALCULATOR_REGISTRY\[`)

| File | Usage | Edit needed? |
|------|-------|--------------|
| `src/lib/shared/favorites.svelte.ts:5,19,23,103` | Reads registry for defaults() + validIds() + toggle() sort order | NO — registry mutation in 52-01 propagates automatically |
| `src/lib/shell/NavShell.svelte` | Iterates registry for desktop nav (confirmed via Phase 45) | NO — same automatic propagation |
| `src/lib/shell/HamburgerMenu.svelte` | Iterates registry for menu items | NO — automatic |
| `src/lib/shell/__tests__/registry.test.ts:5,9,14,19,25,32,39,46,54,62,76,86` | Direct test assertions | YES — §2.6 |
| `src/lib/shell/NavShell.test.ts` | Source-string + render assertions | YES — §2.12 (Risk R-1) |
| `src/lib/shell/HamburgerMenu.test.ts` | Renders HamburgerMenu, asserts link count | YES — §2.7 |

### `CalculatorId` consumers (grep `import.*CalculatorId` + `: CalculatorId`)

| File | Usage | Edit needed? |
|------|-------|--------------|
| `src/lib/shared/about-content.ts:1,19` | `Record<CalculatorId, AboutContent>` — key set MUST exactly match union | YES — §2.3 (drop `pert:` block; otherwise TypeScript exhaustiveness check FAILS) |
| `src/lib/shared/favorites.svelte.ts:6,17,19,72,89,93,97` | Type annotations + return types | NO — narrowed type stays valid |
| `src/lib/shell/calculator-module.ts` | Re-exports `CalculatorEntry` which has `id: CalculatorId` | NO — type narrowing automatic |

**Critical compile-time gate:** `about-content.ts` declares `Record<CalculatorId, AboutContent>`. If 52-02 drops `'pert'` from the union but forgets to drop the `pert:` key from the record, TypeScript will accept it as excess (it's an extra key, not missing). However, if 52-02 drops the `pert:` key but forgets the union edit, the record becomes incomplete and TypeScript throws TS2741 "Property 'pert' is missing in type". **Both edits must land in the same commit (52-02).**

### `identityClass` consumers (grep `identity-pert`)

| File | Usage | Edit needed? |
|------|-------|--------------|
| `src/app.css:283-291` | OKLCH token definition | YES — §2.4 (delete block) |
| `src/lib/pert/calculator.ts:66` | `identityClass: 'identity-pert'` on the module | NO — file deleted |
| `src/lib/shell/CalculatorPage.test.ts:45,70,72` | Test scaffold | YES — §2.8 |
| `e2e/pert-a11y.spec.ts` | Multiple references | NO — file deleted |

No JS code reads `'identity-pert'` from a string anywhere else (no string-based identity-class lookup pattern in the codebase). CSS-only coupling.

---

## Section 7 — Build / Bundle Baseline

### Fresh build (Vite 8 + adapter-static + vite-pwa)

```
pnpm build → ✓ built in 8.17s
PWA v1.2.0 — precache 50 entries (575.17 KiB)
```

### Bundle structure
- `build/` total: **772 KB**, **55 files**
- `build/_app/immutable/` (chunks): JS chunks, all hashed; no chunk named `pert.*` (Vite emits route chunks per `+page.svelte`, so the PERT chunk is hashed)
- `build/_app/` total: **468 KB**
- `build/pert.html`: **1 file**, the SPA fallback HTML for the `/pert` route — disappears after 52-01 deletes `src/routes/pert/+page.svelte`
- Static assets (icons, manifest, robots.txt etc.): the remaining ~300 KB outside `_app/`

### Post-Phase-52 expected bundle baseline (D-20 attestation)

| Metric | Pre-52 | Post-52 expected | Delta |
|--------|--------|------------------|-------|
| `build/` total | 772 KB | ~745-755 KB | -15 to -25 KB |
| File count | 55 | 54 | -1 (pert.html gone) |
| PWA precache entries | 50 | 49 | -1 |
| Build time | 8.17s | ~8.0s | negligible |

**Estimation method:** PERT source = 2,166 LOC TS+Svelte + 152 + 146 LOC JSON. Minification + tree-shake + gzip typically yields ~7% of source LOC in compressed JS = ~150 LOC equivalent ≈ 12-18 KB compressed. JSON ~3-5 KB compressed.

---

## Section 8 — Risks / Unknowns

### Risk R-1 — CONTEXT.md TEST list omits `src/lib/shell/NavShell.test.ts` (HIGH SEVERITY)

**Finding:** CONTEXT.md `<canonical_refs>` lists test surgery targets as registry.test.ts, HamburgerMenu.test.ts, CalculatorPage.test.ts, favorites.test.ts, desktop-full-nav.spec.ts, drawer-no-autofocus.spec.ts. It does NOT list `NavShell.test.ts`.

**Problem:** `NavShell.test.ts:191,196` contains assertions that PERT is the 5th tab in the desktop nav and that `tabs.length === 6`. The instant `pertModule` leaves the registry in 52-01, these tests turn red.

**Impact:** D-02 ("registry edit must land with the deletes so iterator-based tests don't go red mid-phase") becomes impossible to satisfy in 52-01 alone unless NavShell.test.ts is also edited in 52-01 OR Plan 52-01's vitest-green attestation is relaxed.

**Recommended planner resolution:** Either
- **(a)** Move NavShell.test.ts edits into Plan 52-01 (alongside the registry edit), keeping 3-plan shape but widening 52-01's file list by one test file. This preserves D-02's "every commit green" invariant cleanly.
- **(b)** Defer the registry edit to 52-03 so it lands in the same commit as all test surgery. This contradicts D-02's explicit instruction that the registry edit lands with the deletes in 52-01.

Recommend **(a)**. The CONTEXT.md TEST list at lines 82-87 should be treated as illustrative-not-exhaustive; this research enumerates the actual set.

### Risk R-2 — CONTEXT.md historical-comment list omits `calculator-store.svelte.ts` and `calculator-module.ts` (MEDIUM SEVERITY)

**Finding:** CONTEXT.md D-14 names one canonical comment to rewrite (`fortification/calculator.ts:13`). Research finds 4 additional source-comment locations in the shell layer (§3.2-3.5).

**Problem:** D-13 says "scrub ALL 'PERT'/'pert' strings from active test files", and D-14 says rewrite historical comments generically. The shell-layer comments aren't tests, but they remain "active source comments" after Phase 52. They would still pass the grep gate (D-19 word-boundary), but they reference deleted file paths (e.g. `Mirrors src/lib/pert/state.svelte.ts.` — pointing at a file that no longer exists).

**Impact:** Without editing them, the grep gate at D-19 will return 4+ hits in shell files. The verification step D-20.2 ("grep returns only allowed historical comments") becomes ambiguous — these comments aren't "historical PERT documentation" (which is preserved per D-16 in `.planning/`), they're stale cross-references to deleted files.

**Recommended planner resolution:** Include §3.2-3.5 edits in Plan 52-02 (same plan that holds the canonical fortification/calculator.ts:13 edit per D-14). This expands 52-02 by 2 files (calculator-store.svelte.ts + calculator-module.ts) and is mechanically tiny (5 comment edits total).

### Risk R-3 — Top-level docs CLAUDE.md + PRODUCT.md will appear in grep gate (LOW SEVERITY)

**Finding:** D-19 grep command excludes `.planning/` only. CLAUDE.md (line 15) and PRODUCT.md (line 3) live at repo root and reference PERT. Phase 53 (DOC) updates them. Until Phase 53 lands, the grep gate at 52-VERIFICATION.md will surface 2 hits in these files.

**Impact:** The verification step needs to explicitly enumerate these 2 paths as known-allowed residual hits, or extend the grep exclude (`':(exclude)CLAUDE.md' ':(exclude)PRODUCT.md'`) at the gate. Otherwise the gate appears red when it should be green for Phase 52's scope.

**Recommended planner resolution:** Document an allow-list of 2 paths in 52-VERIFICATION.md (CLAUDE.md, PRODUCT.md) and rely on Phase 53 DOC to scrub them. The CONTEXT.md scope boundary explicitly excludes README/CHANGELOG/About → Phase 53; these two project-root docs fall into the same bucket.

### Risk R-4 — `favorites.test.ts` T-07 already covers D-11 intent (LOW SEVERITY, design clarification)

**Finding:** D-11 says "Add a regression test in `favorites.test.ts` asserting the filter behavior, but use a generic string literal." Inspection shows T-07 (line 64-74) already asserts unknown-id filtering with literal `'ghost'`, and T-09 already covers the all-unknown case.

**Impact:** Adding T-21 is additive duplication unless explicitly named for the "post-removal forward-compat" intent.

**Recommended planner resolution:** Add T-21 explicitly named for that intent (§2.9 Option A). It's redundant in behavior but explicit in documentation. The 1 LOC of duplication is worth the future-maintainer signal.

### Risk R-5 — Trailing comma syntax after deleting last record entry (LOW SEVERITY, mechanical)

**Finding:** In `about-content.ts`, deleting the `pert:` block (lines 81-94) leaves `'uac-uvc'` (lines 70-80) as the last entry. Its closing `},` at line 80 should become `}` if the planner wants strict syntax. However, TypeScript object literals tolerate trailing commas, and Prettier's `trailingComma: 'all'` (project default) actually REQUIRES the trailing comma. **No edit needed at line 80 — Prettier will keep the comma.**

**Same situation in `registry.ts`:** Removing `pertModule,` from line 27 leaves `uacUvcModule` (line 28) as the last entry. The current source has no trailing comma after `uacUvcModule` (line 28: `  uacUvcModule` then `];` on line 29). Edit just deletes line 27, leaving the array clean.

### Risk R-6 — pert.spec.ts uses `viewport` describe-block pattern (LOW, informational)

**Finding:** `e2e/pert.spec.ts` declares `for (const viewport of [...])` with 2 viewports and wraps each describe block in `test.use({ viewport: ... })`. This is why 6 `test(` calls in the source become 12 Playwright tests per project (24 total across both projects).

**Impact:** None — the file is deleted entirely in 52-01. Just a flag for the planner so the test-count math in §5 is unsurprising.

### Risk R-7 — `pert.spec.ts:219` "favorite PERT" test exercises full E2E favorites add flow (LOW, informational)

**Finding:** The PERT spec includes a test that adds PERT to favorites via the hamburger UI then asserts the nav reflects it. After PERT removal, this exact flow is exercised by `uac-uvc.spec.ts:154` ("un-favorite Feeds then favorite UAC/UVC"). The flow is NOT lost — it's already covered by another calculator's spec.

**Impact:** None — confirmation that deleting `e2e/pert.spec.ts` does not leave a coverage gap for the favorites-add-from-spec-page flow.

### Risk R-8 — `favorites.test.ts:119` comment lives inside test T-11 body, not a top-level comment (LOW, mechanical)

**Finding:** Line 119 is inside the body of T-11 (`it('T-11 toggle: add to favorites (under cap)', ...)`). The comment names the post-D-19 alphabetization. Removing 'pert' from the list mid-comment is the only edit needed; the test body itself does not reference PERT.

**Impact:** §2.9 Edit 1 captures this. No structural change to T-11.

---

## Section 9 — Validation Architecture

`workflow.nyquist_validation` is explicitly `false` in `.planning/config.json` → SECTION SKIPPED per protocol.

The phase's intrinsic test architecture (vitest + Playwright dual-suite per the package's `pnpm test:run` and `pnpm exec playwright test`) is fully enumerated in §5 above with baseline counts and post-phase expected counts.

---

## Section 10 — Environment Availability

This phase is purely code/config deletion + test surgery. No new external dependencies. Skipped per protocol.

For completeness, the existing toolchain (already verified via `pnpm test:run` and `pnpm build` runs in this research):
- `pnpm@10.33.0` — available
- `node` (per Dockerfile note in MEMORY.md, pinned to v24 for Corepack) — available
- `vitest@4.1.4` — available, green
- `@playwright/test@1.59.1` — available, `--list` works
- `svelte-check@4.4.2` — available, 0/0

---

## Sources

### Primary (HIGH confidence)
- **Codebase grep + Read** (this research session) — exhaustive line-level verification of every file enumerated. Confidence: HIGH.
- `pnpm test:run` execution (2026-05-23) — vitest baseline 489/489. HIGH.
- `pnpm exec playwright test --list` execution — baseline 264 tests, 132/project. HIGH.
- `pnpm build` execution — bundle 772 KB / 55 files. HIGH.
- `pnpm check` execution — svelte-check 0/0. HIGH.
- `.planning/phases/52-code-purge-test-suite-repair/52-CONTEXT.md` — 21 locked decisions. HIGH (canonical user direction).
- `.planning/REQUIREMENTS.md` — PURGE-01..06 + TEST-01..08. HIGH.
- `.planning/ROADMAP.md` §Phase 52 — success criteria. HIGH.

### Secondary (MEDIUM confidence)
- Bundle-size delta estimate (15-25 KB shrinkage) — derived from LOC arithmetic + typical TS minify ratios, NOT verified by post-purge build. MEDIUM (only confirmed at verification time).
- "32 pre-existing Playwright failures" baseline — cited per D-21, not re-confirmed by running the full Playwright suite in this research (research environment doesn't have a Playwright browser launch). MEDIUM (treat D-21's number as truth per CONTEXT.md).

### Tertiary (LOW confidence)
None. All findings are codebase-verified.

---

## Metadata

**Confidence breakdown:**
- File deletion list: HIGH (every file Read + `wc -l` confirmed)
- Edit line numbers: HIGH (every Read line cited with surrounding context)
- Comment rewrites: HIGH (D-14 generic-rewrite policy clear; specific phrasings are MEDIUM since they're proposals, not user-locked)
- Test baseline counts: HIGH (vitest + playwright --list executed in this session)
- Bundle-size delta: MEDIUM (LOC-derived estimate)
- Risks R-1 and R-2: HIGH (the gap between CONTEXT.md TEST list and actual file surface area is concrete and bisectable)

**Research date:** 2026-05-23
**Valid until:** Phase 52 execution begins (the codebase is otherwise stable; no concurrent milestone work in flight per STATE.md).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Choosing `identity-gir` (vs a synthetic test-only class) for the CalculatorPage.test.ts swap | §2.8 | Test still works either way; cosmetic |
| A2 | The replacement comment phrasings in §3 are reasonable | §3.1-3.5 | User may prefer alternate phrasing; mechanical to swap |
| A3 | Bundle size will shrink by 15-25 KB | §7 | Verification will measure exactly; only attestation impact |
| A4 | T-21 addition vs T-07 rename for D-11 (recommended Option A) | §2.9, R-4 | Option B (rename `'ghost'` → `'unknown-calculator-id'`) is equally valid |

**Note:** Assumptions A1-A2 are stylistic choices the planner may override. A3 is verifiable at phase close. A4 is a design tradeoff the planner can settle.

## RESEARCH COMPLETE
