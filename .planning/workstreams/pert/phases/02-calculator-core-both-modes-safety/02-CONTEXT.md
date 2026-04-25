# Phase 2: Calculator Core (Both Modes + Safety) — Context

**Gathered:** 2026-04-25
**Status:** Ready for planning
**Source:** /gsd-discuss-phase --auto (all gray areas auto-resolved with recommended defaults; user should review D-01..D-13 below before plan-phase locks them in)

<domain>
## Phase Boundary

Phase 2 lands the actual capsule-counting math (Oral B11 + Tube-Feed B13/B14 within ±1% xlsx parity), the SegmentedToggle that switches between the two modes, the safety advisories (max-lipase STOP-red carve-out + range warnings), and the empty-state hero copy unification. Phase 1 already shipped the route shell, identity hue, clinical config, and state singleton; Phase 2 fills in `<PertCalculator />` from a placeholder hero into a working calculator.

**In scope:**
- Pure-function dosing math in `src/lib/pert/calculations.ts` (Oral capsules-per-dose, Tube-Feed capsules-per-day, daily-lipase, capsules/month, advisory-trigger logic).
- `<PertCalculator />` component body — SegmentedToggle, all input wiring, `<HeroResult>` rendering, advisory cards, empty-state hero copy.
- Mode switching with shared (weight/medication/strength) and mode-specific (fat/formula/volume/lipasePerKg) state.
- Max-lipase STOP-red advisory (PERT-SAFE-01) using the v1.13 GIR `8fde90e` carve-out pattern.
- Out-of-range blur-gated warnings via `<NumericInput>` for weight, fat, volume.

**Out of scope (Phase 3+):**
- Spreadsheet-parity vitest fixtures (PERT-TEST-01..02) — Phase 3.
- Component / E2E / axe tests (PERT-TEST-03..06) — Phase 3.
- Design polish / `/impeccable` critique sweep (PERT-DESIGN-*) — Phase 4.
- Release artifacts (version bump, AboutSheet version reflect, ROADMAP completion) — Phase 5.

</domain>

<decisions>
## Implementation Decisions

All Phase 2 decisions below are **[auto-recommended]** by the orchestrator under `/gsd-discuss-phase --auto`. User should skim and override any that look wrong before `/gsd-plan-phase 2 --ws pert` locks them into plans.

### Math module shape

- **D-01 [auto]:** Math lives in `src/lib/pert/calculations.ts` as pure functions — no imports of state, no side effects. Mirrors `src/lib/feeds/calculations.ts` (which has `getTriggeredAdvisories` at line 198, the established advisory-check pattern). Two top-level result-producing functions: `computeOralResult(inputs)` and `computeTubeFeedResult(inputs)`. One advisory function: `getTriggeredAdvisories(mode, inputs, result, advisoryConfig)`. **Why:** D-05 from Phase 1 already chose feeds-shape config over the reference app's `runFormula` step engine; calculations.ts as plain functions is the natural complement.

### Rounding semantics

- **D-02 [auto]:** All capsule-count outputs use `Math.ceil` (= xlsx ROUNDUP / CEILING). Result-object fields default to `0` if any required input is `null`, `NaN`, ≤ `0`, or division-by-zero — never produce `Infinity` or `NaN` in the result. The empty-state gate (D-08) prevents these conditions from rendering anyway, but the math layer is defensive. **Why:** xlsx parity is the contract; clinical intent is "always round up to whole capsules" (you can't dose half a capsule).

### Max-lipase advisory threshold expression

- **D-03 [auto]:** The 10,000 units/kg/day cap is **hard-coded in `calculations.ts`** as the literal `dailyLipase > weightKg * 10000`. The advisory entry in `pert-config.json` keeps `field: "computed"` + `comparator: "gt"` + `value: 0` as a marker (the calc layer triggers it; the JSON entry exists so the rendering pipeline finds the message + severity). Add a short comment in `pert-config.json` and `calculations.ts` explaining the marker semantics. **Why:** the 10,000 cap is FDA-published and not user-tuneable; a literal in code means a clinician/reviewer can grep one place to find the safety floor. Generic config-driven thresholds (`{baseField: 'weightKg', multiplier: 10000}`) add config schema surface for no real flexibility win.

### STOP-red render contract (PERT-SAFE-01)

- **D-04 [auto]:** STOP-red advisory renders as a **separate card below the hero** (NOT inline in the hero). Card structure: `border-[var(--color-error)]` + `bg-[var(--color-surface-card)]` + `<AlertOctagon size={20} class="text-[var(--color-error)]" />` from `@lucide/svelte` + bold message text in `text-[var(--color-error)]`. Distinct from neutral warning advisories (which keep the existing feeds pattern: neutral card + `AlertTriangle` icon + secondary-text message). Hero stays identity-purple (Identity-Inside Rule from DESIGN.md preserved). **Why:** v1.13 GIR `8fde90e` set the STOP-red precedent for this app; PERT mirrors at the advisory level rather than the hero level because PERT's hero shows the capsule count, not a STOP word. The carve-out is "red means error / out-of-range, with one named exception per calculator: the safety cap."

### Daily-lipase computation across modes

- **D-05 [auto]:** Per-mode `dailyLipase`:
  - Oral: `dailyLipase = capsulesPerDose × strengthValue × 3` (3 meals/day, matches xlsx "Estimated daily total" assumption).
  - Tube-Feed: `dailyLipase = capsulesPerDay × strengthValue` (already a daily total).
  - Both compared against `weightKg × 10000` to decide if the `max-lipase-cap` advisory fires.
- The advisory check runs in `getTriggeredAdvisories(mode, inputs, result, advisoryConfig)` — separated from the result-producing function so that callers can render the result object without re-running the full advisory pass. Mirrors `src/lib/feeds/calculations.ts:198`.

### SegmentedToggle wiring + persistence

- **D-06 [auto]:** Use the existing `<SegmentedToggle>` at `src/lib/shared/components/SegmentedToggle.svelte` with two options: `{value: 'oral', label: 'Oral'}` and `{value: 'tube-feed', label: 'Tube-Feed'}`. Bind to `pertState.current.mode`. Generic `T extends string` on the component already accommodates the `PertMode` union. Keyboard nav (←/→/Home/End) is already in the component — no rework needed.
- **D-07 [auto]:** Mode persists only on direct toggle activation (input edits don't change mode). `pertState.persist()` runs on every `current` mutation per the `$effect` already in the placeholder `PertCalculator.svelte`; Phase 2 keeps that contract verbatim. On reload: `pertState.init()` reads localStorage and restores `current.mode` to whatever was last persisted. First-run defaults to `'oral'` per `defaultState()` in `state.svelte.ts`.

### Empty-state gating

- **D-08 [auto]:** Required input set per mode (all must be non-null + computable):
  - **Oral:** `weightKg`, `medicationId`, `strengthValue`, `oral.fatGrams`, `oral.lipasePerKgPerMeal`.
  - **Tube-Feed:** `weightKg`, `medicationId`, `strengthValue`, `tubeFeed.formulaId`, `tubeFeed.volumePerDayMl`, `tubeFeed.lipasePerKgPerDay`.
- If ANY required input is `null` or fails `> 0` (where applicable), the hero renders the empty-state copy (`validationMessages.emptyOral` / `emptyTubeFeed`); secondary outputs hidden; advisories hidden. The math layer returns `0` for capsule fields in this case (D-02), but the render layer never reaches them.

### Estimated-daily-total tertiary (PERT-ORAL-08)

- **D-09 [auto]:** Tertiary line in Oral mode only:
  - Label: `"Estimated daily total (3 meals/day)"` (verbatim per PERT-ORAL-08).
  - Value: `capsulesPerDose × 3` capsules.
  - Visual weight: `text-2xs uppercase` eyebrow + `text-base` value with `class="num"` (tabular numerics per DESIGN.md). Smaller than secondary outputs (which are `text-title`).
  - No italics, no separate card — sits below secondaries, before advisories.
  - The "Estimated" qualifier in the label is the clinical hedge; no extra disclaimer text.

### Advisory ordering

- **D-10 [auto]:** Render order: `severity: "stop"` first, then `severity: "warning"`. Within each tier, render in the order they appear in `pert-config.json` `advisories[]` (which today is `max-lipase-cap` → `weight-out-of-range` → `fat-out-of-range` → `volume-out-of-range`). No max count. Dedup by `id` (defensive — config has no duplicate ids today).

### Strength picker behavior on medication change

- **D-11 [auto]:** When `medicationId` changes, **reset `strengthValue` to `null`**. Reasoning: strengths arrays differ per medication (Creon `[3000..36000]` × 5, Zenpep `[3000..60000]` × 8, Pancreaze `[2600..37000]` × 6, Pertzye `[4000..24000]` × 4, Viokace `[10440, 20880]` × 2). A stale strength is invalid clinically. After the reset, the empty-state gate (D-08) shows the empty hero until the user picks a strength — same as first-run.

### Capsules-per-month rounding

- **D-12 [auto]:** `capsulesPerMonth = Math.ceil(capsulesPerDay × 30)`. Locked to `× 30` to match xlsx `B14` exactly (NOT calendar-month average `× 30.4`). Phase 3 spreadsheet-parity tests will assert this equality.

### Volume input unit

- **D-13 [auto]:** Tube-Feed volume input is in **milliliters (mL)**. Step `10`, range advisory min `100`, max `2500` (already locked in `pert-config.json` Phase 1). NumericInput `suffix="mL"`.

### Range advisory binding (NumericInput contract)

- **D-14 [auto-pending-research]:** PERT-SAFE-02/03 say "blur-gated 'Outside expected range — verify' via `<NumericInput showRangeHint>`". The actual prop name on the existing component is unverified at discuss-time. **Action for the planner:** read `src/lib/shared/components/NumericInput.svelte` and bind to whatever prop the component actually exposes (likely `showRangeHint`, `rangeAdvisory`, or similar). If no such prop exists, the planner adds one to NumericInput as a Wave-0 latent-bug fix (mirrors v1.8 / Phase 1 pattern). Don't fabricate the prop name in CONTEXT.md.

### Claude's Discretion

- File-level layout inside `src/lib/pert/calculations.ts` (single file vs. split by mode) — planner decides; single-file is the feeds analog and likely cleanest for this phase's surface.
- Exact CSS classes for the STOP-red advisory card (D-04 names the tokens; the planner picks the Tailwind 4 incantation).
- `<NumericInput>` numeric formatting (decimals, suffix placement) for fatGrams (1 decimal) vs. lipasePerKgPerMeal (integer) — planner reads the existing inputs across feeds/uac-uvc and matches.
- Whether `getTriggeredAdvisories` returns a flat array or `{stop: [...], warning: [...]}` shape — planner decides; flat array + render-layer sorting (D-10) is the simpler default.
- `aria-live` region binding granularity — placeholder PertCalculator already uses HeroResult which handles aria-live; Phase 2 confirms `aria-live="polite"` fires on mode-switch + result-change per PERT-MODE-04.

### Folded Todos

None — no pending todos matched Phase 2 scope at the cross-reference step.

</decisions>

<specifics>
## Specific Ideas

- **xlsx parity is the contract.** Plan-phase research will mine the live `epi-pert-calculator.xlsx` Pediatric Oral / Tube-Feed tabs to extract the canonical formulas (`B11`, `B13`, `B14`, `B12 = B5 × 10000`). The clinical-data corrections from Phase 1 (Plan 01-03 — Zenpep 60000, Pancreaze 37000 strengths added; 11 of 17 formula `fatGPerL` values corrected) are the now-trusted ground truth; Phase 2 math + Phase 3 fixtures lock these in.
- **STOP-red carve-out semantics.** The v1.13 GIR commit `8fde90e fix(gir): promote STOP semantics to error color on severe-neuro` is the precedent: red is reserved for "calculation error / out-of-range", with named exceptions per calculator for life-or-death messaging. PERT's exception is the 10,000 units/kg/day cap (PERT-SAFE-01).
- **D-12 from Phase 1 (mode = most-recent-edited).** Mode persists across reload via localStorage; first-run is Oral. Phase 2 honors this by binding the SegmentedToggle directly to `pertState.current.mode` and letting the existing `$effect`-driven persist() pipeline handle the writeback.
- **D-08 advisory-shape from Phase 1.** Advisories are a flat array in `pert-config.json` with `{id, field, comparator, value, message, severity, mode}`. Phase 2 reads + renders without altering this shape. The `max-lipase-cap` entry is a special case (D-03) — it's checked by the calc layer rather than the generic comparator engine.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Workstream-local (read these first)

- `.planning/workstreams/pert/PROJECT.md` — Workstream charter, validated history.
- `.planning/workstreams/pert/REQUIREMENTS.md` — All 54 PERT-* requirements; Phase 2 owns 23 (PERT-ORAL-01..08, PERT-TUBE-01..07, PERT-MODE-01..04, PERT-SAFE-01..04).
- `.planning/workstreams/pert/ROADMAP.md` §"Phase 2: Calculator Core (Both Modes + Safety)" — Phase goal, 5 success criteria, dependencies.
- `.planning/workstreams/pert/STATE.md` — Phase 1 outcomes + accumulated context.

### Phase 1 outputs (the foundation Phase 2 builds on)

- `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/01-CONTEXT.md` — Phase 1 decisions D-01..D-24 (especially D-05 config shape, D-08 advisories array, D-09 localStorage, D-10 state shape, D-12 mode default).
- `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/01-01-SUMMARY.md` — Wave 0 architecture outcomes.
- `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/01-02-SUMMARY.md` — `.identity-pert` OKLCH constants + axe sweep contract (the gated `/pert` axe sweeps in `e2e/pert-a11y.spec.ts` are now active per Phase 1 — Phase 2 must NOT regress them).
- `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/01-03-SUMMARY.md` — Clinical config + the 11 formula `fatGPerL` corrections + Zenpep 60000 / Pancreaze 37000 strength additions (xlsx parity authority).
- `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/01-04-SUMMARY.md` — State singleton + placeholder PertCalculator + AboutSheet entry. **Phase 2 modifies `src/lib/pert/PertCalculator.svelte` from this baseline.**
- `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/VERIFICATION.md` — Independent verifier's 5/5 criteria + 14/14 requirements + quality gate matrix.

### Project-level (constraints & contracts)

- `CLAUDE.md` — Tech stack pin (SvelteKit 2.55 + Svelte 5 + Tailwind 4 + Vite 8 + pnpm 10.33, no native, PWA-only, WCAG 2.1 AA, no new runtime deps).
- `DESIGN.md` — Identity-Inside Rule, OKLCH-Only, Five-Roles-Only, Tabular-Numbers, Eyebrow-Above-Numeral, 11px Floor, Red-Means-Wrong (with named carve-outs per calculator).
- `DESIGN.json` — Machine-readable design contract (token allowlist, identity-class allowlist).
- `.planning/PROJECT.md` — Main project charter; v1.13 STOP-red carve-out precedent.

### Source of clinical truth

- `epi-pert-calculator.xlsx` (repo root) — `Pediatric Oral PERT Tool` and `Pediatric Tube Feed PERT` sheets are the parity authority for `B11`, `B12`, `B13`, `B14`. Phase 2 calculations.ts must reproduce these within ±1% (Phase 3 vitest fixtures lock the equality with explicit fixture rows including the xlsx defaults: weight 22 lbs ≈ 9.98 kg + Creon 12000 + 25g fat + 1000 lipase/kg → expected `B11`; weight 15 lbs ≈ 6.80 kg + Kate Farms Pediatric Standard 1.2 + 1000 mL + 1000 lipase/kg → expected `B13` and `B14`).
- DailyMed (NDA records) — secondary citation for medication strengths in AboutSheet (already shipped in Phase 1).

### Closest codebase analogs (Phase 2 mirrors these structurally)

- `src/lib/feeds/calculations.ts` — Closest analog. Lines 198–245 (`getTriggeredAdvisories`) is the canonical advisory-check pattern Phase 2 mirrors. Pure functions, no state imports, advisory-config-driven.
- `src/lib/feeds/FeedAdvanceCalculator.svelte` — Closest UI analog. Lines 305–322 are the existing advisory-render pattern (neutral card + `AlertTriangle` for warnings); Phase 2 D-04 adds the STOP-red variant beside it.
- `src/lib/uac-uvc/state.svelte.ts` — State pattern Phase 1 already mirrored at `src/lib/pert/state.svelte.ts`; Phase 2 modifies that file ONLY if necessary (most likely no changes — the placeholder state schema is already correct per D-10).
- `src/lib/uac-uvc/UacUvcCalculator.svelte` — Smaller component analog (single mode, no toggle); useful for input-wiring patterns.
- `src/lib/gir/GirCalculator.svelte` — STOP-red carve-out precedent (commit `8fde90e`). Phase 2 D-04 mirrors the `--color-error` + `OctagonAlert` styling at the advisory level.
- `src/lib/shared/components/SegmentedToggle.svelte` — Generic `T extends string` toggle with built-in keyboard nav. Phase 2 binds with `value={pertState.current.mode}` and the `'oral' | 'tube-feed'` options.
- `src/lib/shared/components/HeroResult.svelte` — Already used in placeholder PertCalculator; Phase 2 keeps it and fills in the `value` + numeric.
- `src/lib/shared/components/InputDrawer.svelte` — Sticky input drawer pattern (v1.13 cross-route adoption per PERT-DESIGN-04). Phase 2 wraps the inputs in this for mobile collapsibility.
- `src/lib/shared/components/NumericInput.svelte` — Phase 2 reads to confirm the `showRangeHint` (or actual) prop name (D-14).
- `src/lib/shared/components/RangedNumericInput.svelte` — The wrapper that wires range advisories to NumericInput; Phase 2 likely uses this for weight/fat/volume.
- `src/lib/shared/components/SelectPicker.svelte` — Medication + strength + formula pickers. Phase 2 reads to confirm filter/search behavior (formula picker has 17 options — search may be needed; planner research investigates).

### Live Phase 1 outputs (Phase 2 reads + extends, never re-creates)

- `src/lib/pert/types.ts` — All Phase 2 types (`PertMode`, `PertOralResult`, `PertTubeFeedResult`, `Advisory`, etc.) are already defined.
- `src/lib/pert/pert-config.json` — Defaults, ranges, dropdowns, advisories. Phase 2 reads via the config.ts wrapper; does NOT modify the JSON unless the planner finds a Phase-1-bug requiring a Wave-0 fix.
- `src/lib/pert/config.ts` — Typed wrapper exporting `defaults`, `inputs`, `medications`, `formulas`, `lipaseRates`, `advisories`, `validationMessages`, `getMedicationById`, `getFormulaById`, `getStrengthsForMedication`. Phase 2 imports from here.
- `src/lib/pert/state.svelte.ts` — `pertState` singleton. Phase 2 reads `pertState.current.*` and triggers persist via the existing `$effect` pattern.
- `src/lib/pert/PertCalculator.svelte` — Phase 1 placeholder (51 lines). Phase 2 replaces the body with the real calculator (SegmentedToggle + inputs + hero + advisories) while keeping the `<HeroResult>` outer shell.
- `src/routes/pert/+page.svelte` — Phase 1 route shell. Phase 2 likely needs no changes here.

### Reference (do NOT copy verbatim — pattern inspiration only)

- `/home/ghislain/src/pert-calculator/src/lib/dosing.ts` — Reference app's `runFormula` step engine + `calculateCapsules` / `calculateTotalLipase` / `calculateCapsulesPerMonth`. **Not** ported (D-05 from Phase 1 chose feeds-shape over runFormula). Note: reference app uses `Math.round` (xlsx ROUND); Phase 2 uses `Math.ceil` (xlsx ROUNDUP / CEILING) per ROADMAP success criteria #1 + #2 — different rounding semantics.
- `/home/ghislain/src/pert-calculator/src/lib/clinical-config.json` — Reference app's clinical config shape. Pattern reference only.

### Related past phases (precedent)

- v1.13 Phase 42 (UAC/UVC) — Closest end-to-end analog for this milestone. Same architecture (Wave-0 latent-bug fix + identity hue + clinical config) → calculator core (single mode) → tests → polish.
- v1.13 GIR commit `8fde90e` — STOP-red carve-out precedent; Phase 2 D-04 mirrors at the advisory level.
- v1.12 Feeds Phase — `getTriggeredAdvisories` pattern source; Phase 2 D-01 + D-05 mirror.
- v1.6 SegmentedToggle introduction — The component Phase 2 D-06 binds to.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`<SegmentedToggle>`** at `src/lib/shared/components/SegmentedToggle.svelte` — generic `<T extends string>`, has `value = $bindable()`, props `{label, value, options, ariaLabel, class}`, built-in keyboard nav. Use directly with `PertMode` union.
- **`<HeroResult>`** at `src/lib/shared/components/HeroResult.svelte` — already in placeholder PertCalculator; Phase 2 fills `value` + `numericValue` for the capsules-per-dose / capsules-per-day output.
- **`<RangedNumericInput>` / `<NumericInput>`** at `src/lib/shared/components/` — weight, fat, volume, lipasePerKg inputs. Phase 2 binds to `pertState.current.*` and reads ranges from `inputs.*` config.
- **`<SelectPicker>`** at `src/lib/shared/components/SelectPicker.svelte` — medication, strength, formula pickers.
- **`<InputDrawer>`** at `src/lib/shared/components/InputDrawer.svelte` — sticky input drawer (v1.13 adoption per PERT-DESIGN-04).
- **`config.ts` typed wrapper** at `src/lib/pert/config.ts` — already exports everything Phase 2 needs (`defaults`, `inputs`, `medications`, `formulas`, `advisories`, `validationMessages`, accessors).
- **`pertState` singleton** at `src/lib/pert/state.svelte.ts` — already wired with persist-on-mutate `$effect` pattern.
- **`AlertOctagon` Lucide icon** from `@lucide/svelte` — STOP-red carve-out icon (D-04). Already used in v1.13 GIR.
- **`AlertTriangle` Lucide icon** — neutral warning advisory icon (existing feeds pattern).
- **`--color-error` token** in `src/app.css` — STOP-red carve-out color (D-04).

### Established Patterns

- **`getTriggeredAdvisories(advisories, inputs, results, mode)` in `src/lib/feeds/calculations.ts:198`** — the canonical advisory-check pattern. Phase 2 D-01 + D-05 mirror.
- **`{#each triggeredAdvisories as advisory (advisory.id)}` render loop in `src/lib/feeds/FeedAdvanceCalculator.svelte:311`** — existing advisory render. Phase 2 extends with a severity-conditional branch for STOP-red (D-04 + D-10).
- **`$effect(() => { JSON.stringify(pertState.current); pertState.persist(); })` already in placeholder PertCalculator.svelte** — Phase 2 keeps verbatim per D-07.
- **STOP-red carve-out (`--color-error` + `AlertOctagon`)** — v1.13 GIR `8fde90e` precedent. Each calculator gets ONE named exception to Red-Means-Wrong; for PERT it's the 10,000 cap.
- **Identity-Inside Rule** — `.identity-pert` only on hero / focus rings / eyebrows / active nav (Phase 1 D-03). Phase 2 must NOT add identity color to chrome (e.g., the SegmentedToggle wrapper, advisory cards, input borders).
- **Tabular-numerics on numerical outputs** — `class="num"` per DESIGN.md. All capsule counts + lipase totals + fat totals use it.

### Integration Points

- **`src/lib/pert/calculations.ts`** — NEW file. Pure functions; no state imports.
- **`src/lib/pert/PertCalculator.svelte`** — REPLACE body. Outer `<HeroResult>` shell stays.
- **`src/lib/pert/state.svelte.ts`** — likely UNCHANGED in Phase 2; the placeholder schema already supports both modes per D-10.
- **`src/lib/pert/pert-config.json`** — likely UNCHANGED; Phase 2 reads via config.ts.
- **`src/routes/pert/+page.svelte`** — likely UNCHANGED.
- **`e2e/pert-a11y.spec.ts`** — Phase 2 must NOT regress (Phase 1 activated literal `/pert` axe sweeps; Phase 2's component changes must keep them green).

</code_context>

<deferred>
## Deferred Ideas

- **Spreadsheet-parity vitest fixtures (PERT-TEST-01..02)** — Phase 3.
- **Component / E2E / axe tests for the calculator (PERT-TEST-03..06)** — Phase 3.
- **`/impeccable` critique sweep + design polish (PERT-DESIGN-*)** — Phase 4.
- **Adult Oral PERT mode + Adult Tube Feed PERT mode** — Out of scope for v1.15 entirely (workstream PROJECT.md Out of Scope).
- **Per-meal historical logging** — Out of scope.
- **Custom formula entry** — Out of scope.
- **Schema-bump for pertState** — Considered against; D-10 schema is `{v:1}`-implicit and hasn't shipped to users yet, so future migrations are cheap.

### Reviewed Todos (not folded)

None — no pending todos matched Phase 2 scope.

</deferred>

---

*Phase: 02-calculator-core-both-modes-safety*
*Context gathered: 2026-04-25 via /gsd-discuss-phase --auto*
*All D-XX decisions auto-recommended; user should review before /gsd-plan-phase locks them.*
