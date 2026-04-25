# Phase 44: Kendamil Formula Family - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Add three Kendamil infant-formula entries (Organic, Classic, Goat) to `src/lib/fortification/fortification-config.json` under a "Kendamil" manufacturer grouping. JSON-only data change plus parity tests, SelectPicker grouping test, and re-run axe sweeps. Zero NavShell, registry, UI-component, or DESIGN.md changes — the fortification UI consumes the new entries through the existing manufacturer-grouped picker.

NICU context: only **infant** Kendamil variants. No HMF / fortifier / toddler / follow-on variants in scope.

</domain>

<decisions>
## Implementation Decisions

### Spec Sourcing

- **D-01:** Researcher (gsd-phase-researcher) fetches `hcp.kendamil.com` for the Classic and Goat variants during the research step. Organic spec values are already locked in REQUIREMENTS KEND-01 (calorie_concentration ≈ 5.12 kcal/g, displacement_factor ≈ 0.77 mL/g, grams_per_scoop 4.3) — researcher confirms but does not re-derive.
- **D-02:** Region preference: try the US Kendamil HCP site first (product is sold/imported in the US). Fall back to the UK Kendamil HCP site if the US site is incomplete. If both regions list the same SKU with matching mixing chart values, capture both URLs.
- **D-03:** Displacement factor is **derived from the published reconstitution ratio** per variant: `displacement_factor = (final_volume_mL − water_mL) / scoop_grams` using the standard reconstitution example on each HCP mixing chart. The math is documented step-by-step in PLAN.md per variant. No fallback to Organic's 0.77 — every variant gets its own derived value.
- **D-04:** If the HCP page does not expose enough data to compute displacement (no reconstitution example), the researcher pauses and surfaces this in the research output for user input — does **not** silently fall back.

### ID & Label Naming

- **D-05:** IDs use the **bare-variant** convention: `kendamil-organic`, `kendamil-classic`, `kendamil-goat`. NICU audience is infants-only; no need to disambiguate against future toddler/follow-on variants.
- **D-06:** SelectPicker `name` field uses the short manufacturer-and-line label: `"Kendamil Organic"`, `"Kendamil Classic"`, `"Kendamil Goat"`. Matches existing pattern (`Similac Advance`, `Enfamil NeuroPro`).
- **D-07:** `manufacturer` field is plain `"Kendamil"` — matches existing manufacturer pattern (`Abbott`, `Nestlé`, `Mead Johnson`, `Nutricia`). SelectPicker auto-sorts via `localeCompare`; the group will land alphabetically between Abbott and Mead Johnson (`A < K < M`).

### Parity Tests (KEND-TEST-01)

- **D-08:** Test shape is **mirror-the-Neocate-canonical** for all three variants: 180 mL + breast-milk base + 24 kcal/oz target + **scoops** unit. Hand-compute expected scoops per variant from the published spec via the general CALC-02 formula (no Packets / BM-tsp shortcut applies since no Kendamil variant supports packets and target is 24 kcal/oz with scoops). Symmetric and reviewable across the three variants.
- **D-09:** Each parity test asserts `amountToAdd` to within the existing 1% epsilon used elsewhere in `calculations.test.ts` (using `toBeCloseTo` with the established precision). Also assert `yieldMl > 180` and `Number.isFinite(exactKcalPerOz)` like other parity tests.

### Grouping Test (KEND-TEST-02)

- **D-10:** Grouping test lives in `src/lib/fortification/fortification-config.test.ts` (data-shape level), not in `FortificationInputs.test.ts`. Asserts `getFortificationFormulas()` returns exactly 3 entries with `manufacturer === "Kendamil"`, ordered by `name` after the existing alphabetical sort. The SelectPicker rendering itself is implicit — it consumes the manufacturer field through the existing sort/group logic at `FortificationInputs.svelte:85-86`.
- **D-11:** Update the existing formula-count assertion at `fortification-config.test.ts:17` from `expect(formulas).toHaveLength(30)` to `expect(formulas).toHaveLength(33)`. The xlsx Calculator A3:D35 row-count rationale comment should be updated to note that 3 entries (Kendamil Organic / Classic / Goat) extend beyond xlsx — they are sourced from manufacturer HCP charts.

### `packetsSupported` Field

- **D-12:** All three Kendamil entries **omit** the `packetsSupported` field (default `false`). Matches the pattern for every non-HMF formula in the existing config — only `similac-hmf` sets `packetsSupported: true`. KEND-05 is satisfied by omission; the type signature `packetsSupported?: boolean` already encodes this default.

### Audit-Trail Capture (Success Criterion 5)

- **D-13:** Audit trail lives in **two places**: PLAN.md (full milestone audit per variant — URL, fetch date, raw HCP values, region, derivation math) and JSDoc-style comments at the top of `src/lib/fortification/fortification-config.ts` (per-variant one-liner pointing to the source URL + region + fetch date). The strict-JSON file gets no comments. The `.ts` loader file is the natural home for the discoverable-from-code comments since `.json` cannot host them.
- **D-14:** Per-variant audit metadata required: (a) source URL on hcp.kendamil.com, (b) date URL was fetched (ISO date), (c) raw HCP values (kcal/100mL reconstituted, grams per scoop, reconstitution ratio), (d) region (US or UK Kendamil HCP site). All four go in PLAN.md; the comment block in `fortification-config.ts` carries URL + date + region (raw values stay in PLAN.md to avoid bloating the loader file).

### Claude's Discretion

- Test naming / `describe` block structure within `calculations.test.ts` — researcher/planner can mirror existing `describe('calculateFortification — documented case (VAL-01)', ...)` style.
- Exact `toBeCloseTo` precision digits per variant — match whichever precision yields a stable assertion within 1% epsilon (the Neocate VAL-01 test uses 4 digits; Kendamil tests can do the same unless the math forces lower precision).
- JSDoc comment formatting in `fortification-config.ts` — single-block at top of file with sections per variant, vs. one comment per `getFormulaById` reference. Planner picks the cleaner shape.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements & Roadmap

- `.planning/REQUIREMENTS.md` §"Kendamil Formula Family" — KEND-01 through KEND-05, KEND-TEST-01 through KEND-TEST-03 (8 requirements for Phase 44)
- `.planning/ROADMAP.md` §"Phase 44: Kendamil Formula Family" — goal, success criteria 1-5, dependencies (none)

### Fortification Module (the only files this phase touches)

- `src/lib/fortification/fortification-config.json` — strict JSON; add 3 entries; current 30-formula count becomes 33
- `src/lib/fortification/fortification-config.ts` — loader; new home for JSDoc audit comments
- `src/lib/fortification/fortification-config.test.ts` — extend with 3-Kendamil-entries grouping test; bump count assertion from 30 → 33
- `src/lib/fortification/types.ts` — `FortificationFormula` interface; `packetsSupported?: boolean` default-false confirmed here
- `src/lib/fortification/calculations.ts` — pure `calculateFortification` function; uses general CALC-02 formula path for the new entries (no Packets / BM-tsp branch hits)
- `src/lib/fortification/calculations.test.ts` — extend with 3 Kendamil parity tests mirroring the Neocate VAL-01 canonical
- `src/lib/fortification/FortificationInputs.svelte` §lines 83-86 — manufacturer grouping is implemented via `localeCompare` sort + `group: f.manufacturer`; no UI changes needed for Kendamil to appear

### External (manufacturer)

- `hcp.kendamil.com` — Kendamil HCP site (US first, UK fallback). Researcher fetches per-variant mixing charts during research step.

### Note Promotion

- `.planning/notes/2026-04-24-add-kendamil-formula.md` — original idea capture; this CONTEXT.md supersedes it.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **Manufacturer-grouping mechanism:** Already implemented at `FortificationInputs.svelte:83-86` — `getFortificationFormulas().slice().sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.name.localeCompare(b.name)).map((f) => ({ value: f.id, label: f.name, group: f.manufacturer }))`. Adding three entries with `manufacturer: "Kendamil"` automatically produces a Kendamil group between Abbott and Mead Johnson with no code changes.
- **Default-false for `packetsSupported`:** `formulaSupportsPackets()` at `fortification-config.ts:17` checks `=== true`. Omitting the field is equivalent to `false`. Pattern: 29 of 30 existing formulas omit the field.
- **Parity-test pattern:** `calculations.test.ts` describes per-formula cases using `getFormulaById(...)` and asserts `amountToAdd` / `yieldMl` / `exactKcalPerOz` / `suggestedStartingVolumeMl`. Existing `SUGGESTED_RE = /^\d+ \(\d+(\.\d+)? oz\)$/` regex is reused.
- **Config-shape test pattern:** `fortification-config.test.ts` uses `REQUIRED_KEYS` array + per-formula loop for shape assertions. Extend by adding `getFormulaById('kendamil-organic')` style assertions and a per-manufacturer count loop.

### Established Patterns

- **Strict JSON for config:** `fortification-config.json` is loaded directly via `import config from './fortification-config.json'`. No inline comments allowed. All audit metadata must live in `.ts` / `.md` siblings.
- **Manufacturer alphabetical sort:** `localeCompare` handles diacritics correctly (`Nestlé` sorts after `Mead Johnson`). Kendamil sorts naturally between `K`-region and `M`-region (Abbott < Kendamil < Mead Johnson).
- **No xlsx authority for Kendamil:** Existing 30 formulas trace to `recipe-calculator.xlsx` Calculator tab A3:D35. Kendamil entries break this — the source of truth is `hcp.kendamil.com`. PLAN.md and config-test.ts comment must note this divergence so a future contributor doesn't try to reconcile against xlsx.

### Integration Points

- **Where new code connects:** Three new objects appended to `formulas[]` in `fortification-config.json`. Three new `it(...)` blocks in `calculations.test.ts`. One new `describe` (or extension) in `fortification-config.test.ts`. JSDoc block (or per-variant inline comments) at top of `fortification-config.ts`.
- **No NavShell / registry / route / favorites coupling:** Phase 44 explicitly does not touch `src/lib/nav/`, `src/lib/registry.ts`, route handlers, or anything outside `src/lib/fortification/`. Per ROADMAP "Depends on: Nothing" — runs in parallel with Phase 45 (NavShell desktop divergence) without conflict.
- **Playwright axe re-run only:** KEND-TEST-03 says "re-run existing fortification axe sweeps with a Kendamil variant selected". The Playwright spec for fortification (under `e2e/` or `tests/`) is extended with a new test fixture / parameterized case rather than rewritten.

</code_context>

<specifics>
## Specific Ideas

- Kendamil Organic spec is already locked in REQUIREMENTS KEND-01: `calorie_concentration ≈ 5.12 kcal/g` (22 kcal ÷ 4.3 g per scoop), `displacement_factor ≈ 0.77 mL/g` (3.3 mL ÷ 4.3 g per scoop), `grams_per_scoop: 4.3`. Researcher confirms exact decimal values against the live HCP page and locks them; doesn't re-derive.
- The Neocate VAL-01 canonical (`180 mL + breast-milk + 24 kcal/oz + tsp → 2`) is the reference shape — Kendamil tests use the same volume, base, and target but switch to **scoops** unit (no BM-tsp shortcut applies for Kendamil).
- Kendamil is a UK-origin product; the US clinical context is "imported / repackaged but same formulation". This is why region (US vs UK HCP) matters in the audit metadata — clinicians may need to verify the spec they're using matches the can on their NICU shelf.

</specifics>

<deferred>
## Deferred Ideas

- **Kendamil HMF / fortifier variants** — explicitly out of scope per REQUIREMENTS.md "Future Requirements". Current request is infant formulas only.
- **Kendamil toddler / follow-on milks** — out of scope; NICU audience is infants. ID convention (`kendamil-organic` bare) is chosen to leave space for `kendamil-organic-toddler` etc. if ever added.
- **Other non-Kendamil formula brands** — REQUIREMENTS.md "Future Requirements" notes "no current request".
- **Hide `manufacturer` field from the SelectPicker label** — not requested; existing grouping is the value-add.
- **Sidecar `SOURCES.md` registry of every formula's authoritative spec source** — interesting longer-term audit registry but higher maintenance cost than the current "PLAN.md per phase" pattern. Defer until at least one more non-xlsx-sourced formula family lands.

</deferred>

---

*Phase: 44-kendamil-formula-family*
*Context gathered: 2026-04-25*
