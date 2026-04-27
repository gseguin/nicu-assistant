# Phase 44: Kendamil Formula Family - Pattern Map

**Mapped:** 2026-04-25
**Files analyzed:** 5 (all modifications; no new files)
**Analogs found:** 5 / 5 (each modified file is its own closest analog — extend-in-place phase)

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `src/lib/fortification/fortification-config.json` | config (data fixture) | static-load | self (existing 30 entries are the analog) | exact |
| `src/lib/fortification/fortification-config.ts` | loader (typed accessor) | request-response | self + `src/lib/fortification/calculations.ts` (top-of-file header comment) | role-match |
| `src/lib/fortification/fortification-config.test.ts` | test (data-shape) | request-response | self (`describe('fortification-config loader', ...)` block) | exact |
| `src/lib/fortification/calculations.test.ts` | test (parity) | request-response | self (Neocate VAL-01 + HMF-scoops blocks) | exact |
| `e2e/fortification-a11y.spec.ts` | test (e2e a11y) | event-driven (axe sweep) | self (existing 4 tests) + `e2e/formula.spec.ts` (selector reference) | exact |

**Read-first set per task:** for every action, the planner should pin the file being modified PLUS the analog excerpt(s) below.

## Pattern Assignments

### `src/lib/fortification/fortification-config.json` (config, static-load)

**Analog:** Existing entries in the same file. Splice 3 new entries between `gerber-good-start` (id `g…`) and `monogen` / `neocate-infant` (id `m…` / `n…`) — the existing file is alphabetical-by-id.

**Adjacent neighbor entry just BEFORE the splice point** (lines 83-90 — the `g…` entry the Kendamil block lands after):

```json
    {
      "id": "gerber-good-start",
      "name": "Gerber Good Start",
      "manufacturer": "Nestlé",
      "displacement_factor": 0.76,
      "calorie_concentration": 5.12,
      "grams_per_scoop": 8.7
    },
```

**Adjacent neighbor entry just AFTER the splice point** (lines 91-98 — the `m…` entry the Kendamil block lands before):

```json
    {
      "id": "monogen",
      "name": "Monogen",
      "manufacturer": "Nutricia",
      "displacement_factor": 0.75,
      "calorie_concentration": 4.7,
      "grams_per_scoop": 5
    },
```

**Field-order pattern observed across all 30 entries:** `id` → `name` → `manufacturer` → `displacement_factor` → `calorie_concentration` → `grams_per_scoop` (→ optional `packetsSupported` only on `similac-hmf`).

**Indentation:** 4-space per nesting level inside the array (`    {`, `      "id":`). Trailing commas after each object except the last in the `formulas` array. Diacritics escaped as `é` (see `Nestlé` at lines 6, 86, 134, 239).

**Insertion-point context (lines 83-99):** the JSON file ends each entry's closing brace with `},` followed by the next entry. The new Kendamil block must:
1. Add a `,` after `gerber-good-start`'s closing `}` (already present — the entry ends `},` at line 90).
2. Splice three full entries (Classic, Goat, Organic alphabetical-by-id), each terminated with `},`.
3. Leave `monogen` unchanged (it already starts with `{` on its own line and is followed by other entries).

**Concrete entries to splice (from RESEARCH.md §Per-Variant Draft JSON Objects):**

```json
    {
      "id": "kendamil-classic",
      "name": "Kendamil Classic",
      "manufacturer": "Kendamil",
      "displacement_factor": 0.77,
      "calorie_concentration": 5.21,
      "grams_per_scoop": 4.3
    },
    {
      "id": "kendamil-goat",
      "name": "Kendamil Goat",
      "manufacturer": "Kendamil",
      "displacement_factor": 0.77,
      "calorie_concentration": 5.09,
      "grams_per_scoop": 4.3
    },
    {
      "id": "kendamil-organic",
      "name": "Kendamil Organic",
      "manufacturer": "Kendamil",
      "displacement_factor": 0.77,
      "calorie_concentration": 5.12,
      "grams_per_scoop": 4.3
    },
```

**Pattern adherence checklist (D-12, D-07):**
- No `packetsSupported` field — matches 29 of 30 existing entries (only `similac-hmf` at lines 188-195 sets `packetsSupported: true`).
- `manufacturer: "Kendamil"` — plain ASCII, no `\u…` escapes needed (unlike `Nestlé`).
- `grams_per_scoop` is a literal `4.3` not a string — matches existing numeric pattern.

---

### `src/lib/fortification/fortification-config.ts` (loader, request-response)

**Analog:** The same file (19 lines, currently no header JSDoc) plus the comment style at `src/lib/fortification/calculations.ts:1-2` (line-comment header) and the function-level JSDoc at `src/lib/fortification/calculations.ts:20`.

**Existing top-of-file in `calculations.ts`** (lines 1-2 — line-comment header pattern):

```typescript
// Fortification calculation core. Pure function, no Svelte / DOM / I/O.
// Mirrors the recipe-calculator.xlsx Calculator tab. See Plan 09-02 Formula Reference.
```

**Existing function-level JSDoc in `calculations.ts`** (line 20 — single-line `/** … */` style):

```typescript
/** Gram mass of the added powder for a given unit. See Plan 09-02 Formula Reference (B-4). */
```

**Existing function-level JSDoc in `morphine/calculations.ts`** (lines 4-8 — multi-line `/** … */` block precedent):

```typescript
/**
 * Calculate a linear weaning schedule.
 * Each step reduces by a fixed amount: initialDose * decreasePct.
 * Doses are clamped to 0 if reduction would make them negative.
 */
```

**Current `fortification-config.ts` (entire file, lines 1-19) — splice the JSDoc block above line 1:**

```typescript
import type { FortificationFormula, FortificationInputRanges } from './types.js';
import config from './fortification-config.json';

const formulas: FortificationFormula[] = config.formulas;

export const inputs: FortificationInputRanges = config.inputs as FortificationInputRanges;

export function getFortificationFormulas(): FortificationFormula[] {
  return formulas;
}

export function getFormulaById(id: string): FortificationFormula | undefined {
  return formulas.find((f) => f.id === id);
}

export function formulaSupportsPackets(id: string): boolean {
  return getFormulaById(id)?.packetsSupported === true;
}
```

**Recommended JSDoc shape (from RESEARCH.md §JSDoc Audit-Comment Recommended Shape; D-13/D-14 require URL + region + ISO date per variant in this file, raw HCP values stay in PLAN.md):**

```typescript
/**
 * Fortification formula loader.
 *
 * The 30 alphabetically-indexed formulas transcribe rows A3:D35 of
 * recipe-calculator.xlsx (Calculator tab). The 3 Kendamil entries extend
 * beyond the xlsx — Kendamil is not represented there. Their values are
 * sourced from per-variant Nutritional Profile + Mixing Instructions
 * datasheets on hcp.kendamil.com (US region).
 *
 * Kendamil audit trail (per Phase 44 D-13/D-14; raw HCP values in PLAN.md):
 *
 *   kendamil-organic  — https://hcp.kendamil.com/cdn/shop/files/Organic.pdf
 *                       region: US, fetched: 2026-04-24
 *   kendamil-classic  — https://hcp.kendamil.com/cdn/shop/files/Classic.pdf
 *                       region: US, fetched: 2026-04-24
 *   kendamil-goat     — https://hcp.kendamil.com/cdn/shop/files/Goat.pdf
 *                       region: US, fetched: 2026-04-24
 */
import type { FortificationFormula, FortificationInputRanges } from './types.js';
// ... rest unchanged
```

**Style note:** No top-of-file `/** … */` block currently exists in `src/lib/fortification/`. The closest precedent is the line-comment header at `calculations.ts:1-2`. The recommended shape is a fresh JSDoc block (justified because D-13/D-14 require multi-line per-variant pointers — line comments would clutter the loader). This shape is consistent with the multi-line block style seen at `morphine/calculations.ts:4-8`.

---

### `src/lib/fortification/fortification-config.test.ts` (test, request-response)

**Analog:** Self — existing `describe('fortification-config loader', ...)` and `describe('getFormulaById', ...)` blocks at lines 13-58 and 60-80.

**Existing imports + REQUIRED_KEYS array (lines 1-11) — already covers Kendamil entries automatically through the per-formula loop:**

```typescript
import { describe, it, expect } from 'vitest';
import { getFortificationFormulas, getFormulaById } from './fortification-config.js';

const REQUIRED_KEYS = [
  'id',
  'name',
  'manufacturer',
  'displacement_factor',
  'calorie_concentration',
  'grams_per_scoop'
] as const;
```

**Existing count assertion + xlsx rationale (lines 13-18) — REPLACE per D-11:**

```typescript
describe('fortification-config loader', () => {
  const formulas = getFortificationFormulas();

  it('contains exactly 30 formulas (xlsx Calculator A3:D35 row count)', () => {
    expect(formulas).toHaveLength(30);
  });
```

**Replacement (per D-11; preserves xlsx-sourced rationale and notes the HCP-sourced divergence):**

```typescript
describe('fortification-config loader', () => {
  const formulas = getFortificationFormulas();

  it('contains exactly 33 formulas (30 from xlsx Calculator A3:D35 + 3 Kendamil HCP)', () => {
    // 30 entries transcribe recipe-calculator.xlsx Calculator tab A3:D35.
    // 3 Kendamil entries (Organic, Classic, Goat) extend beyond xlsx —
    // sourced from hcp.kendamil.com per Phase 44 PLAN.md audit trail.
    expect(formulas).toHaveLength(33);
  });
```

**Existing per-formula validation loop (lines 20-31) — picks up new Kendamil entries automatically; no change needed:**

```typescript
  it('every entry has all required fields', () => {
    for (const f of formulas) {
      for (const key of REQUIRED_KEYS) {
        expect(f, `formula ${f.name} missing ${key}`).toHaveProperty(key);
      }
      expect(typeof f.id).toBe('string');
      expect(f.id.length).toBeGreaterThan(0);
      expect(typeof f.name).toBe('string');
      expect(f.name.length).toBeGreaterThan(0);
      expect(typeof f.manufacturer).toBe('string');
    }
  });
```

**Existing `getFormulaById` describe pattern (lines 60-80) — analog for the new Kendamil id-resolution assertions:**

```typescript
describe('getFormulaById', () => {
  it('finds Neocate Infant by id', () => {
    const f = getFormulaById('neocate-infant');
    expect(f).toBeDefined();
    expect(f?.name).toBe('Neocate Infant');
    expect(f?.displacement_factor).toBe(0.7);
    expect(f?.calorie_concentration).toBe(4.83);
    expect(f?.grams_per_scoop).toBe(4.6);
  });

  it('finds Similac HMF by id (the only formula that supports Packets)', () => {
    // NOTE: xlsx labels this row "Similac HMF" verbatim, not "Similac Human Milk Fortifier".
    const f = getFormulaById('similac-hmf');
    expect(f).toBeDefined();
    expect(f?.name).toBe('Similac HMF');
  });

  it('returns undefined for unknown id', () => {
    expect(getFormulaById('not-a-real-formula')).toBeUndefined();
  });
});
```

**Recommended new Kendamil grouping describe block (KEND-04, KEND-05, KEND-TEST-02; appended at end of file; from RESEARCH.md §E):**

```typescript
describe('Kendamil grouping (KEND-04 / KEND-TEST-02)', () => {
  it('exposes exactly 3 Kendamil entries', () => {
    const kendamils = getFortificationFormulas().filter((f) => f.manufacturer === 'Kendamil');
    expect(kendamils).toHaveLength(3);
  });

  it('Kendamil entries appear in alphabetical order by name (Classic, Goat, Organic) after the picker sort', () => {
    const names = getFortificationFormulas()
      .filter((f) => f.manufacturer === 'Kendamil')
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((f) => f.name);
    expect(names).toEqual(['Kendamil Classic', 'Kendamil Goat', 'Kendamil Organic']);
  });

  it('each Kendamil variant resolvable by id (KEND-01/02/03)', () => {
    expect(getFormulaById('kendamil-organic')?.name).toBe('Kendamil Organic');
    expect(getFormulaById('kendamil-classic')?.name).toBe('Kendamil Classic');
    expect(getFormulaById('kendamil-goat')?.name).toBe('Kendamil Goat');
  });

  it('no Kendamil variant supports packets — default-false via omitted field (KEND-05)', () => {
    for (const f of getFortificationFormulas().filter((x) => x.manufacturer === 'Kendamil')) {
      expect(f.packetsSupported).toBeUndefined();
    }
  });

  it('Kendamil group sorts between Abbott and Mead Johnson (alphabetical localeCompare)', () => {
    const manufacturers = Array.from(
      new Set(
        getFortificationFormulas()
          .slice()
          .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer))
          .map((f) => f.manufacturer)
      )
    );
    const idxAbbott = manufacturers.indexOf('Abbott');
    const idxKendamil = manufacturers.indexOf('Kendamil');
    const idxMeadJohnson = manufacturers.indexOf('Mead Johnson');
    expect(idxAbbott).toBeGreaterThanOrEqual(0);
    expect(idxKendamil).toBe(idxAbbott + 1);
    expect(idxMeadJohnson).toBe(idxKendamil + 1);
  });
});
```

---

### `src/lib/fortification/calculations.test.ts` (test, parity)

**Analog (canonical):** Existing Neocate VAL-01 block at lines 11-25 and the **closest match — HMF-scoops parity** at lines 103-117 (general CALC-02 + breast-milk + 180 + 24 + scoops, identical inputs except formula constants). The Kendamil tests mirror lines 103-117 exactly.

**Existing imports + helpers (lines 1-9):**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateFortification } from './calculations.js';
import { getFormulaById } from './fortification-config.js';
import type { FortificationFormula } from './types.js';

const neocate = getFormulaById('neocate-infant') as FortificationFormula;
const hmf = getFormulaById('similac-hmf') as FortificationFormula;

const SUGGESTED_RE = /^\d+ \(\d+(\.\d+)? oz\)$/;
```

**New helper constants to add directly beneath line 9 (preserves existing two-blank-line spacing before the first `describe`):**

```typescript
const kendamilOrganic = getFormulaById('kendamil-organic') as FortificationFormula;
const kendamilClassic = getFormulaById('kendamil-classic') as FortificationFormula;
const kendamilGoat = getFormulaById('kendamil-goat') as FortificationFormula;
```

**Neocate VAL-01 canonical (lines 11-25) — the structural template the Kendamil block mirrors at the `describe` level:**

```typescript
describe('calculateFortification — documented case (VAL-01)', () => {
  it('Neocate Infant + breast milk + 180 mL + 24 kcal/oz + tsp matches spreadsheet', () => {
    const r = calculateFortification({
      formula: neocate,
      base: 'breast-milk',
      volumeMl: 180,
      targetKcalOz: 24,
      unit: 'teaspoons'
    });
    expect(r.amountToAdd).toBe(2);
    expect(r.yieldMl).toBeCloseTo(183.5, 4);
    expect(r.exactKcalPerOz).toBeCloseTo(23.5101662125341, 4);
    expect(r.suggestedStartingVolumeMl).toBe('180 (6.1 oz)');
  });
});
```

**HMF-scoops parity (lines 103-117) — closest analog the Kendamil `it` blocks mirror line-for-line. This is the canonical pattern to copy:**

```typescript
  it('Scoops: Similac HMF + breast milk + 180 + 24 + scoops', () => {
    // general grams = (180 * (24 - 20)) / (29.57 * 1.4 - 1 * 24) = 41.38406713415336
    // scoops = 41.38406713415336 / 5 = 8.276813426830673
    const r = calculateFortification({
      formula: hmf,
      base: 'breast-milk',
      volumeMl: 180,
      targetKcalOz: 24,
      unit: 'scoops'
    });
    expect(r.amountToAdd).toBeCloseTo(8.276813426830673, 4);
    expect(r.yieldMl).toBeGreaterThan(180);
    expect(Number.isFinite(r.exactKcalPerOz)).toBe(true);
    expect(r.suggestedStartingVolumeMl).toMatch(SUGGESTED_RE);
  });
```

**Pattern signals to copy verbatim:**
- 4-digit `toBeCloseTo(value, 4)` precision (matches Neocate VAL-01 line 22, HMF-scoops line 113).
- `yieldMl > 180` assertion (line 114) — Kendamil math also yields ~184 mL.
- `Number.isFinite(r.exactKcalPerOz)` (line 115) — same sanity check.
- `SUGGESTED_RE` shape match (line 116) — regex defined at line 9, reused.
- 2-line derivation comment above the `const r = …` (lines 104-105). Kendamil should mirror this with the per-variant derivation values from RESEARCH.md.

**Recommended new Kendamil parity block (mirrors Neocate VAL-01 describe-naming style + HMF-scoops it-shape; per-variant constants from RESEARCH.md §Per-Variant Hand-Computed Parity Test Expected Values):**

```typescript
describe('calculateFortification — Kendamil parity (KEND-TEST-01)', () => {
  it('Kendamil Organic + breast milk + 180 + 24 + scoops', () => {
    // disp=0.77, cal=5.12, gps=4.3
    // denom = 29.57 * 5.12 - 0.77 * 24 = 132.9184
    // grams = (180 * (24 - 20)) / 132.9184 = 5.416857259792473
    // scoops = grams / 4.3 = 1.2597342464633658
    const r = calculateFortification({
      formula: kendamilOrganic,
      base: 'breast-milk',
      volumeMl: 180,
      targetKcalOz: 24,
      unit: 'scoops'
    });
    expect(r.amountToAdd).toBeCloseTo(1.2597342464633658, 4);
    expect(r.yieldMl).toBeGreaterThan(180);
    expect(Number.isFinite(r.exactKcalPerOz)).toBe(true);
    expect(r.suggestedStartingVolumeMl).toMatch(SUGGESTED_RE);
  });

  it('Kendamil Classic + breast milk + 180 + 24 + scoops', () => {
    // disp=0.77, cal=5.21, gps=4.3
    // denom = 29.57 * 5.21 - 0.77 * 24 = 135.5797
    // grams = (180 * (24 - 20)) / 135.5797 = 5.310529526175379
    // scoops = grams / 4.3 = 1.2350068665524137
    const r = calculateFortification({
      formula: kendamilClassic,
      base: 'breast-milk',
      volumeMl: 180,
      targetKcalOz: 24,
      unit: 'scoops'
    });
    expect(r.amountToAdd).toBeCloseTo(1.2350068665524137, 4);
    expect(r.yieldMl).toBeGreaterThan(180);
    expect(Number.isFinite(r.exactKcalPerOz)).toBe(true);
    expect(r.suggestedStartingVolumeMl).toMatch(SUGGESTED_RE);
  });

  it('Kendamil Goat + breast milk + 180 + 24 + scoops', () => {
    // disp=0.77, cal=5.09, gps=4.3
    // denom = 29.57 * 5.09 - 0.77 * 24 = 132.0313
    // grams = (180 * (24 - 20)) / 132.0313 = 5.453252372732829
    // scoops = grams / 4.3 = 1.268198226216937
    const r = calculateFortification({
      formula: kendamilGoat,
      base: 'breast-milk',
      volumeMl: 180,
      targetKcalOz: 24,
      unit: 'scoops'
    });
    expect(r.amountToAdd).toBeCloseTo(1.268198226216937, 4);
    expect(r.yieldMl).toBeGreaterThan(180);
    expect(Number.isFinite(r.exactKcalPerOz)).toBe(true);
    expect(r.suggestedStartingVolumeMl).toMatch(SUGGESTED_RE);
  });
});
```

**Insertion point:** after the existing `describe('calculateFortification — general formula + units (CALC-02/03)', ...)` block ending at line 134, and before the IFERROR-parity block at line 136. The new describe block is a sibling of the existing five describes.

---

### `e2e/fortification-a11y.spec.ts` (test, e2e a11y)

**Analog (within file):** existing 4 axe-sweep tests at lines 18-29 (light, default), 31-45 (dark, default), 47-65 (light, results visible), 67-85 (dark, results visible). The new Kendamil-selected tests follow the same structure plus a SelectPicker click step before the axe scan.

**Existing imports + describe + beforeEach (lines 1-16):**

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Fortification Calculator Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/formula');

    // Wait for the page heading to confirm load
    await page.getByRole('heading', { name: 'Formula Recipe' }).waitFor({ state: 'visible' });

    // Dismiss the disclaimer modal if it appears
    await page
      .getByRole('button', { name: /understand|acknowledge/i })
      .click({ timeout: 2000 })
      .catch(() => {});
  });
```

**Existing dark-mode + results-visible test (lines 67-85) — closest analog the new Kendamil-selected tests should mirror, plus a formula-pick step before the axe scan:**

```typescript
  test('fortification page has no axe violations with results visible in dark mode', async ({
    page
  }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('no-transition');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(250);

    await expect(page.getByText('Amount to Add')).toBeVisible();

    // Focus the first numeric input to render the identity focus ring
    await page.getByRole('spinbutton').first().focus();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
```

**Pattern signals to copy verbatim:**
- Theme toggle via `page.evaluate(() => { document.documentElement.classList.toggle(...); })` block.
- 250 ms wait after dark-mode toggle (line 40 / 76) so axe reads final computed colors.
- `await expect(page.getByText('Amount to Add')).toBeVisible()` (line 57 / 78) — confirms calculator rendered after picker change.
- `await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()` — same WCAG tags used by all 4 existing tests.
- `expect(results.violations).toEqual([])` — same assertion shape.

**SelectPicker selector pattern (CONFIRMED via codebase read):**

The `SelectPicker.svelte` trigger is a `<button>` element with `aria-labelledby="{labelId} {valueId}"` where the label slot text is "Formula" (from `FortificationInputs.svelte:145`: `<SelectPicker label="Formula" bind:value={formulaStr} options={formulaOptions} searchable />`). The trigger's accessible name composes as `"Formula" + selected-value-text` — so `getByRole('button', { name: /^Formula/ })` is the canonical locator (mirrors `SelectPicker.test.ts:24` which uses `screen.getByRole('button', { name: new RegExp('^${label}') })`).

When opened, the dialog renders `<button role="option">` elements per option (lines 233/259 of `SelectPicker.svelte`). The picker is `searchable` for Formula (FortificationInputs.svelte:145), so an alternative is to use the search box: `aria-label="Filter Formula"` (SelectPicker.svelte:204).

**No prior-art selector in `e2e/`:** `e2e/formula.spec.ts` does NOT exercise the SelectPicker formula-selection flow (verified by direct read — it only checks the SegmentedToggle tablist visibility at line 20 and the Starting Volume label at line 30). This is a **new selector pattern for e2e**, not a mirror of an existing test. The vitest `SelectPicker.test.ts` is the closest behavioral reference (at `src/lib/shared/components/SelectPicker.test.ts:24,46-57,85-89`).

**Recommended new Kendamil-selected axe tests (append inside the existing `test.describe` block, after line 85):**

```typescript
  // KEND-TEST-03: re-run axe with a Kendamil variant selected. The new
  // contrast surface is the manufacturer-group label "Kendamil" in the
  // SelectPicker dropdown — identical for all three variants, so one
  // variant (Organic) covers the new surface in both themes.
  for (const theme of ['light', 'dark'] as const) {
    test(`fortification page has no axe violations with Kendamil Organic selected (${theme})`, async ({
      page
    }) => {
      await page.evaluate((t) => {
        document.documentElement.classList.add('no-transition');
        document.documentElement.classList.toggle('dark', t === 'dark');
        document.documentElement.classList.toggle('light', t === 'light');
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      if (theme === 'dark') await page.waitForTimeout(250);

      // Open the Formula SelectPicker and choose Kendamil Organic.
      // SelectPicker trigger is a <button> with aria-labelledby="<label> <value>";
      // the accessible name starts with "Formula".
      await page.getByRole('button', { name: /^Formula/ }).click();
      await page.getByRole('option', { name: 'Kendamil Organic' }).click();

      // Confirm the calculator re-rendered with the new selection.
      await expect(page.getByText('Amount to Add')).toBeVisible();

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(results.violations).toEqual([]);
    });
  }
```

**Selector verification at plan time:** the planner should verify `getByRole('button', { name: /^Formula/ })` resolves uniquely (the picker may also be named "Target Calorie", "Unit", or "Base"; `^Formula` anchors to the start of the accessible name). If the regex picks up multiple buttons, fall back to `page.getByRole('button', { name: /^Formula/ }).first()` or scope to the desktop aside: `page.locator('aside[aria-label="Formula inputs"]').getByRole('button', { name: /^Formula/ })`.

---

## Shared Patterns

### Pattern: `toBeCloseTo(value, 4)` for parity assertions

**Source:** `src/lib/fortification/calculations.test.ts` lines 21, 22, 113, 122, 129
**Apply to:** All three new Kendamil parity `it` blocks
**Excerpt:**
```typescript
expect(r.amountToAdd).toBeCloseTo(8.276813426830673, 4);
```
4-digit precision = absolute tolerance 5e-5 (well within the 1% epsilon required by D-09).

### Pattern: `SUGGESTED_RE` regex for `suggestedStartingVolumeMl`

**Source:** `src/lib/fortification/calculations.test.ts:9`
**Apply to:** All three new Kendamil parity `it` blocks
**Excerpt:**
```typescript
const SUGGESTED_RE = /^\d+ \(\d+(\.\d+)? oz\)$/;
expect(r.suggestedStartingVolumeMl).toMatch(SUGGESTED_RE);
```
Already defined at line 9; reused unchanged.

### Pattern: `getFormulaById(...) as FortificationFormula` helper-const

**Source:** `src/lib/fortification/calculations.test.ts:6-7`
**Apply to:** Top of `calculations.test.ts` (3 new constants) — feeds the new Kendamil parity tests
**Excerpt:**
```typescript
const neocate = getFormulaById('neocate-infant') as FortificationFormula;
const hmf = getFormulaById('similac-hmf') as FortificationFormula;
```
Mirror by adding `kendamilOrganic`, `kendamilClassic`, `kendamilGoat`.

### Pattern: theme-toggle via `document.documentElement.classList`

**Source:** `e2e/fortification-a11y.spec.ts` lines 19-24 (light), 33-39 (dark)
**Apply to:** Both new Kendamil-selected axe tests
**Excerpt:**
```typescript
await page.evaluate(() => {
  document.documentElement.classList.add('no-transition');
  document.documentElement.classList.remove('light');
  document.documentElement.classList.add('dark');
  document.documentElement.setAttribute('data-theme', 'dark');
});
await page.waitForTimeout(250);
```
The 250 ms wait exists so axe reads final computed colors, not mid-transition values.

### Pattern: AxeBuilder WCAG tags + violations assertion

**Source:** `e2e/fortification-a11y.spec.ts` lines 26-28 (and 4 sibling tests)
**Apply to:** Both new Kendamil-selected axe tests
**Excerpt:**
```typescript
const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
expect(results.violations).toEqual([]);
```
Identical scan tags + assertion shape.

### Pattern: alphabetical-by-id ordering in JSON config

**Source:** `src/lib/fortification/fortification-config.json` (entire `formulas` array, lines 3-243)
**Apply to:** `kendamil-classic` → `kendamil-goat` → `kendamil-organic` splice between `gerber-good-start` and `monogen`
**Excerpt:** see `gerber-good-start` (lines 83-90) → `monogen` (lines 91-98) above; the file order is alphabetical-by-id, not alphabetical-by-name.

### Pattern: omit `packetsSupported` for default-false

**Source:** `src/lib/fortification/fortification-config.json` — 29 of 30 entries omit it; only `similac-hmf` (lines 188-195) sets `"packetsSupported": true`
**Apply to:** All three new Kendamil entries (D-12)
**Excerpt (the only entry that DOES set the field — for contrast):**
```json
    {
      "id": "similac-hmf",
      "name": "Similac HMF",
      "manufacturer": "Abbott",
      "displacement_factor": 1,
      "calorie_concentration": 1.4,
      "grams_per_scoop": 5,
      "packetsSupported": true
    },
```
The runtime check at `fortification-config.ts:17` (`getFormulaById(id)?.packetsSupported === true`) treats `undefined` as `false`, so omission is the canonical default-false signal.

## No Analog Found

None. Every modified file has a strong analog (its own existing pattern in most cases — extend-in-place phase). One slight gap: no prior `e2e/` test exercises the SelectPicker formula-selection flow, so the Playwright selector pattern (`getByRole('button', { name: /^Formula/ })` + `getByRole('option', { name: 'Kendamil Organic' })`) is **new for e2e** — its closest behavioral reference is the vitest `SelectPicker.test.ts:46-57,85-89` interaction pattern, which the recommended snippet above translates to Playwright idiom.

## Metadata

**Analog search scope:**
- `src/lib/fortification/` (all 8 source files read)
- `src/lib/shared/components/SelectPicker.svelte` (lines 155-235 read for trigger + option role layout)
- `src/lib/shared/components/SelectPicker.test.ts` (interaction pattern grep)
- `e2e/` (all 16 spec filenames listed; `formula.spec.ts` and `fortification-a11y.spec.ts` fully read; `feeds.spec.ts`, `gir.spec.ts`, `morphine-wean.spec.ts` grep-scanned for SelectPicker selector prior art)
- `src/lib/morphine/calculations.ts:1-30` (JSDoc style precedent)

**Files scanned:** 8 source files fully read; 5 e2e specs grep-scanned; 1 component file partially read.

**Pattern extraction date:** 2026-04-25
