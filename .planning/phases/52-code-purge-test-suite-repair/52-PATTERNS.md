# Phase 52: Code Purge + Test Suite Repair — Pattern Map

**Mapped:** 2026-05-23
**Files affected:** 0 created · 22 edited · 17 deleted
**Analogs found:** 22 / 22 (every edit has a proven in-repo precedent or is a single-token narrowing whose pattern is the file itself)

> **Phase shape:** This is a deletion + edit phase, not a creation phase. Patterns here describe **(a)** which existing files prove a deletion is safe (orphaned-import gate), **(b)** which edit shape (registry narrowing, type-union narrowing, CSS block deletion, test assertion drop, comment generalization) the implementer should apply, and **(c)** the **inverse** of which "add a calculator" pattern is being reversed.
>
> **PERT is the first calculator removal in repo history** — `git log --oneline | grep -iE 'remove.*calculator|drop.*calculator'` returns zero hits. There is no prior "remove a calculator" PR to mirror. Instead, the **inverse of the v1.16 `CalculatorStore<T>` migration + the Phase 42 UAC/UVC addition** is the canonical pattern: every step that added PERT to the registry/types/about/CSS/tests is reversed here, in alphabetical-by-registry order.

---

## File Classification

### Files to DELETE (17 files, Plan 52-01)

| File | Role | Data Flow | Pattern Source | Match |
|------|------|-----------|----------------|-------|
| `src/lib/pert/PertCalculator.svelte` | calculator-component | request-response (form → derived state → result) | sibling slices (`src/lib/feeds/FeedAdvanceCalculator.svelte`, `src/lib/gir/GirCalculator.svelte`) prove the slice is self-contained | exact |
| `src/lib/pert/PertCalculator.test.ts` | vitest co-located component test | — | co-located test convention (every sibling has same pattern) | exact |
| `src/lib/pert/PertInputs.svelte` | inputs-component | form (drawer) | sibling: `src/lib/feeds/FeedAdvanceInputs.svelte` | exact |
| `src/lib/pert/PertInputs.test.ts` | vitest co-located component test | — | co-located test convention | exact |
| `src/lib/pert/calculations.ts` | pure-function math layer | transform | sibling: `src/lib/feeds/calculations.ts`, `src/lib/gir/calculations.ts` | exact |
| `src/lib/pert/calculations.test.ts` | vitest pure-function test (spreadsheet parity) | — | sibling: `src/lib/feeds/calculations.test.ts` | exact |
| `src/lib/pert/calculator.ts` | CalculatorModule definition | registry-entry | sibling: `src/lib/feeds/calculator.ts` (see "Inverse Pattern" §) | exact |
| `src/lib/pert/config.ts` | config loader | file-I/O (JSON import) | sibling: `src/lib/feeds/feeds-config.ts` | exact |
| `src/lib/pert/config.test.ts` | vitest config-loader test | — | sibling: `src/lib/feeds/feeds-config.test.ts` | exact |
| `src/lib/pert/state.svelte.ts` | CalculatorStore<T> singleton | event-driven ($state) | sibling: `src/lib/feeds/state.svelte.ts`, `src/lib/uac-uvc/state.svelte.ts` (most recently migrated in commit `66cf633`) | exact |
| `src/lib/pert/state.test.ts` | vitest state-singleton test | — | sibling: `src/lib/shell/calculator-store.test.ts` (generic pattern) | exact |
| `src/lib/pert/types.ts` | TypeScript types | — | sibling: `src/lib/feeds/types.ts` | exact |
| `src/lib/pert/pert-config.json` | clinical data (meds + formulas + advisory) | data-asset | sibling: `src/lib/feeds/feeds-config.json` | exact |
| `src/lib/pert/pert-parity.fixtures.json` | spreadsheet-parity fixtures | data-asset | sibling: `src/lib/feeds/feeds-parity.fixtures.json` | exact |
| `src/routes/pert/+page.svelte` | SvelteKit route shell | request-response | sibling: `src/routes/feeds/+page.svelte` (also 6-line shell) | exact |
| `e2e/pert.spec.ts` | Playwright E2E spec | request-response | sibling: `e2e/uac-uvc.spec.ts` (the same favorites-add-from-spec-page flow lives at line 154 — confirms R-7: no coverage gap) | exact |
| `e2e/pert-a11y.spec.ts` | Playwright axe a11y sweep | request-response | sibling: `e2e/uac-uvc-a11y.spec.ts` | exact |

### Files to EDIT — source/integration (Plan 52-02, 7 files)

| File | Role | Edit Type | Analog | Match |
|------|------|-----------|--------|-------|
| `src/lib/shell/registry.ts` *(actually 52-01 per D-02)* | registry | drop import + drop array entry | "alphabetical-by-id" comment at line 20 IS the invariant being preserved | exact |
| `src/lib/shared/types.ts` | type union | narrow `CalculatorId` union (drop `'pert'`) | self-pattern — union has 5 remaining members in the literal | exact |
| `src/lib/shared/about-content.ts` | content map | drop `pert:` key from `Record<CalculatorId, AboutContent>` | self-pattern — 5 remaining entries are the shape | exact |
| `src/app.css` | CSS tokens | delete `.identity-pert` light + dark blocks (9 lines) | self-pattern — `.identity-feeds`, `.identity-gir`, `.identity-morphine`, `.identity-formula`, `.identity-uac` blocks above/below show the survivor shape | exact |
| `src/lib/shared/favorites.svelte.ts` | comment-only | generalize line 57 (`Phase pert-01` → drop phase-name tag) | comment-generalization pattern (see Shared §A below) | role-match |
| `src/lib/shell/calculator-store.svelte.ts` | comment-only (3 sites) | generalize lines 7, 37, 68 — drop `pert/` from file-path list + JSDoc reference | comment-generalization pattern (Shared §A) | role-match |
| `src/lib/shell/calculator-module.ts` | JSDoc example | swap PERT example strings → GIR (lines 41, 43) | self-pattern — pick an active calculator from the surviving 5 | exact |
| `src/lib/fortification/calculator.ts` | comment-only | generalize line 13 (`PERT slice` → `other calculator slices`) | comment-generalization pattern (Shared §A) | role-match |

### Files to EDIT — test surgery (Plan 52-03, 8 files)

| File | Role | Edit Type | Analog | Match |
|------|------|-----------|--------|-------|
| `src/lib/shell/__tests__/registry.test.ts` | vitest registry test | drop "fifth entry" block, narrow expected array, renumber UAC to `[4]` | self-pattern — see "Registry Test Renumber" §B below | exact |
| `src/lib/shell/HamburgerMenu.test.ts` | vitest component test | drop PERT link assertion (line 49), update count `6 → 5` (line 44), regenerate comment block (lines 37-39) | self-pattern — surviving link assertions at lines 45-48, 50 show the shape | exact |
| `src/lib/shell/NavShell.test.ts` ⚠️ *(per Risk R-1)* | vitest component test | drop PERT textContent assertion (line 196), renumber `tabs[5] → tabs[4]` (line 197), update counts `6 → 5` (lines 191, 209, 223), generalize comments (lines 16, 162) | self-pattern — surviving `textContent.toMatch(/.../)` assertions show the shape | exact |
| `src/lib/shell/CalculatorPage.test.ts` | vitest shell test | swap `identity-pert` → `identity-gir` scaffold (lines 45, 70, 72), swap `'PERT inputs'` → `'GIR inputs'` (lines 117, 119) | sibling-substitution pattern (Shared §C) | exact |
| `src/lib/shell/calculator-store.test.ts` | vitest unit test | strip `(mirrors PERT pattern)` from `it()` description (line 54) | comment-generalization pattern (Shared §A) | role-match |
| `src/lib/shared/favorites.test.ts` | vitest unit test | drop `'pert'` from line 119 comment; ADD new T-21 (regression test for unknown-id filter) | T-07 (lines 64-74) is the exact behavioural twin — copy its shape with renamed literal `'unknown-calculator-id'` | exact |
| `e2e/desktop-full-nav.spec.ts` | Playwright nav spec | update counts `6 → 5` (lines 28, 57, 79, 94), drop line 33 PERT assertion, renumber `tabs.nth(5) → tabs.nth(4)` (line 34) | self-pattern — surviving `tabs.nth(N).toContainText(...)` assertions show the shape | exact |
| `e2e/drawer-no-autofocus.spec.ts` | Playwright a11y spec | drop `'/pert'` from ROUTES array (line 20), update header comment (lines 4-5: `6 → 5`), generalize cautionary comment (lines 10-11) | self-pattern — surviving 5 routes ARE the shape | exact |

---

## Inverse Pattern: "Add a Calculator" → "Remove a Calculator"

**There is no prior calculator-removal PR.** The pattern to invert is the **v1.16 calculator-store refactor + Phase 42 UAC/UVC addition** — these established the per-calculator registry/types/about/CSS/test footprint that Phase 52 must reverse, slice by slice.

**Add-a-calculator footprint (proven by UAC/UVC addition, commits `e631fa8`, `950361d`, `2938e5b`, `11b9ca6`, `45d86cf`, `66cf633`):**

| Add-step | Add-PR location | Inverse (Phase 52 location) |
|----------|----------------|----------------------------|
| Create `src/lib/{slug}/` slice (14 files) | New dir | Delete `src/lib/pert/` (Plan 52-01) |
| Create `src/routes/{slug}/+page.svelte` | New route | Delete `src/routes/pert/` (Plan 52-01) |
| Add `import { {slug}Module } from '$lib/{slug}/calculator.js'` to `src/lib/shell/registry.ts` | Line near other imports | Drop `pertModule` import (Plan 52-01) |
| Add `{slug}Module,` to `CALCULATOR_REGISTRY` array (alphabetical) | New array entry | Drop `pertModule,` from array (Plan 52-01) |
| Add `'{slug}'` to `CalculatorId` union in `src/lib/shared/types.ts` | Type narrowing | Drop `'pert'` from union (Plan 52-02) |
| Add `{slug}:` block to `Record<CalculatorId, AboutContent>` in `src/lib/shared/about-content.ts` | New keyed entry | Drop `pert:` block (Plan 52-02) |
| Add `.identity-{slug}` light + dark blocks to `src/app.css` | New CSS rules | Delete `.identity-pert` blocks (Plan 52-02) |
| Create `e2e/{slug}.spec.ts` + `e2e/{slug}-a11y.spec.ts` | New E2E specs | Delete `e2e/pert.spec.ts` + `e2e/pert-a11y.spec.ts` (Plan 52-01) |
| Add `"includes {slug} as Nth entry"` block to `src/lib/shell/__tests__/registry.test.ts` | New it() block + array literal grew | Drop "fifth entry" block + narrow expected array (Plan 52-03) |
| Add `expect(screen.getByRole('link', { name: /{Label}/i }))` to `HamburgerMenu.test.ts` | New link assertion + bump count | Drop PERT link assertion + bump count down (Plan 52-03) |
| Add `expect(tabs[N].textContent).toMatch(/{Label}/i)` to `NavShell.test.ts` | New textContent assertion + bump count | Drop PERT textContent assertion + bump count down (Plan 52-03) |
| Add `'/{slug}'` to ROUTES array in `e2e/drawer-no-autofocus.spec.ts` | New route entry | Drop `'/pert'` from ROUTES (Plan 52-03) |
| Add `await expect(tabs.nth(N)).toContainText('{LABEL}')` to `e2e/desktop-full-nav.spec.ts` | New tab assertion + bump counts | Drop PERT tab assertion + bump counts down (Plan 52-03) |

**Why this matters for the planner:** every Phase 52 edit has a direct add-step counterpart visible in `git log -p --all -- src/lib/uac-uvc/ src/lib/shell/registry.ts src/lib/shared/types.ts src/app.css`. When in doubt about an edit, look at how UAC/UVC was added and reverse the diff hunk.

---

## Shared Editing Patterns (Cross-Cutting)

### §A — Comment Generalization (per D-14)

**Applies to:** `src/lib/fortification/calculator.ts:13`, `src/lib/shared/favorites.svelte.ts:57`, `src/lib/shell/calculator-store.svelte.ts:7,37,68`, `src/lib/shell/calculator-store.test.ts:54`, `src/lib/shell/HamburgerMenu.test.ts:37-39`, `src/lib/shell/NavShell.test.ts:16,162`, `e2e/drawer-no-autofocus.spec.ts:10-11`, `src/lib/shared/favorites.test.ts:119`

**Pattern:** strip the proper-noun "PERT" / "pert" and any phase-tag like "(Phase pert-01)" / "(pert workstream Phase 1)". Preserve the comment's *intent* (explaining a pattern, citing a decision ID, warning a maintainer). The decision-ID anchor (e.g., `D-19`, `D-21`) stays — it's the canonical reference. The feature name is what leaves.

**Concrete example — `src/lib/shared/favorites.svelte.ts:57`:**

Before:
```typescript
// D-21 (Phase pert-01): preserve user's stored order verbatim. Only filter+cap remain.
```

After:
```typescript
// D-21: preserve user's stored order verbatim. Only filter+cap remain.
```

**Concrete example — `src/lib/shell/HamburgerMenu.test.ts:37-39`:**

Before:
```typescript
// beforeEach already called favorites.init() with defaults. After D-19/D-20
// (pert workstream Phase 1), the registry is alphabetized to 6 entries:
// feeds, formula, gir, morphine-wean, pert, uac-uvc. The default favorites
// are the first 4 alphabetical entries; pert and uac-uvc remain non-favorited.
```

After:
```typescript
// beforeEach already called favorites.init() with defaults. The registry is
// alphabetized to 5 entries: feeds, formula, gir, morphine-wean, uac-uvc.
// The default favorites are the first 4 alphabetical entries; uac-uvc remains
// non-favorited.
```

**Concrete example — `src/lib/fortification/calculator.ts:12-13`:**

Before:
```typescript
// NB 2: getFormulaById lives in fortification-config.js (not config.js as in
// the PERT slice) — distinct module path.
```

After:
```typescript
// NB 2: getFormulaById lives in fortification-config.js (not config.js as in
// other calculator slices) — distinct module path.
```

---

### §B — Registry-Test Renumber Pattern

**Applies to:** `src/lib/shell/__tests__/registry.test.ts` (lines 10, 46-52, 54-59)

**Pattern:** the registry test has one `it()` block per ordinal entry. When the array shrinks by one (PERT removed), three structural edits are required:

1. **Drop one literal** from the `expected ids` array at line 10.
2. **Delete the entire `it()` block** for the removed entry (lines 46-52).
3. **Renumber the successor block** — UAC/UVC was the "sixth entry" at `CALCULATOR_REGISTRY[5]`; it is now the "fifth entry" at `CALCULATOR_REGISTRY[4]`. Both the `it()` description string AND every `CALCULATOR_REGISTRY[N]` index must shift down by one (lines 54-59).

**Concrete excerpt (current `src/lib/shell/__tests__/registry.test.ts:46-59`):**

```typescript
  it('includes PERT calculator as fifth entry', () => {              // ← DELETE entire block
    expect(CALCULATOR_REGISTRY[4].id).toBe('pert');
    expect(CALCULATOR_REGISTRY[4].label).toBe('PERT');
    expect(CALCULATOR_REGISTRY[4].href).toBe('/pert');
    expect(CALCULATOR_REGISTRY[4].description).toBe('Pediatric EPI PERT calculator');
    expect(CALCULATOR_REGISTRY[4].identityClass).toBe('identity-pert');
  });

  it('includes UAC/UVC calculator as sixth entry', () => {           // ← rename: "sixth" → "fifth"
    expect(CALCULATOR_REGISTRY[5].id).toBe('uac-uvc');               // ← renumber: [5] → [4]
    expect(CALCULATOR_REGISTRY[5].label).toBe('UAC/UVC');            // ← renumber: [5] → [4]
    expect(CALCULATOR_REGISTRY[5].href).toBe('/uac-uvc');            // ← renumber: [5] → [4]
    expect(CALCULATOR_REGISTRY[5].identityClass).toBe('identity-uac'); // ← renumber: [5] → [4]
  });
```

The shape of the surviving block (`'includes Feeds calculator as first entry'` at line 18-23) is the reference template — same 4-assertion shape, just a different ordinal.

---

### §C — Sibling-Substitution Pattern (Test Scaffolds)

**Applies to:** `src/lib/shell/CalculatorPage.test.ts:45,70,72,117,119`

**Pattern:** when a test scaffold uses a real calculator's identifier as test data (e.g., `identityClass: 'identity-pert'`, `inputsLabel: 'PERT inputs'`), substitute another **real, surviving** calculator's identifier — NOT a synthetic `'identity-test'` (which would require adding a CSS rule). The substitution preserves the test's "exercise the real CSS contract" property without expanding scope.

**Why GIR specifically:** the planner picks GIR because **(a)** its identity class follows the canonical `.identity-{slug}` pattern (UAC/UVC is `.identity-uac`, a token-level deviation), **(b)** its label and inputsLabel are short and unambiguous, **(c)** it has no shared substring with other survivors (rules out "feeds" / "formula" which both start with F).

**Concrete excerpt — `src/lib/shell/CalculatorPage.test.ts` (5 edits, all to use `identity-gir` / `'GIR inputs'`):**

```typescript
// Line 45 (default scaffold):
identityClass: 'identity-pert',  →  identityClass: 'identity-gir',

// Line 70 (T-CP-01 override):
const mod = makeModule({ identityClass: 'identity-pert' });
→ const mod = makeModule({ identityClass: 'identity-gir' });

// Line 72 (T-CP-01 assertion):
expect(container.querySelector('.identity-pert')).not.toBeNull();
→ expect(container.querySelector('.identity-gir')).not.toBeNull();

// Line 117 (T-CP-06 override):
const mod = makeModule({ inputsLabel: 'PERT inputs' });
→ const mod = makeModule({ inputsLabel: 'GIR inputs' });

// Line 119 (T-CP-06 assertion):
const aside = screen.getByRole('complementary', { name: 'PERT inputs' });
→ const aside = screen.getByRole('complementary', { name: 'GIR inputs' });
```

---

### §D — Count-Bump Pattern

**Applies to:** every spec/test that asserts a literal `6` (registry size) — must become `5`.

**Sites:**
- `src/lib/shell/HamburgerMenu.test.ts:44` — `toHaveLength(6)` → `toHaveLength(5)`
- `src/lib/shell/NavShell.test.ts:191, 209, 223` — `toHaveLength(6)` → `toHaveLength(5)`
- `e2e/desktop-full-nav.spec.ts:28, 57, 79, 94` — `toHaveCount(6)` → `toHaveCount(5)`
- `e2e/drawer-no-autofocus.spec.ts:4-5` (comment) — `6 routes x 2 projects = 12 cases` → `5 routes x 2 projects = 10 cases`

**No analog needed — these are literal-narrowing.** The pattern IS the count.

---

### §E — Co-Located Test Deletion (Svelte Standard)

**Pattern:** per project memory `feedback_test_colocation.md` + CONTEXT.md `<code_context>` ("Co-located test files (Svelte standard, not `__tests__/` dirs)"), every `*.test.ts` file lives next to its `*.svelte` / `*.ts` source. Deleting a slice means deleting source + co-located tests together, in one commit, so vitest stays green.

**Proven by:** every existing slice. Example: `src/lib/feeds/` has `FeedAdvanceCalculator.svelte` + `FeedAdvanceCalculator.test.ts` co-located. The exception is `src/lib/shell/__tests__/registry.test.ts` (the only `__tests__/` dir in the repo, kept for historical reasons — but its sibling shell tests like `HamburgerMenu.test.ts`, `NavShell.test.ts`, `CalculatorPage.test.ts`, `calculator-store.test.ts` ARE co-located per the standard).

**Applies to Plan 52-01:** delete all 5 PERT `*.test.ts` files in the same commit as their source. No special handling needed — they're already adjacent.

---

### §F — Favorites Regression Test (D-11 Addition)

**Applies to:** `src/lib/shared/favorites.test.ts` — append new T-21.

**Analog:** T-07 (lines 64-74) is the exact behavioural twin (asserts unknown-id filter preserves stored order). Copy its shape verbatim, swap `'ghost'` → `'unknown-calculator-id'` for grep-cleanliness AND so the test is feature-agnostic (covers any future calculator removal).

**Concrete excerpt — T-07 (current `src/lib/shared/favorites.test.ts:64-74`):**

```typescript
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
```

**T-21 to add (after T-20, ~line 207), per D-11:**

```typescript
describe('T-21 — unknown-calculator-id forward compatibility regression', () => {
    it('T-21: unknown id (e.g. a removed calculator) is silently filtered, preserving order of valid ids', async () => {
        // D-11 (Phase 52): regression guard for users whose stored favorites included
        // a calculator id that was later removed from the registry. The recover()
        // filter MUST drop the unknown id without error and MUST preserve the order
        // of the surviving valid ids. Uses a generic literal so this test stays
        // feature-agnostic across future removals.
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

---

## Per-File Pattern Assignments

### `src/lib/shell/registry.ts` (Plan 52-01)

**Edit type:** import-drop + array-entry-drop (the canonical "remove a calculator" inverse).

**Current source (lines 12-29):**

```typescript
import type { CalculatorEntry } from './calculator-module.js';
import { feedsModule } from '$lib/feeds/calculator.js';
import { fortificationModule } from '$lib/fortification/calculator.js';
import { girModule } from '$lib/gir/calculator.js';
import { morphineModule } from '$lib/morphine/calculator.js';
import { pertModule } from '$lib/pert/calculator.js';            // ← DELETE (line 17)
import { uacUvcModule } from '$lib/uac-uvc/calculator.js';

// Same alphabetical-by-id order as before — D-19 invariant guarded by
// src/lib/shell/__tests__/registry.test.ts.
export const CALCULATOR_REGISTRY: readonly CalculatorEntry[] = [
  feedsModule,
  fortificationModule,
  girModule,
  morphineModule,
  pertModule,                                                     // ← DELETE (line 27)
  uacUvcModule
];
```

**Post-edit shape:** 5 imports, 5 array entries, alphabetical invariant preserved. The "Same alphabetical-by-id order" comment at line 20 stays unchanged (still true). The `D-19 invariant` reference stays (it's a registry-test cross-reference, not PERT-specific).

**No trailing-comma cleanup needed:** `uacUvcModule` on line 28 has no trailing comma; the array literal is syntactically clean post-deletion.

---

### `src/lib/shared/types.ts:7` (Plan 52-02)

**Edit type:** single-token union narrowing.

```typescript
// Before:
export type CalculatorId = 'morphine-wean' | 'formula' | 'gir' | 'feeds' | 'uac-uvc' | 'pert';

// After:
export type CalculatorId = 'morphine-wean' | 'formula' | 'gir' | 'feeds' | 'uac-uvc';
```

**Pattern source:** self-pattern. **Critical:** must land in the same commit as the `about-content.ts` `pert:` block deletion — TypeScript's `Record<CalculatorId, AboutContent>` enforcement (about-content.ts:19) will TS2741 if the union loses `'pert'` while the record still has it, OR if the record loses `pert:` while the union still requires it. Co-commit guarantees green.

---

### `src/lib/shared/about-content.ts:81-94` (Plan 52-02)

**Edit type:** delete one keyed entry from `Record<CalculatorId, AboutContent>`.

**Pattern source:** self-pattern — the surviving 5 entries (lines 1-80) ARE the shape. Drop the 14-line `pert:` block; no other edit needed. Prettier's `trailingComma: 'all'` keeps the `},` on the new last entry (uac-uvc) clean.

---

### `src/app.css:283-291` (Plan 52-02)

**Edit type:** delete 9-line CSS block (`.identity-pert` light + dark + scoped variants).

**Pattern source:** self-pattern — the surviving `.identity-feeds`, `.identity-formula`, `.identity-gir`, `.identity-morphine`, `.identity-uac` blocks (light + dark each) above and below show the survivor shape. Delete the PERT block; surrounding blocks unchanged. The outer wrapper `}` at line 292 belongs to a higher-scoped layer — preserve it.

---

### `src/lib/shared/favorites.svelte.ts:57` (Plan 52-02)

**Edit type:** comment generalization (Shared §A above).

**No favorites code edit:** verified — `defaultIds()` at lines 17-20 computes from `CALCULATOR_REGISTRY.map(c => c.id).slice(0, FAVORITES_MAX)`. Once Plan 52-01 removes `pertModule`, defaults automatically collapse to `['feeds', 'formula', 'gir', 'morphine-wean']` — already the v1.13 D-19 baseline. Per D-03 hedge: "edit only if present" resolves to NO CODE EDIT.

---

### `src/lib/shell/calculator-store.svelte.ts` lines 7, 37, 68-69 (Plan 52-02)

**Edit type:** comment generalization (Shared §A above).

Three sites: a file-path list at line 7 (drop `pert,`), a "Mirrors" cross-reference at line 37 (re-phrase generically), and a try/catch explanation at lines 68-69 (drop the PERT-pattern citation).

---

### `src/lib/shell/calculator-module.ts:41-43` (Plan 52-02)

**Edit type:** JSDoc example string swap (sibling substitution, Shared §C above — but applied to types/JSDoc not test scaffolds).

Swap `"Pediatric EPI PERT Calculator"` → `"Glucose Infusion Rate"` (GIR's title), `"Capsule dosing · oral & tube-feed modes"` → `"mg/kg/min · helper"` (GIR's subtitle), `"PERT inputs"` → `"GIR inputs"` (GIR's inputsLabel). The example strings must be **real, surviving** calculator values (verifiable against `src/lib/gir/calculator.ts`) so future maintainers can grep them back to the source.

---

### `src/lib/fortification/calculator.ts:13` (Plan 52-02)

**Edit type:** comment generalization (Shared §A above). The canonical example named in CONTEXT.md D-14.

---

### `src/lib/shell/__tests__/registry.test.ts` lines 10, 46-52, 54-59 (Plan 52-03)

**Edit type:** registry-test renumber (Shared §B above).

---

### `src/lib/shell/HamburgerMenu.test.ts` lines 37-39, 44, 49 (Plan 52-03)

**Edit type:** drop one link assertion + count-bump (Shared §D) + comment generalize (Shared §A).

**Concrete current source (lines 44-50):**

```typescript
expect(screen.getAllByRole('link')).toHaveLength(6);        // ← bump to 5
expect(screen.getByRole('link', { name: /Morphine/i })).toBeTruthy();
expect(screen.getByRole('link', { name: /Formula/i })).toBeTruthy();
expect(screen.getByRole('link', { name: /GIR/i })).toBeTruthy();
expect(screen.getByRole('link', { name: /Feeds/i })).toBeTruthy();
expect(screen.getByRole('link', { name: /PERT/i })).toBeTruthy();    // ← DELETE this line
expect(screen.getByRole('link', { name: /UAC\/UVC/i })).toBeTruthy();
```

Surviving 5 assertions ARE the shape. Drop one, decrement count.

---

### `src/lib/shell/NavShell.test.ts` lines 16, 162, 191, 196-197, 209, 223 (Plan 52-03) ⚠️

**⚠️ Risk R-1:** This file is **NOT named in CONTEXT.md TEST-03..06** but contains 4 PERT references that WILL break vitest if not edited. The planner's resolution per research recommendation: **include in Plan 52-01** (alongside the registry edit) so D-02's "every commit green" invariant holds. Alternative: include in 52-03 if the planner accepts a single red-then-green hop on Plan 52-01.

**Edit type:** drop textContent assertion + renumber successor + count-bump + comment generalize.

**Concrete current source (lines 191, 196-197):**

```typescript
expect(tabs).toHaveLength(6);                                  // ← bump to 5
// ... (lines 192-195 omitted)
expect(tabs[4].textContent).toMatch(/PERT/i);                  // ← DELETE this line
expect(tabs[5].textContent).toMatch(/UAC/i);                   // ← renumber [5] → [4]
```

Identical to the registry-test renumber pattern (Shared §B), applied to nav tab assertions.

---

### `src/lib/shell/CalculatorPage.test.ts` lines 45, 70, 72, 117, 119 (Plan 52-03)

**Edit type:** sibling substitution (Shared §C above) — swap `identity-pert` → `identity-gir`, `'PERT inputs'` → `'GIR inputs'`. 5 mechanical replacements.

---

### `src/lib/shell/calculator-store.test.ts:54` (Plan 52-03)

**Edit type:** comment generalization in vitest `it()` description string.

```typescript
// Before:
it('round-trips via vi.resetModules() + dynamic import (mirrors PERT pattern)', async () => {

// After:
it('round-trips via vi.resetModules() + dynamic import', async () => {
```

Per D-13 (scrub ALL PERT from active test files), the parenthetical attribution leaves.

---

### `src/lib/shared/favorites.test.ts` line 119 + new T-21 (Plan 52-03)

**Edit 1 — line 119:** drop `'pert,'` from the post-D-19 alphabetization comment listing.

**Edit 2 — append T-21 regression test:** Shared §F above.

---

### `e2e/desktop-full-nav.spec.ts` lines 16, 28, 33-34, 57, 79, 94 (Plan 52-03)

**Edit type:** count-bumps (Shared §D) + drop one tab assertion + renumber successor (identical to registry-test renumber, Shared §B applied to Playwright tab assertions).

Per D-07 (implementer's call), the recommended phrasing is **delete line 33's PERT assertion AND renumber `tabs.nth(5)` → `tabs.nth(4)`** so the 5 surviving assertions index from 0..4 contiguously.

---

### `e2e/drawer-no-autofocus.spec.ts` lines 4-5, 10-11, 20 (Plan 52-03)

**Edit type:** route-array drop (line 20) + count-bump in header comment (lines 4-5) + comment generalize (lines 10-11, per Shared §A).

**Concrete current source (line 20 area):**

```typescript
const ROUTES = [
    '/morphine-wean',
    '/formula',
    '/gir',
    '/feeds',
    '/uac-uvc',
    '/pert'                                                      // ← DELETE this line
];
```

---

## Files With No Analog Found

**None.** Every Phase 52 edit has either (a) a sibling-slice precedent (the surviving 5 calculators), (b) a self-pattern (the surviving array entries / union members / record keys / surrounding CSS blocks ARE the shape), or (c) a co-located proven pattern (T-07 for T-21; `tabs.nth(N)` neighbors for `nth(5)` renumber).

This is a function of the deletion shape: **the surviving 5 calculators are themselves the analog** — Phase 52 is "remove one of N homogeneous things from a registry-driven architecture", and every step has a survivor that proves the post-edit shape is valid.

---

## Plan-to-File Mapping (Summary)

| Plan | Files Touched | Type | Vitest Impact | Playwright Impact |
|------|--------------|------|---------------|-------------------|
| **52-01** | 17 deletes + 1 edit (`registry.ts`) + (per R-1) 1 test edit (`NavShell.test.ts`) | source delete + registry narrow | -56 tests (5 PERT test files gone) | -32 tests (2 e2e specs gone) |
| **52-02** | 7 edits (`types.ts`, `about-content.ts`, `app.css`, `favorites.svelte.ts`, `calculator-store.svelte.ts`, `calculator-module.ts`, `fortification/calculator.ts`) | type narrow + content drop + CSS drop + comment generalize | 0 (no test files touched) | 0 |
| **52-03** | 8 test-file edits (registry.test.ts, HamburgerMenu.test.ts, CalculatorPage.test.ts, calculator-store.test.ts, favorites.test.ts, desktop-full-nav.spec.ts, drawer-no-autofocus.spec.ts; **NavShell.test.ts moved to 52-01 per R-1**) | drop assertion + count-bump + sibling-substitute + comment generalize + add T-21 | +1 (new T-21 regression test) | -2 (drawer-no-autofocus drops /pert iteration × 2 projects) |

**Cumulative deltas (per research §5):**
- Vitest: 489 → 434 tests (−56 + 1 = −55), 47 → 42 test files (−5)
- Playwright: 264 → 230 tests per project-pair (−32 spec deletions − 2 route iterations)
- Type-check: 0 → 0 (gate enforced by `CalculatorId` union narrowing)
- Bundle: ~772 KB → ~745-755 KB (PERT chunk + pert.html removed)

---

## Metadata

**Analog search scope:** `src/lib/`, `src/routes/`, `e2e/`, `src/app.css`, `src/lib/shell/`, `src/lib/shared/`.
**Files scanned:** 30 (per RESEARCH §4 grep table).
**Pattern extraction date:** 2026-05-23.
**Project skill load:** none — no `.claude/skills/` or `.agents/skills/` directories present in repo.
**Project conventions consulted:** `CLAUDE.md` (test colocation, atomic green commits, alphabetical registry invariant D-19), `MEMORY.md` (feedback_test_colocation.md confirms Svelte standard).

## PATTERN MAPPING COMPLETE
