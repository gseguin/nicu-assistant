---
phase: 44-kendamil-formula-family
plan: 01
subsystem: fortification
tags:
  - data-extension
  - kendamil
  - audit-trail
  - jsdoc
requirements:
  - KEND-01
  - KEND-02
  - KEND-03
  - KEND-04
  - KEND-05
dependencies:
  requires: []
  provides:
    - kendamil-formula-entries
    - kendamil-audit-trail-jsdoc
  affects:
    - fortification-config-test-count-assertion
tech-stack:
  added: []
  patterns:
    - strict-json-config-with-typed-loader
    - alphabetical-by-id-formulas-array-ordering
    - manufacturer-localecompare-grouping
    - default-false-via-omitted-field
    - jsdoc-audit-trail-header-block
key-files:
  created: []
  modified:
    - src/lib/fortification/fortification-config.json
    - src/lib/fortification/fortification-config.ts
decisions:
  - Used HCP-printed `displacement_factor: 0.77` for all three Kendamil variants (matches REQUIREMENTS KEND-01 + 2dp config style; derived `3.3/4.3 = 0.7674…` rounds to 0.77 anyway)
  - Omitted `packetsSupported` on all three Kendamil entries (D-12; matches the 29-of-30 default-false-by-omission pattern)
  - JSDoc audit block placed at top of `fortification-config.ts` as a single header (D-13 recommendation)
  - Per-variant audit lines in JSDoc carry URL + region + ISO date only; raw HCP values stay in PLAN.md/RESEARCH.md (D-14)
metrics:
  duration: 4 minutes
  tasks-completed: 2
  files-modified: 2
  completed-date: 2026-04-25
commits:
  - 3a0ccd1: feat(44-01) add Kendamil Organic, Classic, and Goat to fortification config
  - 0d425b0: docs(44-01) add JSDoc audit trail header to fortification-config.ts
---

# Phase 44 Plan 01: Kendamil Formula Family Data Entries Summary

Added the three Kendamil infant-formula variants (Organic, Classic, Goat) to `fortification-config.json` under a plain `"Kendamil"` manufacturer, plus a JSDoc audit-trail header on the loader file capturing per-variant HCP source URLs, region, and ISO fetch date.

## Outcome

- Three new entries spliced into `formulas[]` between `gerber-good-start` (line 84) and `monogen` (now line 116) in alphabetical-by-id order: `kendamil-classic` → `kendamil-goat` → `kendamil-organic`.
- All three share `manufacturer: "Kendamil"`, `displacement_factor: 0.77`, `grams_per_scoop: 4.3` — the only per-variant delta is `calorie_concentration`.
- `manufacturer: "Kendamil"` (plain ASCII) lands the new group between Abbott and Mead Johnson via the existing `localeCompare` sort at `FortificationInputs.svelte:83-86` — zero UI changes required.
- A JSDoc header block sits at the top of `fortification-config.ts` documenting the xlsx-vs-Kendamil divergence and pointing each Kendamil variant to its HCP source PDF.

## Per-Variant Values Spliced

| Variant | id | calorie_concentration | displacement_factor | grams_per_scoop | packetsSupported |
|---------|----|-----------------------|---------------------|-----------------|------------------|
| Kendamil Classic | `kendamil-classic` | 5.21 kcal/g | 0.77 mL/g | 4.3 g | omitted (default false) |
| Kendamil Goat | `kendamil-goat` | 5.09 kcal/g | 0.77 mL/g | 4.3 g | omitted (default false) |
| Kendamil Organic | `kendamil-organic` | 5.12 kcal/g | 0.77 mL/g | 4.3 g | omitted (default false) |

Source for all three: per-variant Nutritional Profile + Mixing Instructions PDFs on `hcp.kendamil.com` (US region, fetched 2026-04-24).

## Verification Results

| Check | Outcome |
|-------|---------|
| `node -e 'JSON.parse(...)'` | Pass — JSON valid |
| `formulas.length === 33` | 33 ✓ |
| Kendamil entry count by manufacturer | 3 ✓ |
| Kendamil ids (sorted) | `kendamil-classic`, `kendamil-goat`, `kendamil-organic` ✓ |
| `packetsSupported` absent on all three | 0 occurrences in Kendamil block ✓ |
| Position between `gerber-good-start` and `monogen` | Lines 84 → 92 → 100 → 108 → 116 ✓ |
| `head -1 fortification-config.ts === "/**"` | Pass ✓ |
| JSDoc grep checks (3 URLs, 3 region+date lines, all PDF filenames) | Pass ✓ |
| Existing `import type` + `getFormulaById` preserved | Pass ✓ |
| `pnpm exec vitest run ... -t "every entry has all required fields"` | Pass (REQUIRED_KEYS loop covers new entries) ✓ |
| `pnpm exec svelte-check --threshold error` | 0 errors, 0 warnings, 4571 files ✓ |

## Expected (Documented) Test Failure — Hand-Off to Plan 44-02

The count assertion at `fortification-config.test.ts:17` (`expect(formulas).toHaveLength(30)`) currently FAILS with "expected 33 to have length 30". This is the **documented Wave-1 → Wave-2 hand-off**: Plan 44-02 (per D-11 / `<verification>` block in 44-01-PLAN.md) bumps the literal to 33 and updates the xlsx-rationale comment to note the Kendamil HCP-sourced divergence.

The other 8 tests in `fortification-config.test.ts` pass against the new 33-entry config (REQUIRED_KEYS shape loop, every-numeric-finite checks, id-uniqueness, getFormulaById lookups all pass).

## Deviations from Plan

None — plan executed exactly as written. The `<verification>` block flagged the count-assertion failure as expected; that failure is logged here for the verifier and the Wave-2 executor.

## Authentication Gates

None.

## Known Stubs

None. Both files are fully wired: the JSON entries flow through the existing typed loader and SelectPicker grouping; the JSDoc block is informational and references real HCP URLs.

## Threat Flags

None — no new network endpoints, auth paths, file-access patterns, or schema changes at trust boundaries beyond what the threat model already captured (T-44-01 mitigated by parity tests in Plan 44-03; T-44-02 mitigated by the JSDoc audit block this plan added; T-44-03 accepted).

## Self-Check: PASSED

- FOUND: src/lib/fortification/fortification-config.json (33 formulas, 3 Kendamil)
- FOUND: src/lib/fortification/fortification-config.ts (JSDoc block at top)
- FOUND: 3a0ccd1 (feat 44-01 JSON entries)
- FOUND: 0d425b0 (docs 44-01 JSDoc header)

## Next Plan

Plan 44-02 (Wave 2) updates `fortification-config.test.ts` — bumps the count assertion 30 → 33, adds the Kendamil grouping `describe` block (KEND-04 / KEND-TEST-02 / KEND-05). Plan 44-03 adds parity tests in `calculations.test.ts` (KEND-TEST-01). Plan 44-04 extends the Playwright axe sweep (KEND-TEST-03).
