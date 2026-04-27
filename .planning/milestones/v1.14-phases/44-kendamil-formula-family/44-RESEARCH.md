# Phase 44: Kendamil Formula Family - Research

**Researched:** 2026-04-24
**Domain:** Clinical-data + JSON config (fortification calculator)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Spec Sourcing**
- **D-01:** Researcher fetches `hcp.kendamil.com` for the Classic and Goat variants during the research step. Organic spec values are locked in REQUIREMENTS KEND-01 (`calorie_concentration ≈ 5.12 kcal/g`, `displacement_factor ≈ 0.77 mL/g`, `grams_per_scoop 4.3`) — researcher confirms but does not re-derive.
- **D-02:** Region preference: try the US Kendamil HCP site first. Fall back to UK if US is incomplete. Capture both URLs if values match.
- **D-03:** Displacement factor is **derived from the published reconstitution ratio** per variant: `displacement_factor = (final_volume_mL − water_mL) / scoop_grams`. The math is documented step-by-step in PLAN.md per variant. No fallback to Organic's 0.77 — every variant gets its own derived value.
- **D-04:** If the HCP page does not expose enough data to compute displacement, the researcher pauses and surfaces this for user input — does **not** silently fall back.

**ID & Label Naming**
- **D-05:** IDs use the **bare-variant** convention: `kendamil-organic`, `kendamil-classic`, `kendamil-goat`.
- **D-06:** SelectPicker `name`: `"Kendamil Organic"`, `"Kendamil Classic"`, `"Kendamil Goat"`.
- **D-07:** `manufacturer` field is plain `"Kendamil"`. Auto-sorts alphabetically between Abbott and Mead Johnson.

**Parity Tests (KEND-TEST-01)**
- **D-08:** Mirror Neocate VAL-01 canonical: 180 mL + breast-milk + 24 kcal/oz + **scoops** unit. Hand-compute via general CALC-02 path.
- **D-09:** Each test asserts `amountToAdd` to within 1% epsilon (`toBeCloseTo`); also assert `yieldMl > 180` and `Number.isFinite(exactKcalPerOz)`.

**Grouping Test (KEND-TEST-02)**
- **D-10:** Lives in `fortification-config.test.ts`, not `FortificationInputs.test.ts`. Asserts 3 entries with `manufacturer === "Kendamil"`.
- **D-11:** Update count assertion at `fortification-config.test.ts:17` from 30 → 33; update xlsx-rationale comment to note Kendamil entries are HCP-sourced.

**`packetsSupported` Field**
- **D-12:** All three Kendamil entries omit `packetsSupported` (default `false`).

**Audit-Trail Capture**
- **D-13:** Audit trail in two places: PLAN.md (full audit per variant) and JSDoc comments at top of `fortification-config.ts` (per-variant pointer to URL + region + fetch date).
- **D-14:** Per-variant audit metadata: (a) source URL, (b) ISO fetch date, (c) raw HCP values, (d) region. All four go in PLAN.md; `.ts` comment carries URL + date + region only.

### Claude's Discretion
- Test naming / `describe` block structure (mirror existing VAL-01 style).
- Exact `toBeCloseTo` precision digits per variant (4 digits matches Neocate VAL-01).
- JSDoc shape: single header block (recommended) vs. one inline comment per `getFormulaById` reference.

### Deferred Ideas (OUT OF SCOPE)
- Kendamil HMF / fortifier variants
- Kendamil toddler / follow-on milks
- Other non-Kendamil formula brands
- Hide `manufacturer` field from SelectPicker label
- Sidecar `SOURCES.md` registry
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| KEND-01 | Kendamil Organic entry | §Per-Variant Data Block · Organic |
| KEND-02 | Kendamil Classic entry | §Per-Variant Data Block · Classic |
| KEND-03 | Kendamil Goat entry | §Per-Variant Data Block · Goat |
| KEND-04 | Three entries grouped under "Kendamil" in SelectPicker | §Existing-pattern excerpts (auto-grouping at FortificationInputs.svelte:83-86) |
| KEND-05 | `packetsSupported` field correctly false (omit) | §Per-Variant Draft JSON Objects (no `packetsSupported` field) |
| KEND-TEST-01 | Spreadsheet-parity unit tests for all three variants | §Per-Variant Hand-Computed Parity Test Expected Values |
| KEND-TEST-02 | SelectPicker grouping test extended | §Existing-pattern excerpts §E |
| KEND-TEST-03 | Playwright fortification axe sweep extended | §Playwright Axe-Spec Extension Approach |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- TypeScript + pnpm + SvelteKit 2 + Svelte 5 + Tailwind 4 + Vitest 4 + Playwright stack — no new dependencies in this phase.
- WCAG 2.1 AA minimum; 48px touch targets.
- Test colocation: tests live next to source (`src/lib/fortification/*.test.ts`), not in `__tests__/`.
- E2E specs live in `e2e/` (separate from unit tests). Playwright + axe-core/playwright already in use.
- No emojis in code/docs unless explicitly requested.

## Summary

This phase is a **JSON-data extension** — no library decisions, no architectural changes. The fortification module already provides everything needed: a strict JSON config loaded by a thin `.ts` loader, a deterministic pure `calculateFortification` function, and an auto-grouping SelectPicker driven by `manufacturer.localeCompare`. Adding three Kendamil entries with `manufacturer: "Kendamil"` produces a Kendamil group between Abbott and Mead Johnson with **zero UI changes**.

The clinical-data fetch from `hcp.kendamil.com` resolved cleanly. All three variants share **identical reconstitution physics** (4.3 g/scoop, 3.3 mL displacement per scoop, 0.77 mL/g HCP-printed displacement-per-gram). The only per-variant difference is **kcal-per-scoop**, which produces the per-variant `calorie_concentration`:

| Variant | kcal/scoop (HCP) | calorie_concentration | displacement_factor | grams_per_scoop |
|---------|------------------|-----------------------|---------------------|-----------------|
| Organic | 22.0 | **5.12** | **0.77** | 4.3 |
| Classic | 22.4 | **5.21** | **0.77** | 4.3 |
| Goat    | 21.9 | **5.09** | **0.77** | 4.3 |

**Primary recommendation:** Use the HCP-printed `0.77 mL/g` for `displacement_factor` on all three variants (D-03 derivation independently lands on `0.7674 mL/g`, which rounds to `0.77` at 2dp and matches the HCP "Displacement per gram of powder, mL" column verbatim). Use 2-decimal `calorie_concentration` matching existing config style. Organic's locked value `5.12` is exactly `round(22/4.3, 2)` — REQUIREMENTS KEND-01 confirmed.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Formula spec data | Static JSON config | TypeScript loader | `fortification-config.json` is canonical; loader provides typed access |
| Manufacturer grouping | Component (FortificationInputs.svelte) | — | Already-implemented `localeCompare` sort + `group` field |
| Calculation logic | Pure function (calculations.ts) | — | No changes; new entries flow through general CALC-02 branch |
| Audit trail | Markdown (PLAN.md) + JSDoc (.ts loader) | — | JSON is strict (no comments); audit metadata sits next to it |
| Parity verification | Vitest unit tests (calculations.test.ts) | — | Mirror Neocate VAL-01 pattern |
| A11y verification | Playwright + axe-core (e2e/fortification-a11y.spec.ts) | — | Existing 4-test sweep extended with Kendamil-selected variant |

## Standard Stack

### Core (already in project — no new deps)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | ^4.1.2 | Unit/component tests including parity tests | Already used; `toBeCloseTo` is the established epsilon helper |
| @playwright/test | ^1.58.2 | E2E + axe sweeps | Existing fortification-a11y spec runs here |
| @axe-core/playwright | (existing) | WCAG 2A/2AA scans within Playwright | Used in `e2e/fortification-a11y.spec.ts` |
| TypeScript | ^5.9.3 | Type-checked loader/types | `FortificationFormula` interface enforces shape |

### Supporting

No new dependencies. **All work is JSON edit + tests.**

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Strict JSON + .ts JSDoc | YAML/JSONC for inline comments | Would require a parser change; JSON is the existing source of truth and integrates cleanly with the type system. Rejected. |
| Per-variant `it()` blocks | Single `describe.each([...])` parameterized | Either is fine; existing tests use named `it()` blocks for documented cases. Mirror existing style for review symmetry. |
| Embedded audit metadata in types | Side `audit: { url, fetchedAt, region }` field on `FortificationFormula` | Bloats runtime data + types. JSDoc + PLAN.md is sufficient. |

**Installation:** None required.

## Architecture Patterns

### System Architecture Diagram (data flow for a Kendamil selection)

```
SelectPicker option "Kendamil Organic"
        │ (value = "kendamil-organic")
        ▼
fortificationState.current.formulaId = "kendamil-organic"
        │
        ▼
getFormulaById("kendamil-organic") ──► fortification-config.json
        │                                  │
        │ FortificationFormula              │ (3 new entries appended)
        ▼                                  ▼
calculateFortification({ formula, base, volumeMl, target, unit })
        │
        │ unit !== 'packets' && !(BM+tsp shortcut) → general CALC-02 branch
        ▼
{ amountToAdd, yieldMl, exactKcalPerOz, suggestedStartingVolumeMl }
        │
        ▼
FortificationResultCard (no changes)
```

The branch hit by the Kendamil parity tests (180 mL + breast-milk + 24 kcal/oz + scoops) is the **general CALC-02** path:
```
denom = ML_PER_OZ * cal − disp * targetKcalOz
grams = (volumeMl * (targetKcalOz − baseKcal)) / denom
amountToAdd = grams / formula.grams_per_scoop   // unit === 'scoops'
yieldMl = volumeMl + grams * disp
exactKcalPerOz = ((baseKcal*volumeMl)/ML_PER_OZ + grams*cal) / (yieldMl/ML_PER_OZ)
```
where `ML_PER_OZ = 29.57` and `BASE_KCAL['breast-milk'] = 20`.

### Recommended Project Structure

No new structure. The five touched files all live in `src/lib/fortification/` plus one Playwright spec in `e2e/`.

### Pattern 1: Manufacturer auto-grouping (existing)

```typescript
// FortificationInputs.svelte:83-86
const formulaOptions: SelectOption[] = getFortificationFormulas()
  .slice()
  .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.name.localeCompare(b.name))
  .map((f) => ({ value: f.id, label: f.name, group: f.manufacturer }));
```

### Pattern 2: Strict-JSON config with typed loader (existing)

```typescript
// fortification-config.ts
import config from './fortification-config.json';
const formulas: FortificationFormula[] = config.formulas;
export function getFortificationFormulas() { return formulas; }
export function getFormulaById(id: string) { return formulas.find((f) => f.id === id); }
export function formulaSupportsPackets(id: string) { return getFormulaById(id)?.packetsSupported === true; }
```

### Anti-Patterns to Avoid

- **Editing `calculations.ts`** — phase is data-only.
- **Adding `packetsSupported: false` explicitly** — every other non-HMF formula omits the field.
- **Inline JSON comments** — strict JSON; audit trail belongs in `.ts` JSDoc + PLAN.md.
- **Re-deriving Organic** — REQUIREMENTS KEND-01 already locks the values.
- **Silent fallback for missing reconstitution example** — D-04 forbids.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Manufacturer grouping in picker | Custom group-by reducer | Existing `localeCompare` sort + `group` field | Already works for 5 manufacturers |
| Default `packetsSupported: false` | Explicit field on every entry | Omit the field | 29/30 existing entries follow this pattern |
| Test-helper for parity math | Custom `expectFortificationParity()` | `toBeCloseTo(expected, 4)` directly | Existing tests use this pattern |
| Per-formula calculation branch | New conditional in `calculateFortification` | General CALC-02 path | Spreadsheet parity contract |
| Inline JSON comments | Move to JSONC parser | JSDoc in `.ts` loader | Strict JSON is the single source |

**Key insight:** This phase succeeds by **adding pure data** to a system whose code already supports the new entries.

## Per-Variant Data Block

> All three Kendamil USA HCP datasheets are version "v5 03.01.24" (Classic / Organic) and "v2 2023" (Goat). The mixing-physics columns (grams/scoop, displacement/scoop, displacement/g) are **identical across variants** — the only per-variant difference is `Calories per scoop`. PDFs were retrieved from `hcp.kendamil.com` Shopify CDN on 2026-04-24 (US English region; the documents are titled "USA").

### Kendamil Organic [VERIFIED — HCP US PDF]

- **Source URL:** https://hcp.kendamil.com/cdn/shop/files/Organic.pdf  *(linked from `/all-products/organic-infant-formula-28-2oz-0-12-months-usa/` and `/products/organic-first-infant-milk-800g`)*
- **Document title:** "Organic 28.2oz (0-12 months)" — Nutritional Profile + Mixing Instructions
- **Region:** US (USA-specific datasheet)
- **Fetch date (ISO):** 2026-04-24
- **Raw HCP values:**
  - Calories per scoop: **22 kcal**
  - Grams powder per level scoop: **4.3 g**
  - Displacement per scoop: **3.3 mL**
  - Displacement per gram of powder: **0.77 mL/g** (printed verbatim in HCP table)
  - Reconstitution: "1 fl oz + 1 scoop = The perfect 1:1 ratio. (1 level scoop = 4.3 g) Add 1 level scoop of powder to each 30 ml (1 fl. oz) of water."
  - Per 100 mL prepared (20 kcal/oz strength): 66 kcal / 100 mL
- **Derivation math:**
  - `calorie_concentration = 22 / 4.3 = 5.116279… → round to 2dp = 5.12 kcal/g`  *(matches REQUIREMENTS KEND-01)*
  - `displacement_factor` (from reconstitution example) `= ((30 + 3.3) − 30) / 4.3 = 3.3 / 4.3 = 0.767442…` mL/g
  - `displacement_factor` (HCP-printed value) `= 0.77` mL/g
  - **Recommendation:** use **`0.77`** to match REQUIREMENTS KEND-01, the HCP-printed column, and the existing config's 2dp convention.

### Kendamil Classic [VERIFIED — HCP US PDF]

- **Source URL:** https://hcp.kendamil.com/cdn/shop/files/Classic.pdf  *(linked from `/all-products/classic-infant-formula-28-2oz-0-12-months-usa/`)*
- **Document title:** "Classic 28.2oz (0-12 months)" — Nutritional Profile + Mixing Instructions
- **Region:** US (USA-specific datasheet)
- **Fetch date (ISO):** 2026-04-24
- **Raw HCP values:**
  - Calories per scoop: **22.4 kcal**
  - Grams powder per level scoop: **4.3 g**
  - Displacement per scoop: **3.3 mL**
  - Displacement per gram of powder: **0.77 mL/g**
  - Reconstitution: "1 fl oz + 1 scoop = The perfect 1:1 ratio. (1 level scoop = 4.3 g) Add 1 level scoop of powder to each 30 ml (1 fl. oz) of water."
  - Per 100 mL prepared (20 kcal/oz strength): 67 kcal / 100 mL
- **Derivation math:**
  - `calorie_concentration = 22.4 / 4.3 = 5.209302… → round to 2dp = 5.21 kcal/g`
  - `displacement_factor` (from reconstitution) `= 3.3 / 4.3 = 0.767442…` mL/g → printed/rounded **0.77** mL/g

### Kendamil Goat [VERIFIED — HCP US PDF]

- **Source URL:** https://hcp.kendamil.com/cdn/shop/files/Goat.pdf  *(linked from `/products/goat-first-infant-milk-28-2oz-0-12-months-usa/`)*
- **Document title:** "Goat First Infant Milk" — Nutritional Profile + Mixing Instructions (USA)
- **Region:** US (USA-specific datasheet — note: the public product page also surfaces UK/Ireland feeding guides; the PDF datasheet is US-formatted and aligns with FDA labeling per the document's "Each scoop adds about 0.1 fl oz" line)
- **Fetch date (ISO):** 2026-04-24
- **Raw HCP values:**
  - Calories per scoop: **21.9 kcal**
  - Grams powder per level scoop: **4.3 g**
  - Displacement per scoop: **3.3 mL**
  - Displacement per gram of powder: **0.77 mL/g**
  - Reconstitution: "1 fl oz + 1 scoop = The perfect 1:1 ratio. (1 level scoop = 4.3 g) Add 1 level scoop of powder to each 30 ml (1 fl. oz) of water."
  - Per 100 mL prepared (20 kcal/oz strength): 66 kcal / 100 mL
- **Derivation math:**
  - `calorie_concentration = 21.9 / 4.3 = 5.093023… → round to 2dp = 5.09 kcal/g`
  - `displacement_factor` (from reconstitution) `= 3.3 / 4.3 = 0.767442…` mL/g → printed/rounded **0.77** mL/g

### Cross-variant identity table (audit-friendly)

| Field | Organic | Classic | Goat | Notes |
|-------|---------|---------|------|-------|
| HCP Calories per scoop | 22 | 22.4 | 21.9 | The only varying mixing-chart number |
| HCP Grams per level scoop | 4.3 | 4.3 | 4.3 | Identical scoop |
| HCP Displacement per scoop, mL | 3.3 | 3.3 | 3.3 | Identical |
| HCP Displacement per gram of powder, mL | 0.77 | 0.77 | 0.77 | HCP-printed, all variants |
| Derived calorie_concentration (kcal/g) | 5.12 | 5.21 | 5.09 | `round(kcal/scoop / 4.3, 2)` |
| `displacement_factor` (config value) | 0.77 | 0.77 | 0.77 | Match HCP-printed + REQUIREMENTS KEND-01 |
| `grams_per_scoop` (config value) | 4.3 | 4.3 | 4.3 | Verbatim |

## Per-Variant Hand-Computed Parity Test Expected Values

> **Test inputs (per D-08, identical across variants):**
> ```
> base: 'breast-milk'   (BASE_KCAL = 20)
> volumeMl: 180
> targetKcalOz: 24
> unit: 'scoops'
> ```
> Constants: `ML_PER_OZ = 29.57` (calculations.ts:12). Branch hit: **general CALC-02** (no Packets, no BM+tsp shortcut since unit is 'scoops').
>
> Math:
> ```
> denom = ML_PER_OZ * cal − disp * 24
> grams = (180 * (24 − 20)) / denom = 720 / denom
> amountToAdd (scoops) = grams / 4.3
> yieldMl = 180 + grams * 0.77
> exactKcalPerOz = ((20 * 180) / 29.57 + grams * cal) / (yieldMl / 29.57)
> ```

### Kendamil Organic — expected values

- `cal = 5.12, disp = 0.77, gps = 4.3`
- `denom = 29.57 * 5.12 − 0.77 * 24 = 151.3984 − 18.48 = 132.9184`
- `grams = 720 / 132.9184 = 5.416857259792473`
- `amountToAdd = 5.416857259792473 / 4.3 = 1.2597342464633658`
- `yieldMl = 180 + 5.416857259792473 * 0.77 = 184.17098009004022`
- `exactKcalPerOz = 23.999999999999996` (effectively 24 — sanity check that math closes)

### Kendamil Classic — expected values

- `cal = 5.21, disp = 0.77, gps = 4.3`
- `denom = 29.57 * 5.21 − 0.77 * 24 = 154.0597 − 18.48 = 135.5797`
- `grams = 720 / 135.5797 = 5.310529526175379`
- `amountToAdd = 5.310529526175379 / 4.3 = 1.2350068665524137`
- `yieldMl = 180 + 5.310529526175379 * 0.77 = 184.08910773515504`
- `exactKcalPerOz = 24.000000000000004`

### Kendamil Goat — expected values

- `cal = 5.09, disp = 0.77, gps = 4.3`
- `denom = 29.57 * 5.09 − 0.77 * 24 = 150.5113 − 18.48 = 132.0313`
- `grams = 720 / 132.0313 = 5.453252372732829`
- `amountToAdd = 5.453252372732829 / 4.3 = 1.268198226216937`
- `yieldMl = 180 + 5.453252372732829 * 0.77 = 184.19900432700427`
- `exactKcalPerOz = 24.000000000000004`

### Recommended assertion shape (mirrors `calculations.test.ts:103-117` exactly)

```typescript
describe('calculateFortification — Kendamil Organic parity (KEND-TEST-01)', () => {
  it('Kendamil Organic + breast milk + 180 + 24 + scoops', () => {
    // disp=0.77, cal=5.12, gps=4.3
    // denom = 29.57 * 5.12 - 0.77 * 24 = 132.9184
    // grams = (180 * 4) / 132.9184 = 5.416857259792473
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
});
```

Three near-identical blocks (one per variant). The only delta is the `expect(...).toBeCloseTo(<expected>, 4)` literal and the formula constant + comment header.

**Note on `toBeCloseTo` precision:** `toBeCloseTo(value, 4)` checks `|actual − expected| < 5e-5`. The 1% epsilon required by D-09 / KEND-TEST-01 is far looser (1.26 * 0.01 = 0.0126), so 4-digit precision is well within tolerance and matches Neocate VAL-01.

## Per-Variant Draft JSON Objects (ready to splice)

> Splice these three objects into `fortification-config.json` `formulas` array. Insertion point is **alphabetical-by-id** consistent with the existing file (id `kendamil-*` lands between `gerber-good-start-gentle` (`g…`) and `neocate-infant` (`n…`)). Place them as a contiguous block to keep the diff scannable.

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
}
```

Notes:
- **Order:** alphabetical-by-id (Classic → Goat → Organic) matches the alphabetical-by-name SelectPicker sort, so the JSON file order, the picker's group ordering, and the test assertions all line up.
- **No `packetsSupported`:** D-12. The interface (`packetsSupported?: boolean`) treats omission as `false`. `formulaSupportsPackets` checks `=== true`.
- **`manufacturer: "Kendamil"`:** plain ASCII, no diacritics — sorts cleanly via `localeCompare` between `Abbott` and `Mead Johnson`.
- **Insertion point:** must be inserted with surrounding commas correct — the previous and following objects in the array end with `}` and `}` respectively. Place between the existing `g…`-id entries and `n…`-id entries (e.g., after `gerber-good-start-gentle` and before `neocate-infant`).

## Existing-Pattern Excerpts (concrete code to mirror)

### A. Neocate VAL-01 canonical block — mirror for all three Kendamil tests

```typescript
// src/lib/fortification/calculations.test.ts:11-25
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

### B. General-formula scoops parity (closest analog) — mirror exactly

```typescript
// src/lib/fortification/calculations.test.ts:103-117
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

This is the **canonical pattern Kendamil tests should mirror**: scoops + breast-milk + 180 + 24, hand-computed expectation, `toBeCloseTo(..., 4)`, plus `yieldMl > 180`, finite-kcal, and `SUGGESTED_RE` assertions.

### C. Existing imports + helpers at top of `calculations.test.ts`

```typescript
// src/lib/fortification/calculations.test.ts:1-9
import { describe, it, expect } from 'vitest';
import { calculateFortification } from './calculations.js';
import { getFormulaById } from './fortification-config.js';
import type { FortificationFormula } from './types.js';

const neocate = getFormulaById('neocate-infant') as FortificationFormula;
const hmf = getFormulaById('similac-hmf') as FortificationFormula;

const SUGGESTED_RE = /^\d+ \(\d+(\.\d+)? oz\)$/;
```

The Kendamil tests must add three constants beneath these:
```typescript
const kendamilOrganic = getFormulaById('kendamil-organic') as FortificationFormula;
const kendamilClassic = getFormulaById('kendamil-classic') as FortificationFormula;
const kendamilGoat    = getFormulaById('kendamil-goat')    as FortificationFormula;
```

### D. Count assertion + xlsx rationale comment to update

```typescript
// src/lib/fortification/fortification-config.test.ts:14-18 (BEFORE)
const formulas = getFortificationFormulas();

it('contains exactly 30 formulas (xlsx Calculator A3:D35 row count)', () => {
  expect(formulas).toHaveLength(30);
});
```

**Required change (D-11) — replacement:**
```typescript
const formulas = getFortificationFormulas();

it('contains exactly 33 formulas (30 from xlsx Calculator A3:D35 + 3 Kendamil HCP)', () => {
  // 30 entries transcribe recipe-calculator.xlsx Calculator tab A3:D35.
  // 3 Kendamil entries (Organic, Classic, Goat) extend beyond xlsx —
  // sourced from hcp.kendamil.com per Phase 44 PLAN.md audit trail.
  expect(formulas).toHaveLength(33);
});
```

### E. REQUIRED_KEYS shape loop — extend with KEND-TEST-02 grouping assertions

```typescript
// src/lib/fortification/fortification-config.test.ts:4-11 (existing)
const REQUIRED_KEYS = [
  'id',
  'name',
  'manufacturer',
  'displacement_factor',
  'calorie_concentration',
  'grams_per_scoop'
] as const;
```

**Suggested KEND-TEST-02 addition** — new `describe` block at the bottom of the file (or extend the existing `getFormulaById` block):

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

This satisfies KEND-TEST-02 (grouping renders), KEND-04 (manufacturer grouping), KEND-05 (packets default-false), and provides id-resolution coverage for KEND-01/02/03.

## JSDoc Audit-Comment Recommended Shape

**Recommendation:** **Single header block** at the top of `fortification-config.ts`, sections per variant. Rationale:
- The loader file is short (19 lines) and the JSDoc lives well above the code where it's discoverable on file open.
- `getFormulaById` is generic — there is no per-variant call site to attach inline comments to.
- Co-locating the three audit pointers keeps them visually scannable as a unit.

**Draft (URLs/region/date filled per §Per-Variant Data Block):**

```typescript
/**
 * Fortification formula loader.
 *
 * The 30 formulas indexed alphabetically transcribe rows A3:D35 of
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
import config from './fortification-config.json';
// ... rest of file unchanged
```

## Playwright Axe-Spec Extension Approach

### Existing spec inventory (`e2e/fortification-a11y.spec.ts`)

The current spec has **4 tests**, all running against the default Neocate Infant selection:

1. light mode, default state → no violations
2. dark mode, default state → no violations
3. light mode + results visible → no violations
4. dark mode + results visible → no violations

### Recommended approach: 2 new tests (one per theme), Kendamil Organic selected

A standalone fixture or full duplicate would inflate the spec. KEND-TEST-03 says "with a Kendamil variant selected"; one variant is sufficient — the manufacturer-group label is the new contrast surface and renders identically for all three variants.

**Sketch (append inside the existing `test.describe` block, after the existing 4 tests):**

```typescript
async function selectFormulaByName(page, label: string) {
  // FortificationInputs renders the formula select with an accessible label "Formula".
  // SelectPicker uses native <select> or ARIA combobox — confirm against
  // existing e2e/formula.spec.ts before locking the selector.
  await page.getByLabel('Formula').click();
  await page.getByRole('option', { name: label }).click();
  await expect(page.getByText('Amount to Add')).toBeVisible();
}

for (const theme of ['light', 'dark'] as const) {
  test(`fortification page has no axe violations with Kendamil Organic selected (${theme})`, async ({ page }) => {
    await page.evaluate((t) => {
      document.documentElement.classList.add('no-transition');
      document.documentElement.classList.toggle('dark', t === 'dark');
      document.documentElement.classList.toggle('light', t === 'light');
      document.documentElement.setAttribute('data-theme', t);
    }, theme);
    if (theme === 'dark') await page.waitForTimeout(250);

    await selectFormulaByName(page, 'Kendamil Organic');

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}
```

### Selector verification needed at plan time

The exact "open formula picker + click option" pattern depends on the SelectPicker component's underlying control. Before locking the selectors, the planner must read `e2e/formula.spec.ts` (which already exercises the formula calculator) to confirm the prior-art pattern. Likely candidates:
- Native `<select>`: `page.getByLabel('Formula').selectOption({ label: 'Kendamil Organic' })`
- ARIA combobox: `page.getByRole('combobox', { name: 'Formula' })` → click → `page.getByRole('option', { name })`

If `e2e/formula.spec.ts` does not exercise the formula picker via selection, the planner should fall back to inspecting `FortificationInputs.svelte` and the SelectPicker component directly.

**Why one Kendamil variant suffices:** the new contrast surface is the **"Kendamil" group label** in the picker dropdown. That label is identical for all three variants. Picking Organic exercises the new label without 3× duplication.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| xlsx-only formulas (30 rows from `recipe-calculator.xlsx`) | xlsx + HCP-sourced Kendamil family | Phase 44 (this) | Future contributors must not try to reconcile Kendamil entries against the xlsx. The `fortification-config.ts` JSDoc + the updated count-test comment establish the divergence. |

**Deprecated/outdated:**
- The literal `expect(formulas).toHaveLength(30)` and its xlsx-rationale comment are replaced — leaving the old comment after a count bump would mislead future readers.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `getByLabel('Formula') + getByRole('option', { name })` is the right Playwright selector for the SelectPicker | §Playwright axe-spec extension | Test fails to find the picker; planner verifies against existing E2E selector pattern in `e2e/formula.spec.ts` |
| A2 | One Kendamil variant (Organic) in the axe sweep covers the new contrast surface | §Playwright axe-spec extension | Low — the only new contrast is the manufacturer-group label, identical across variants |
| A3 | The Kendamil "Goat First Infant Milk" USA datasheet (downloaded as `Goat.pdf` from the Shopify CDN) reflects the US-marketed product, not the UK version | §Per-Variant Data Block · Goat | Public product page shows UK feeding-guide table; PDF datasheet uses "fl oz" labelling and the v5 USA-template style → strong indication this is the US datasheet, but planner should confirm by spot-checking against the printed canister at HCP-availability time |
| A4 | Kendamil's "Displacement per gram of powder, mL = 0.77" (HCP-printed, 2dp) is appropriate as the literal `displacement_factor` value | §Cross-variant identity table | Low — both the printed value and the derivation `3.3/4.3 = 0.7674…` round to `0.77` at 2dp; matches existing config style and REQUIREMENTS KEND-01 |

**No claims tagged `[ASSUMED]` for variant numerical data — all per-variant kcal/scoop, grams/scoop, displacement values are `[VERIFIED]` from the HCP US PDFs retrieved 2026-04-24.**

## Open Questions

1. **Is the Goat US PDF (`Goat.pdf` on `cdn.shopify.com/.../files/Goat.pdf`) authoritative for the US-marketed Kendamil Goat infant formula?**
   - The PDF is reachable from the US product page but the public Goat product page shows UK/Ireland feeding guides. The PDF itself uses USA-template formatting matching the v5 Classic/Organic datasheets. Probable answer: yes, but a planner-time spot-check against the can-back panel would be ideal.
2. **Does the SelectPicker open mechanism use `getByLabel` or a custom combobox button trigger?**
   - Resolvable at plan time by reading `e2e/formula.spec.ts` for prior-art selector patterns.
3. **Should REQUIREMENTS KEND-01 retain the `≈` prefix on the locked Organic values, or be tightened to exact `0.77 / 5.12 / 4.3`?**
   - The HCP-confirmed values match the rounded form exactly — REQUIREMENTS can be tightened, but this is editorial and outside Phase 44 scope.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Vitest | Parity tests | Yes | ^4.1.2 (per CLAUDE.md) | — |
| Playwright | Axe sweep extension | Yes | ^1.58.2 | — |
| @axe-core/playwright | Axe sweep | Yes | (pre-existing in fortification-a11y spec) | — |
| Internet access for hcp.kendamil.com | Research-step HCP fetch | Yes (this session) | — | N/A — research complete; data captured |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

> Phase has nyquist_validation enabled (default — no explicit `false` in `.planning/config.json`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.2 (unit) + Playwright ^1.58.2 (E2E + axe) |
| Config file | `vitest.config.ts` / `vite.config.ts`; `playwright.config.ts` |
| Quick run command | `pnpm vitest run src/lib/fortification` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KEND-01 | Kendamil Organic resolvable + correct shape | unit | `pnpm vitest run src/lib/fortification/fortification-config.test.ts` | extends existing |
| KEND-02 | Kendamil Classic resolvable + correct shape | unit | (same) | extends existing |
| KEND-03 | Kendamil Goat resolvable + correct shape | unit | (same) | extends existing |
| KEND-04 | Three entries grouped under Kendamil | unit | (same) — see §E grouping describe | extends existing |
| KEND-05 | `packetsSupported` omitted (defaults false) | unit | (same) — `expect(f.packetsSupported).toBeUndefined()` loop | extends existing |
| KEND-TEST-01 | Parity calculation per variant | unit | `pnpm vitest run src/lib/fortification/calculations.test.ts` | extends existing |
| KEND-TEST-02 | Grouping assertion | unit | `pnpm vitest run src/lib/fortification/fortification-config.test.ts` | extends existing |
| KEND-TEST-03 | Axe sweep with Kendamil selected (light + dark) | e2e | `pnpm playwright test e2e/fortification-a11y.spec.ts` | extends existing |

### Sampling Rate

- **Per task commit:** `pnpm vitest run src/lib/fortification`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green + `pnpm svelte-check` 0/0 + `pnpm build` green before `/gsd-verify-work`

### Wave 0 Gaps

- None. All target test files already exist and are extended in place:
  - `src/lib/fortification/fortification-config.test.ts`
  - `src/lib/fortification/calculations.test.ts`
  - `e2e/fortification-a11y.spec.ts`
  - `src/lib/fortification/fortification-config.ts` (JSDoc add; not a new file)

## Security Domain

Phase is a clinical-data extension; no auth/session/access-control surface added. ASVS V5 (Input Validation) is the only relevant category — and it is unchanged because the data shape is enforced by the existing `FortificationFormula` interface and the existing `fortification-config.test.ts` shape loop (REQUIRED_KEYS).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | TypeScript `FortificationFormula` interface + existing shape-test loop validates new entries automatically |
| V6 Cryptography | no | — |

### Known Threat Patterns for clinical-data JSON

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Wrong clinical value (transcription error from HCP page) | Tampering (data integrity) | Hand-derived math in PLAN.md + parity tests + JSDoc audit pointer to source URL — required by D-13/D-14 |
| Dependency on remote HCP page that may change/disappear | Information Disclosure (audit) | ISO fetch date captured per D-14; values are then static in JSON |
| Stale audit (HCP updates spec) | Tampering | Future "audit refresh" deferred per CONTEXT.md (sidecar `SOURCES.md` registry) |

## Common Pitfalls

### Pitfall 1: Re-deriving Organic from HCP and locking a different decimal than REQUIREMENTS KEND-01

**What goes wrong:** REQUIREMENTS KEND-01 locks `≈ 5.12 / ≈ 0.77 / 4.3`. HCP-derivation lands on the same values at 2dp.
**How to avoid:** Use exactly `5.12`, `0.77`, `4.3` for Organic (matches REQUIREMENTS, HCP-printed, and 2dp rounding of all three constants). Do not lock `5.116279` or `0.767442`.
**Warning signs:** Vitest "Neocate VAL-01"-style precision mismatch when the parity expectation was computed with one rounding but the JSON literal uses another.

### Pitfall 2: Picking a non-canonical reconstitution example

**What goes wrong:** None — the HCP "1 scoop in 30 mL" example is the canonical row and matches the cumulative table in §Per-Variant Data Block (8 scoops in 8 fl oz adds 34.4 g, displaces 26.4 mL, total ≈ 270 mL, identical ratios).
**How to avoid:** Use the 1-scoop-in-30-mL row (cleanest) and document in PLAN.md.
**Warning signs:** None — Kendamil's chart is internally consistent.

### Pitfall 3: Forgetting to update `fortification-config.test.ts:17` literal

**What goes wrong:** Adding 3 entries causes the existing `toHaveLength(30)` assertion to fail.
**How to avoid:** Bump to 33 in the same commit and update the comment (D-11).
**Warning signs:** Vitest red on the count assertion at PR open.

### Pitfall 4: SelectPicker selector drift

**What goes wrong:** Playwright extension uses a label that doesn't match the rendered SelectPicker.
**How to avoid:** Read `e2e/formula.spec.ts` first; mirror that selector pattern.
**Warning signs:** New axe test times out at the picker-open step.

### Pitfall 5: Adding `packetsSupported: false` explicitly

**What goes wrong:** Pattern-divergence with the other 29 non-HMF entries.
**How to avoid:** Per D-12, omit the field.

### Pitfall 6: Mis-parsing the HCP `Calories per scoop` column

**What goes wrong:** The PDF prints `22` for Organic, `22.4` for Classic, `21.9` for Goat. A grep that catches the wrong line could yield "20" (which is the kcal/oz column header) or "100" (per-100kcal).
**How to avoid:** Always derive `calorie_concentration = kcal_per_scoop / grams_per_scoop` and cross-check against the `Per 100ml` energy column in the nutritional table — it should round to ~66 kcal / 100 mL at the 20 kcal/oz strength (matching the HCP nutrient table).
**Warning signs:** A Kendamil parity test gives a wildly different `amountToAdd` than `~1.25 scoops` for 180 mL @ 24 kcal/oz → check `calorie_concentration` first.

## Code Examples

### Existing JSON entry shape (no `packetsSupported`)

```json
{
  "id": "neocate-infant",
  "name": "Neocate Infant",
  "manufacturer": "Nutricia",
  "displacement_factor": 0.7,
  "calorie_concentration": 4.83,
  "grams_per_scoop": 4.6
}
```

The Kendamil entries use the same shape, with `manufacturer: "Kendamil"`. (Full draft objects in §Per-Variant Draft JSON Objects.)

### Existing Playwright theme-toggle pattern

(See §Playwright Axe-Spec Extension Approach — copies the existing `document.documentElement.classList.toggle(...)` pattern.)

## Risks / Unknowns / Blockers

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| HCP PDF URL changes (Shopify CDN re-key) | Medium-long-term | Audit URL becomes 404 | ISO fetch date captured per D-14; JSDoc URL is informational. Defer audit-refresh tooling per CONTEXT.md. |
| US vs UK SKU values differ for Goat | Low | Audit ambiguity | The `Goat.pdf` matches the v5-USA template style; planner can spot-check the can-back at any time. Not a blocker. |
| SelectPicker selector mismatch in axe spec | Low | Test red at runtime | Planner confirms against `e2e/formula.spec.ts` |
| `displacement_factor 0.77` collision with derivation `0.7674` | None — by design | — | Use HCP-printed `0.77`; matches REQUIREMENTS, existing config 2dp style, and is within 0.5% of the derived value (well under 1% epsilon) |

## Sources

### Primary (HIGH confidence)

**Codebase (verified by direct read this session):**
- `src/lib/fortification/calculations.ts` (lines 1-187) — pure-function CALC-02 path
- `src/lib/fortification/fortification-config.ts` (lines 1-19) — loader
- `src/lib/fortification/fortification-config.json` (248 lines) — current 30-formula schema
- `src/lib/fortification/types.ts` (lines 1-42) — `FortificationFormula` interface
- `src/lib/fortification/fortification-config.test.ts` (lines 1-80) — REQUIRED_KEYS + count assertion
- `src/lib/fortification/calculations.test.ts` (lines 1-153) — Neocate VAL-01, HMF-scoops, BM+tsp shortcut patterns
- `src/lib/fortification/FortificationInputs.svelte:83-86` — manufacturer auto-grouping
- `e2e/fortification-a11y.spec.ts` (lines 1-92) — existing 4-test axe sweep
- `.planning/phases/44-kendamil-formula-family/44-CONTEXT.md` — locked decisions D-01..D-14
- `.planning/REQUIREMENTS.md` §"Kendamil Formula Family" — KEND-01..KEND-05, KEND-TEST-01..03

**Manufacturer HCP datasheets (verified by PDF text-extraction this session 2026-04-24):**
- [Kendamil Organic USA Nutritional Profile + Mixing Instructions (PDF, v5 03.01.24)](https://hcp.kendamil.com/cdn/shop/files/Organic.pdf)
- [Kendamil Classic USA Nutritional Profile + Mixing Instructions (PDF, v5 03.01.24)](https://hcp.kendamil.com/cdn/shop/files/Classic.pdf)
- [Kendamil Goat USA Nutritional Profile + Mixing Instructions (PDF)](https://hcp.kendamil.com/cdn/shop/files/Goat.pdf)
- [Kendamil USA Mixing Instructions blog post (master index)](https://hcp.kendamil.com/blogs/news/usa-kendamil-mixing-instructions-classic-organic-goat)

### Secondary (MEDIUM confidence)
- [Organic Infant Formula USA product page (HCP)](https://hcp.kendamil.com/all-products/organic-infant-formula-28-2oz-0-12-months-usa/) — corroborates 4.3 g scoop + 30 mL water reconstitution
- [Goat First Infant Milk USA product page (HCP)](https://hcp.kendamil.com/products/goat-first-infant-milk-28-2oz-0-12-months-usa/) — corroborates 4.3 g scoop + 30 mL water + "Each scoop adds about 0.1 fl oz (4.3) to prepared formula"

### Tertiary (LOW confidence)
- None used for clinical numbers. All variant data was sourced from the HCP US PDFs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps, all from CLAUDE.md
- Architecture: HIGH — no architectural change; data-only edit
- Pitfalls: HIGH — codified by D-01..D-14 + verified against codebase
- HCP per-variant data: HIGH — values verified from US PDFs, math closes (`exactKcalPerOz` ≈ 24 to 14 decimal places for all three)

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (HCP page contents change rarely; manufacturer mixing charts are stable; codebase is static within the phase)

## RESEARCH COMPLETE

**Phase:** 44 - kendamil-formula-family
**Confidence:** HIGH

### Key Findings
- All three Kendamil variants share **identical reconstitution physics**: 4.3 g/scoop, 3.3 mL displacement per scoop, 0.77 mL/g (HCP-printed) — the only per-variant difference is **kcal-per-scoop** (Organic 22 / Classic 22.4 / Goat 21.9), producing `calorie_concentration` of 5.12 / 5.21 / 5.09 kcal/g respectively.
- HCP PDFs were retrieved cleanly via Shopify CDN (`hcp.kendamil.com/cdn/shop/files/{Organic,Classic,Goat}.pdf`) — no login wall, no Cloudflare block on the CDN host. The `wp-content/uploads/...` URLs surfaced by web search were 400'd by Cloudflare (legacy WordPress paths from the pre-Shopify HCP site) — note for future research: prefer `cdn.shopify.com/.../files/*.pdf` URLs on Shopify-hosted sites.
- Hand-computed parity-test expected values close to within 1e-14 on `exactKcalPerOz ≈ 24` for all three variants — math confirmed sound.
- Zero code changes required outside the 4 declared test/config files + 1 Playwright spec extension. The auto-grouping mechanism at `FortificationInputs.svelte:83-86` handles SelectPicker rendering without any UI edits.
- One assumption (A3) flagged: the Goat USA PDF's authoritative status for the US-marketed product is strong-but-not-certain; planner can confirm at any time by spot-checking the canister, but the values are internally consistent with the v5-USA template used by Classic/Organic.

### File Created
`.planning/phases/44-kendamil-formula-family/44-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | No new deps; all from existing project |
| Architecture | HIGH | Data-only edit; existing systems handle everything |
| Pitfalls | HIGH | D-01..D-14 codify approach; verified against codebase |
| HCP per-variant data | HIGH | Values verified from US PDFs; math closes to 1e-14 |
| Parity-test expected values | HIGH | Hand-computed via exact CALC-02 path; matches `exactKcalPerOz = 24.0000…` |
| Playwright selector | MEDIUM | A1 — needs planner-time confirmation against `e2e/formula.spec.ts` |

### Open Questions (non-blocking)
1. SelectPicker open-mechanism selector pattern — resolvable at plan time by reading `e2e/formula.spec.ts`.
2. Goat USA PDF authoritative-for-US-product confirmation — strong but spot-check welcome.
3. Whether REQUIREMENTS KEND-01 should drop the `≈` prefix to lock exact `0.77 / 5.12 / 4.3` — editorial, not blocking.

### Ready for Planning
Research complete. All three Kendamil variants have:
- Verified raw HCP values + URLs + ISO fetch dates
- Step-by-step displacement & calorie-concentration derivation math
- Hand-computed parity-test expected values (with full math chain)
- Ready-to-splice JSON objects
- Concrete code-pattern excerpts for the planner to mirror
- JSDoc audit-block draft
- Playwright axe extension sketch

The planner can now produce concrete, executable plans for Phase 44.
