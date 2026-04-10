# Phase 37: Pure Logic + Config + Parity Tests - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** auto (all decisions are recommended defaults — review before planning if needed)

<domain>
## Phase Boundary

Implement all Feed Advance calculation functions (bedside advancement from Sheet2, full nutrition from Sheet1), the `feeds-config.json` configuration, TypeScript types, and comprehensive parity tests — all locked to `nutrition-calculator.xlsx`. This is the clinical correctness gate before any UI work in Phase 38.

**Not in scope:** UI components, state management (`state.svelte.ts`), route wiring, Svelte components, Playwright E2E, or a11y sweeps — those are Phase 38.

</domain>

<decisions>
## Implementation Decisions

### Fixture Extraction Strategy
- **D-01:** Manually extract canonical rows from `nutrition-calculator.xlsx` Sheet1 and Sheet2 into `src/lib/feeds/feeds-parity.fixtures.json` with documented cell references. Follow the GIR precedent (`gir-parity.fixtures.json`): structured JSON with `input` and `expected` sections, one fixture per sheet. Hand-verified values, not programmatic extraction.
- **D-02:** Sheet2 canonical fixture uses weight 1.94 kg (per CORE-09 / TEST-02), default frequency, default cadence. Sheet1 canonical fixture uses weight 1.74 kg (per FULL-07 / TEST-01), defaults from xlsx.

### Dual-Line TPN Dextrose Modeling
- **D-03:** Full Nutrition state uses explicit paired fields: `tpnDex1Pct`/`tpnMl1Hr` and `tpnDex2Pct`/`tpnMl2Hr` — not an array, not a single field. This matches the spreadsheet's two-line layout and the FULL-04 formula `Σ((dex_i%/100 × ml_i) × 3.4)`. The ARCHITECTURE.md §4 state shape (`tpnDexPct`/`tpnMlHr` single fields) needs updating to reflect two lines.
- **D-04:** `calculateFullNutrition()` accepts both dex/ml pairs and sums their kcal contributions: `((dex1%/100 × ml1) + (dex2%/100 × ml2)) × 3.4`.

### Advance Cadence Formula
- **D-05:** Cadence options map to `advance_events_per_day` via config lookup in `feeds-config.json`:
  - `every` → `feeds_per_day` (frequency-relative: 6 for q4h, 8 for q3h)
  - `every-other` → `feeds_per_day / 2`
  - `every-3rd` → `feeds_per_day / 3`
  - `bid` → 2 (absolute)
  - `qd` → 1 (absolute)
- **D-06:** The advance-step formula is `weight × advance_ml_kg_d / feeds_per_day / advance_events_per_day` (per FREQ-04). The cadence config stores whether the value is frequency-relative or absolute so the calculation function can resolve correctly.

### Advisory Thresholds
- **D-07:** Advisory thresholds live in `feeds-config.json` under an `advisories` array. Each entry: `{ "id": string, "field": string, "comparator": "gt" | "lt" | "range", "value": number | [min, max], "message": string, "mode": "bedside" | "full-nutrition" | "both" }`.
- **D-08:** Initial advisories (from SAFE-06 requirements):
  - Trophic > advance ml/kg/d (bedside mode) — warning, not blocking
  - Dextrose > 12.5% on either TPN line (full-nutrition mode) — warning
  - Total kcal/kg/d outside expected range (full-nutrition mode) — warning
- **D-09:** Advisory checking is a pure function that takes calculation results + config thresholds and returns an array of triggered advisories. It does NOT block input — consistent with the existing `showRangeHint` blur-gated pattern (v1.6).

### Unit Constants
- **D-10:** Named constants with JSDoc (per FULL-06):
  - `DEXTROSE_KCAL_PER_GRAM = 3.4` — kcal/g dextrose
  - `LIPID_KCAL_PER_ML = 2` — kcal/ml for SMOF/IL
  - `ML_PER_OZ = 30` — ml per fluid ounce (enteral conversion)
  - `HOURS_PER_DAY = 24` — for ml/hr ↔ ml/day conversions

### Trophic Frequency Options
- **D-11:** Two trophic frequency options: `q4h` (6 feeds/day) and `q3h` (8 feeds/day). Stored in `feeds-config.json` as dropdown options with `id`, `label`, and `feedsPerDay` numeric value.

### Config Shape
- **D-12:** `feeds-config.json` structure follows GIR precedent (`gir-config.json`):
  - `defaults` — default values for all inputs
  - `inputs` — `{ min, max, step }` ranges for each numeric input
  - `dropdowns` — frequency and cadence option lists with numeric mappings
  - `advisories` — threshold entries (D-07)
- **D-13:** `feeds-config.ts` typed wrapper mirrors `gir-config.ts` — imports JSON, exports typed accessors.

### Test Strategy
- **D-14:** Parity tests (TEST-01, TEST-02): row-by-row comparison against fixture values with ~1% epsilon (`Math.abs(actual - expected) / expected < 0.01`). Same tolerance as GIR parity tests.
- **D-15:** Parameter-matrix tests (TEST-03): every frequency × cadence combination, testing internal formula consistency (not xlsx-locked). Verify: changing frequency changes feeds_per_day, changing cadence changes advance_events_per_day, output changes proportionally.
- **D-16:** Config shape tests (TEST-04): validate all input ranges have min < max, all dropdown options have valid IDs, all advisories have required fields.

### Claude's Discretion
- Exact file internal organization (import order, function order within `calculations.ts`)
- Whether to split bedside and full-nutrition calculations into separate exported functions or keep as one function with mode parameter — follow whichever is cleaner
- Epsilon comparison helper: inline or extracted utility
- Whether `feeds-config.test.ts` uses snapshot testing or explicit assertions — follow GIR pattern

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source of Truth
- `nutrition-calculator.xlsx` — Sheet1 (TPN full nutrition) + Sheet2 (bedside feeding advancement). THE authoritative reference for all calculation parity.

### GIR Pattern (structural template)
- `src/lib/gir/calculations.ts` — Pure function pattern with JSDoc, weight-in-signature convention
- `src/lib/gir/calculations.test.ts` — Parity test structure with epsilon comparison
- `src/lib/gir/types.ts` — Type definitions pattern (state data, input ranges, result interfaces)
- `src/lib/gir/gir-config.json` — Config shape pattern (defaults, inputs, domain-specific data)
- `src/lib/gir/gir-config.ts` — Typed config wrapper pattern
- `src/lib/gir/gir-config.test.ts` — Config shape test pattern
- `src/lib/gir/gir-parity.fixtures.json` — Fixture file pattern (input + expected sections)

### Research
- `.planning/research/ARCHITECTURE.md` — §3 (data flow), §4 (state shape — needs two-line TPN update), §5 (build order)
- `.planning/research/FEATURES.md` — Full requirement details
- `.planning/research/PITFALLS.md` — Relevant pitfalls for calculation layer

### Requirements
- `.planning/REQUIREMENTS.md` — CORE-09, FREQ-04, FULL-04–07, SAFE-06, TEST-01–04

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- GIR module (`src/lib/gir/`) — complete structural template for types, config, calculations, fixtures, and tests
- `NumericInputRange` type from `src/lib/shared/types.ts` — reusable for feeds input range definitions
- Epsilon comparison pattern from `gir-parity` tests

### Established Patterns
- Pure functions with JSDoc derivation comments (see `calculateCurrentGir`)
- Void unused parameters kept for clinical clarity (`void weightKg`)
- Config as JSON + typed TS wrapper
- Fixture files as JSON with `input` + `expected` structure
- Test co-location: `calculations.test.ts` next to `calculations.ts`

### Integration Points
- `src/lib/feeds/` directory — to be created (Phase 36 created the route but not the lib module)
- Phase 38 will import `calculations.ts` functions into the Svelte component

</code_context>

<specifics>
## Specific Ideas

- The ARCHITECTURE.md state shape (§4) shows single `tpnDexPct`/`tpnMlHr` fields, but FULL-04's summation formula requires two lines. D-03 resolves this: use explicit `tpnDex1Pct`/`tpnMl1Hr`/`tpnDex2Pct`/`tpnMl2Hr` pairs. The state shape in ARCHITECTURE.md should be treated as draft — the types defined here in Phase 37 are authoritative.
- The advance cadence has a subtle distinction: `every`/`every-other`/`every-3rd` are frequency-RELATIVE (depend on feeds_per_day), while `bid`/`qd` are ABSOLUTE (2 and 1 regardless of frequency). This must be clearly modeled in config and calculation.
- Follow the GIR discipline of exact mathematical derivation in JSDoc, even when the spreadsheet uses truncated constants. Tests use ~1% epsilon to reconcile.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 37-pure-logic-config-parity-tests*
*Context gathered: 2026-04-09*
