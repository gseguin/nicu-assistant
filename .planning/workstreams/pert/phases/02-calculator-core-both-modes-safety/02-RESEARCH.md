# Phase 2: Calculator Core (Both Modes + Safety) — Research

**Researched:** 2026-04-24
**Domain:** Pure-function dosing math + result-hero UI + safety advisories for an existing Svelte 5 / Tailwind 4 / SvelteKit 2 calculator route
**Confidence:** HIGH on patterns and code paths; HIGH on xlsx canonical formulas (verified by openpyxl read of `/home/ghislain/src/pert-calculator/pert-calculator-pediatric-updated.xlsx`); HIGH on Phase-1 carry-overs; **LANDMINES SURFACED** in Section "Risks & Landmines" — three of them are larger than the planner can absorb without an explicit decision.

> **CRITICAL UPSTREAM CONFLICT FOUND DURING RESEARCH.** The xlsx canonical formulas (verified by reading the workbook in this session) **do not match** what CONTEXT D-02 says about rounding direction, what CONTEXT D-05 / PERT-ORAL-06 say about the oral capsules formula, and what the field name `lipasePerKgPerMeal` implies about the oral input semantics. The xlsx oral capsule formula is `ROUND((fat_g × lipase_per_g_of_fat) / strength, 0)` — **ROUND, not ROUNDUP/CEILING; multiplied by fat grams, not by weight in kg**. The conflict is large enough to invalidate Phase 3's parity tests if Phase 2 ships using `Math.ceil(weight × lipasePerKg / strength)` as written. Resolution options are documented in **Open Questions Q-01..Q-03**. The planner MUST resolve these before locking the calc-layer task; otherwise Phase 3 spreadsheet-parity will fail at the ±1% gate. This is a Rule-1 latent bug from Phase 1 that Phase 2 cannot let through.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

> Verbatim from `02-CONTEXT.md` `<decisions>` block. The planner MUST honor every D-XX. Where xlsx parity contradicts a locked decision (D-02, D-05), see Open Questions for the planner-action path.

- **D-01:** Math lives in `src/lib/pert/calculations.ts` as pure functions. Two top-level result-producing functions: `computeOralResult(inputs)` and `computeTubeFeedResult(inputs)`. One advisory function: `getTriggeredAdvisories(mode, inputs, result, advisoryConfig)`. Mirror `src/lib/feeds/calculations.ts:198`.
- **D-02:** All capsule-count outputs use `Math.ceil` (= xlsx ROUNDUP / CEILING). Result-object fields default to `0` if any required input is `null`, `NaN`, ≤ `0`, or division-by-zero. **(SEE Q-01: xlsx actually uses ROUND, not ROUNDUP. Locked decision contradicts canonical formulas.)**
- **D-03:** The 10,000 units/kg/day cap is hard-coded in `calculations.ts` as `dailyLipase > weightKg * 10000`. The advisory entry in `pert-config.json` keeps `field: "computed"` + `comparator: "gt"` + `value: 0` as a marker.
- **D-04:** STOP-red advisory renders as a separate card below the hero (NOT inline). `border-[var(--color-error)]` + `bg-[var(--color-surface-card)]` + `<OctagonAlert size={20} class="text-[var(--color-error)]" />` + bold message in `text-[var(--color-error)]`. Hero stays identity-purple.
- **D-05:** Per-mode `dailyLipase`:
  - Oral: `dailyLipase = capsulesPerDose × strengthValue × 3` (3 meals/day).
  - Tube-Feed: `dailyLipase = capsulesPerDay × strengthValue` (already a daily total).
  - Both compared against `weightKg × 10000`. **(SEE Q-02: xlsx oral has no daily-lipase cell; the 10,000 cap in xlsx is `weight × 10000` regardless of mode. Locked decision is a clinical convention, not xlsx parity — defensible but should be made explicit.)**
- **D-06:** Use `<SegmentedToggle>` with `bind:value={pertState.current.mode}`, options `[{value:'oral',label:'Oral'},{value:'tube-feed',label:'Tube-Feed'}]`.
- **D-07:** Mode persists via the existing `$effect(() => { JSON.stringify(pertState.current); pertState.persist(); })` in placeholder `PertCalculator.svelte`. Phase 2 keeps verbatim.
- **D-08:** Required input set per mode (all must be non-null + computable):
  - Oral: `weightKg`, `medicationId`, `strengthValue`, `oral.fatGrams`, `oral.lipasePerKgPerMeal`.
  - Tube-Feed: `weightKg`, `medicationId`, `strengthValue`, `tubeFeed.formulaId`, `tubeFeed.volumePerDayMl`, `tubeFeed.lipasePerKgPerDay`.
  - On any null / non-positive: hero renders empty-state copy, secondaries hidden, advisories hidden.
- **D-09:** Tertiary line in Oral mode only: label `"Estimated daily total (3 meals/day)"`, value `capsulesPerDose × 3`, visual weight `text-2xs uppercase` eyebrow + `text-base` value with `class="num"`. Smaller than secondary outputs (which are `text-title`). No italics.
- **D-10:** Render order: `severity: "stop"` first, then `severity: "warning"`. Within tier, render in JSON `advisories[]` order. No max count. Dedup by `id`.
- **D-11:** When `medicationId` changes, reset `strengthValue` to `null`.
- **D-12:** `capsulesPerMonth = Math.ceil(capsulesPerDay × 30)`. Locked to `× 30` (NOT `× 30.4`). **(SEE Q-04: xlsx tube B15 is `=B14*30` — direct multiply, no rounding. Since B14 is already integer, `× 30` always produces an integer; `Math.ceil` of an integer is the integer; both produce identical results. Safe.)**
- **D-13:** Tube-Feed volume input is in **milliliters (mL)**. Step `10`, range advisory min `100`, max `2500` (already locked in `pert-config.json` Phase 1). NumericInput `suffix="mL"`.
- **D-14:** `<NumericInput>` already exposes BOTH `showRangeHint` (default `true`) AND `showRangeError` (default `true`). Phase 2 leaves both at defaults. **No new prop needed.** [VERIFIED: live read of `src/lib/shared/components/NumericInput.svelte:23-24`]

### Claude's Discretion

- File-level layout inside `src/lib/pert/calculations.ts` (single file vs. split by mode) — single-file is the feeds analog and likely cleanest.
- Exact CSS classes for the STOP-red advisory card (D-04 names the tokens; planner picks the Tailwind 4 incantation).
- `<NumericInput>` numeric formatting (decimals, suffix placement) for fatGrams (1 decimal) vs. lipasePerKgPerMeal (integer) — match the existing inputs across feeds/uac-uvc.
- Whether `getTriggeredAdvisories` returns a flat array or `{stop:[...], warning:[...]}` — planner decides; flat array + render-layer sorting (D-10) is the simpler default and matches the feeds analog.
- `aria-live` region binding granularity — placeholder PertCalculator already uses HeroResult which handles `aria-live`.

### Deferred Ideas (OUT OF SCOPE)

- Spreadsheet-parity vitest fixtures (PERT-TEST-01..02) — Phase 3.
- Component / E2E / axe tests for the calculator (PERT-TEST-03..06) — Phase 3.
- `/impeccable` critique sweep + design polish (PERT-DESIGN-*) — Phase 4.
- Adult Oral PERT mode + Adult Tube Feed PERT mode — out of scope for v1.15 entirely.
- Per-meal historical logging — out of scope.
- Custom formula entry — out of scope.
- Schema-bump for pertState — considered against; D-10 schema is `{v:1}`-implicit and hasn't shipped to users yet.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (from REQUIREMENTS.md) | Research Support |
|----|------------------------------------|------------------|
| PERT-ORAL-01 | Weight input in kg via shared `<RangedNumericInput>`; range advisory; `inputmode="decimal"` regression-guarded | RangedNumericInput already does both. Bind to `pertState.current.weightKg`. Live verified at `RangedNumericInput.svelte:103`. |
| PERT-ORAL-02 | Fat-grams-per-meal input via `<NumericInput>` with config-driven range advisory | NumericInput has `showRangeHint`/`showRangeError` defaults; range from `inputs.fatGrams` (0–200, step 0.5). |
| PERT-ORAL-03 | Lipase-units/kg/meal input with default 1000 and config-driven range | Default in `pert-config.json` `defaults.oral.lipasePerKgPerMeal=1000`; range `inputs.lipasePerKgPerMeal` (500–4000, step 250). **(See Risk-1: this field name is semantically incorrect vs. xlsx — xlsx uses "lipase per g of fat".)** |
| PERT-ORAL-04 | Medication picker (Creon, Zenpep, Pancreaze, Pertzye, Viokace) via `<SelectPicker>` | `medications` from `config.ts`. 5 options, no search needed. |
| PERT-ORAL-05 | Strength picker filtered by selected medication | `getStrengthsForMedication(medicationId)` already in `config.ts`. |
| PERT-ORAL-06 | Hero output — capsules per dose `ROUNDUP((weight × lipasePerKg) / strength, 0)`, ±1% xlsx parity | **(See Risk-1 + Q-01 + Q-02: REQUIREMENTS formula contradicts xlsx oral B10 = `ROUND((fat × lipase_per_g) / strength, 0)`. Phase 3 parity tests will fail if Phase 2 ships REQUIREMENTS-as-written.)** |
| PERT-ORAL-07 | Secondary outputs — total lipase needed (`weight × lipasePerKg`), lipase per dose (`capsules × strength`) | Secondaries derive from result object. **(See Risk-1: total-lipase formula in REQUIREMENTS is also wrong relative to xlsx B9 = `fat × lipase_per_g`.)** |
| PERT-ORAL-08 | Tertiary "Estimated daily total (3 meals/day)" labeled as estimate | D-09 lock; render as `text-2xs` eyebrow + `text-base` value `class="num"`. |
| PERT-TUBE-01 | Weight input shared with Oral mode | Single `pertState.current.weightKg` at root of state shape. Already in place. |
| PERT-TUBE-02 | Pediatric formula picker via `<SelectPicker>` with all 17 formulas | `formulas` from `config.ts`. UI-SPEC §IA recommends `searchable={true}` (17 options). |
| PERT-TUBE-03 | Volume-per-day (mL) input via `<NumericInput>` with range advisory | Range `inputs.volumePerDayMl` (0–3000, step 10). |
| PERT-TUBE-04 | Lipase-units/kg/day input with default 1000 and config-driven range | Same as oral pattern. **(See Risk-1: same field-name semantic mismatch — xlsx tube B9 is "Lipase units per g" of FAT, default value 2500 in xlsx.)** |
| PERT-TUBE-05 | Medication + strength shared with Oral mode | At root of state shape. Already in place. |
| PERT-TUBE-06 | Hero output — capsules per day, parity within 1% of xlsx `B14` | xlsx tube B14 = `=ROUND(B12/B11, 0)` where `B12 = total_fat_g × lipase_per_g_of_fat`. **D-02 says `Math.ceil`; xlsx says ROUND. See Q-01.** |
| PERT-TUBE-07 | Secondary outputs — total fat (g), total lipase needed, lipase per kg (B13), capsules per month (B15 = `B14 × 30`) | All derivable from the result object. xlsx B13 = lipase per kg of body weight = `total_lipase / weight_kg`. **xlsx B13 default = 12000 — exceeds the 10,000 cap.** |
| PERT-MODE-01 | SegmentedToggle (Oral / Tube-Feed) with `role="tablist"`, ←/→/Home/End keyboard nav | SegmentedToggle live-verified at `src/lib/shared/components/SegmentedToggle.svelte:64` (`role="tablist"`) + lines 27–58 (full keyboard nav). No extra wiring needed. |
| PERT-MODE-02 | Mode persists; first-run defaults to Oral | Already in place via Phase 1 `pertState` localStorage singleton + `defaults.mode = 'oral'`. CONTEXT D-09 reinterprets PERT-MODE-02's sessionStorage spec as part of the unified localStorage blob. |
| PERT-MODE-03 | Shared state across modes — weight/medication/strength persist; mode-specific inputs persist independently | State shape already mode-split at root vs. `oral{}`/`tubeFeed{}` sub-objects (`PertStateData` in `types.ts`). Phase 2 just needs to not clobber sub-objects on toggle. |
| PERT-MODE-04 | Hero result region updates `aria-live="polite"` on mode switch and on input change | `<HeroResult>` already has `aria-live="polite" + aria-atomic="true"` at line 107. STOP-red advisory adds `role="alert" + aria-live="assertive"` per D-04. |
| PERT-SAFE-01 | Max-lipase STOP-red advisory when daily lipase > `weight × 10000` | D-03 + D-04 + D-05. Carve-out matches v1.13 GIR `8fde90e`. |
| PERT-SAFE-02 | Weight range advisory — blur-gated "Outside expected range — verify" via `<NumericInput showRangeError>` | Component handles automatically. **Em-dash latent bug in JSON message string — see Risk-2.** |
| PERT-SAFE-03 | Fat/volume range advisories — same pattern | Same as SAFE-02. |
| PERT-SAFE-04 | Empty-state messaging — when required inputs missing, hero shows neutral copy from `validationMessages` | D-08 gate; existing Phase-1 placeholder already renders empty-state copy. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack pin:** SvelteKit 2.55 + Svelte 5 (runes) + TypeScript 5.9 + Tailwind 4 + Vite 7–8 + `@vite-pwa/sveltekit` + `@sveltejs/adapter-static` + Vitest 4.1 + Playwright 1.58 + pnpm 10.33. **No new runtime dependencies.** [CITED: CLAUDE.md "Tech stack" section]
- **No native:** PWA-only. Phase 2 must NOT add Capacitor or native bindings.
- **Offline-first:** All clinical data embedded at build time — `pert-config.json` is already build-embedded. Phase 2 imports it via `config.ts`.
- **Accessibility:** WCAG 2.1 AA, 48px touch targets minimum, always-visible labels (no icon-only). Phase 2's SegmentedToggle pills, NumericInput, SelectPicker triggers all meet 48px floor (live verified — see Existing-pattern table).
- **GSD Workflow Enforcement:** Edit/Write/file-changing tools must go through GSD commands. Phase 2 lands via `/gsd-execute-phase`.
- **No new UI component libraries:** No shadcn / DaisyUI / Flowbite. Phase 2 reuses existing shared components only. New per-calculator component `<PertInputs />` allowed at `src/lib/pert/PertInputs.svelte` (mirrors `feeds/FeedAdvanceInputs.svelte`, `uac-uvc/UacUvcInputs.svelte`, `gir/GirInputs.svelte`).
- **OKLCH-only color, no `#hex`/RGB/HSL.** Phase 2 reads `--color-*` tokens from `app.css`; never inlines color.
- **Em-dash banned in user-rendered strings, aria-label, and screen-reader copy** — period, colon, semicolon, parentheses only. [CITED: DESIGN.md line 312] **Phase 2 must fix the 4 em-dash JSON strings (see Risk-2).**

## Summary

Phase 2 fills `<PertCalculator />`'s body with: (1) a SegmentedToggle bound to `pertState.current.mode`, (2) a per-mode result hero showing capsules per dose (oral) or capsules per day (tube-feed), (3) per-mode secondary outputs (total lipase, lipase per dose/kg, capsules per month, total fat g), (4) an "Estimated daily total" tertiary line in oral mode, (5) a STOP-red advisory card when daily lipase exceeds `weight × 10000`, (6) range-warning cards for weight/fat/volume, and (7) empty-state copy when required inputs are missing. A new sibling component `src/lib/pert/PertInputs.svelte` houses the inputs (drops into both desktop sticky aside and mobile InputDrawer in `+page.svelte`). Pure-function math lives in a new `src/lib/pert/calculations.ts`.

The structural patterns are well-precedented: `feeds/` is the closest UI + math analog (lines 198 `getTriggeredAdvisories` + lines 311–322 advisory render — Phase 2 mirrors and extends with a STOP-red branch), `gir/` is the STOP-red carve-out precedent (`OctagonAlert` + `--color-error`), `uac-uvc/` is the inputs-extracted-into-Inputs.svelte precedent. Every shared component Phase 2 needs is already in `src/lib/shared/components/`.

**The non-trivial finding:** the live `epi-pert-calculator.xlsx` (read this session via openpyxl) shows that the canonical xlsx oral capsule formula is `B10 = ROUND((fat_g × lipase_per_g_of_fat) / strength, 0)` — **xlsx ROUND, not ROUNDUP/CEILING; multiplied by FAT GRAMS, not by `weight × lipase_per_kg`**. This contradicts CONTEXT D-02 (which says `Math.ceil`) and CONTEXT D-05 / REQUIREMENTS PERT-ORAL-06 (which say `weight × lipasePerKg`). The tube-feed formula matches our state shape (`B14 = ROUND((fat_g_per_L × volume_mL/1000 × lipase_per_g) / strength, 0)`) — but again uses ROUND, not ROUNDUP. **If Phase 2 ships using the literal CONTEXT D-02 formula, Phase 3's ±1% spreadsheet-parity tests WILL fail in many fixture rows.** See Risk-1 and Open Questions Q-01..Q-03.

**Primary recommendation:** Wave structure (3 active waves + 1 verification gate):
- **Wave 0 (latent-bug fixes):** Em-dash audit on 4 advisory strings in `pert-config.json` (mechanical 4-line edit). RESEARCH-Q-01 must be resolved by user/planner BEFORE the calc-layer task locks (the rounding direction + multiplicand decision is a clinical contract, not Claude's discretion).
- **Wave 1 (calc layer):** `src/lib/pert/calculations.ts` with `computeOralResult()`, `computeTubeFeedResult()`, `getTriggeredAdvisories()`. Pure functions. Testable in isolation; Phase 3 vitest fixtures pin against xlsx.
- **Wave 2 (UI layer):** New `src/lib/pert/PertInputs.svelte` (SegmentedToggle + per-mode inputs + medication + strength) + replace `<PertCalculator />` body (compose calc results + advisory render with severity-DESC sort + empty-state gate). Drop `<PertInputs />` into `+page.svelte` desktop aside + mobile drawer (replacing the two Phase-1 "coming in Phase 2" placeholders).
- **Wave 3 (verification gate):** `pnpm check` + `pnpm test:run` + `pnpm build` + `CI=1 pnpm exec playwright test pert-a11y` — the 4 axe sweeps must stay green; existing `state.test.ts` + `config.test.ts` must still pass.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Capsule-count math (oral B10, tube B14) | Calc layer (`calculations.ts` pure functions) | — | D-01 + feeds analog. No state imports, fully testable. |
| Daily-lipase + max-lipase advisory threshold | Calc layer | Render layer (advisory card) | D-03 + D-05. Calc returns `dailyLipase` + the threshold check; render layer paints the STOP-red surface. |
| Range advisories (weight/fat/volume) | Calc layer (`getTriggeredAdvisories`) | UI inline error (NumericInput inherited) | Two coexisting surfaces per UI-SPEC: card-level config-driven advisory + per-field blur-gated inline error from NumericInput's existing `showRangeError`. |
| State persistence (mode + inputs) | State singleton (`pertState`) | Calc-layer DOES NOT import state | D-01: calc functions are pure; D-07: persist via existing `$effect`. |
| Mode switching | Component (`PertInputs.svelte` SegmentedToggle) | State (`pertState.current.mode`) | D-06. Two-way bind via `$bindable()` already in SegmentedToggle. |
| Empty-state gating | Render layer (`<PertCalculator />` `$derived` `isComputable`) | — | D-08. Required-input set checked at render time; calc-layer defaults to 0 on missing inputs (defensive double-check). |
| Strength reset on med change | State / `$effect` in `PertInputs.svelte` | — | D-11. Cleanest insertion point is an effect inside PertInputs that watches `medicationId` and writes `null` to `strengthValue`. (Could also be a wrapper in state.svelte.ts; keeping it in the component avoids modifying Phase-1-frozen state.svelte.ts.) |
| `aria-live` announcements | `<HeroResult>` (existing) + STOP-red `<section role="alert">` (Phase 2) | — | PERT-MODE-04. HeroResult's `aria-live="polite"` covers hero + mode switch + input change; STOP-red card adds `role="alert" aria-live="assertive"`. |

## Standard Stack

### Core (already pinned — Phase 2 introduces ZERO new runtime deps)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte 5 (runes) | ^5.55.0 | `$state`, `$derived`, `$effect`, `$bindable`, `$props` | Project-pinned. All shared components and `pertState` already use rune syntax. [VERIFIED: package.json + .svelte.ts files] |
| SvelteKit | ^2.55.0 | App framework, routing, `$lib` alias | Project-pinned. |
| TypeScript | ^5.9.3 | Type safety on `PertOralResult`, `PertTubeFeedResult`, `Advisory` (already exported in `types.ts`) | Project-pinned. |
| Tailwind CSS | ^4.2.2 | OKLCH tokens via `@tailwindcss/vite` | Project-pinned; tokens defined in `src/app.css`. |
| Vitest | ^4.1.2 | (Phase 3 owns parity tests; Phase 2 ships testable code only) | Project-pinned. |
| @lucide/svelte | (existing pin) | `OctagonAlert` (STOP-red), `AlertTriangle` (warning) | [VERIFIED: live import in `src/lib/gir/GirCalculator.svelte:8` — `OctagonAlert` is the correct export name; CONTEXT D-04's "AlertOctagon" is a typo.] |
| `bits-ui` (transitive) | (existing) | `Slider.Root` inside `<RangedNumericInput>` (weight) | Already gated; Phase 2 doesn't introduce new bits-ui usage. |

### Supporting (shared components — already in repo, no install needed)

| Component | Path | Phase 2 binding |
|-----------|------|-----------------|
| `<HeroResult>` | `src/lib/shared/components/HeroResult.svelte` | Hero render + `aria-live="polite"` already wired. Use `children` snippet (escape hatch) — see Code Examples §1. |
| `<SegmentedToggle>` | `src/lib/shared/components/SegmentedToggle.svelte` | Generic `<T extends string>`, `bind:value`, `role="tablist"`, ←/→/Home/End — all wired. |
| `<RangedNumericInput>` | `src/lib/shared/components/RangedNumericInput.svelte` | Weight (slider visible). |
| `<NumericInput>` | `src/lib/shared/components/NumericInput.svelte` | Fat (oral), Volume (tube), Lipase rate (both modes). `showRangeHint` + `showRangeError` default true. |
| `<SelectPicker>` | `src/lib/shared/components/SelectPicker.svelte` | Medication (5 opts), Strength (filtered), Formula (17 opts, `searchable={true}`). |
| `<InputDrawer>` | `src/lib/shared/components/InputDrawer.svelte` | Mobile drawer; already mounted in `+page.svelte`. |
| `<InputsRecap>` | `src/lib/shared/components/InputsRecap.svelte` | Mobile recap strip; already mounted in `+page.svelte`. Phase 2 may extend the `recapItems` derivation. |

### Alternatives Considered (and rejected)

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| Pure-function calculations.ts | Reference app's `runFormula` step engine (`/home/ghislain/src/pert-calculator/src/lib/dosing.ts`) | D-05 from Phase 1 chose feeds-shape over runFormula; Phase 2 mirrors. Simpler, easier to grep for the literal formula in one place. |
| Hard-coded `× 3` for oral daily total | xlsx-direct daily lipase | xlsx oral has NO daily-lipase cell; B11 is `weight × 10000` (the cap, not actual daily lipase). 3 meals/day is a clinical convention from the reference app — defensible but not xlsx-derived. |
| Single calculations.ts file | Split by mode (`oral.ts` + `tubeFeed.ts`) | feeds analog is single file (`calculations.ts` 250 lines). Phase 2's surface is similar (~150–200 lines). Single file is the established pattern. |
| `Math.ceil` rounding | `Math.round` (xlsx parity) | **CONTEXT D-02 locks `Math.ceil`. xlsx uses ROUND. See Q-01 — MUST resolve before calc-task lands.** |
| Custom advisory shape | Existing `getTriggeredAdvisories(advisories, inputs, results, mode)` | feeds analog is the project pattern; PERT mirrors. |

**Installation:** None. Phase 2 introduces no new packages. [VERIFIED: live `package.json` and Phase 1 STATE.md "Reuse first: existing shared components, no new shared components expected."]

**Version verification:** Skipped per project pin — Phase 2 does not bump any dependency. [VERIFIED: CLAUDE.md hard constraint "no new runtime deps"; Phase 1 verifier `aa60629` shows full suite green at current pins.]

## Architecture Patterns

### System Architecture Diagram

```
                         ┌────────────────────────────────────────┐
                         │   src/routes/pert/+page.svelte         │
                         │   (Phase-1 frozen except recap items)  │
                         └────────┬───────────────┬───────────────┘
                                  │               │
                       desktop md+│               │mobile <md
                                  ▼               ▼
                          ┌─────────────┐   ┌────────────────┐
                          │ <aside>     │   │ <InputDrawer/> │
                          │ sticky top  │   │  + InputsRecap │
                          └──────┬──────┘   └────────┬───────┘
                                 │                   │
                                 └────────┬──────────┘
                                          ▼
                            ┌─────────────────────────────┐
                            │  src/lib/pert/PertInputs    │ NEW Phase 2
                            │  .svelte                    │
                            │                             │
                            │ • SegmentedToggle (mode)    │
                            │ • RangedNumericInput weight │
                            │ • NumericInput(s) per mode  │
                            │ • SelectPicker formula      │
                            │ • SelectPicker med + str    │
                            └──────────────┬──────────────┘
                                           │ writes to
                                           ▼
                            ┌──────────────────────────────┐
                            │  pertState (singleton)       │  Phase-1 frozen
                            │  localStorage nicu_pert_state│
                            │  $effect → persist()         │
                            └──────────────┬───────────────┘
                                           │ read by
                                           ▼
                            ┌──────────────────────────────┐
                            │ src/lib/pert/PertCalculator  │  Phase 2 BODY REPLACED
                            │ .svelte                      │
                            │                              │
                            │  $derived isComputable      ─┼─→ if false: empty-state hero
                            │  $derived result            ─┼─→ if true: result hero + secondaries
                            │  $derived advisories        ─┼─→ STOP-red card | warning cards
                            └──────────────┬───────────────┘
                                           │ pure-function call
                                           ▼
                            ┌──────────────────────────────┐
                            │ src/lib/pert/calculations.ts │  NEW Phase 2
                            │                              │
                            │  computeOralResult(inputs)   │
                            │  computeTubeFeedResult(inp.) │
                            │  getTriggeredAdvisories(     │
                            │    mode, inputs, result,     │
                            │    advisoryConfig)           │
                            └──────────────┬───────────────┘
                                           │ reads
                                           ▼
                            ┌──────────────────────────────┐
                            │ src/lib/pert/config.ts       │  Phase-1 frozen
                            │  defaults / inputs / med /   │
                            │  formulas / advisories /     │
                            │  validationMessages          │
                            └──────────────────────────────┘
```

Data flow: clinician enters values into `<PertInputs />` → values are bound to `pertState.current.*` → the `$effect` in `<PertCalculator />` triggers `pertState.persist()` (localStorage write) → `<PertCalculator />`'s `$derived` reactivity recomputes `result` via `computeOralResult` / `computeTubeFeedResult` → result + raw inputs flow into `getTriggeredAdvisories` → the render layer paints hero / secondaries / advisories.

### Component Responsibilities

| Component | Owns | Does NOT own |
|-----------|------|--------------|
| `+page.svelte` | Route shell, `<aside>` + `<InputDrawer>` slot for `<PertInputs />`, `recapItems` derivation | Math; advisory rendering; empty-state gating |
| `<PertInputs />` (NEW) | SegmentedToggle, all per-mode inputs, strength-reset-on-med-change effect | Result rendering; advisory rendering |
| `<PertCalculator />` (BODY REPLACED) | Hero rendering (empty + valid), secondaries card, tertiary line, advisory cards (STOP-red + warning), empty-state gate | Inputs (lives in `<PertInputs />`); math (lives in `calculations.ts`) |
| `calculations.ts` (NEW) | Pure functions: `computeOralResult`, `computeTubeFeedResult`, `getTriggeredAdvisories` | UI; state imports; side effects |
| `pertState` (Phase-1 frozen) | `current` state shape, `persist()`, `init()`, `reset()` | Calculation results |
| `config.ts` (Phase-1 frozen) | Typed exports of JSON config, accessors | Math; UI |

### Recommended Project Structure (delta vs. Phase-1 baseline)

```
src/lib/pert/
├── types.ts                          (Phase-1 frozen)
├── pert-config.json                  (Phase-1 frozen — except em-dash audit Wave 0)
├── config.ts                         (Phase-1 frozen)
├── config.test.ts                    (Phase-1 frozen)
├── state.svelte.ts                   (Phase-1 frozen)
├── state.test.ts                     (Phase-1 frozen)
├── PertCalculator.svelte             (BODY REPLACED Phase 2 — outer space-y-6 + $effect kept)
├── PertInputs.svelte                 ★ NEW (Phase 2)
└── calculations.ts                   ★ NEW (Phase 2)
```

### Pattern 1: Calc-layer pure-function shape (mirrors `feeds/calculations.ts`)

**What:** Three top-level exports; no state imports; defensive null/zero handling.
**When to use:** All math in this phase. No exceptions.
**Example:**

```typescript
// src/lib/pert/calculations.ts (NEW Phase 2 — pseudo-shape, formula details Q-01-pending)
import type {
  PertStateData,
  PertOralResult,
  PertTubeFeedResult,
  Advisory,
  AdvisorySeverity
} from './types.js';

export interface TriggeredAdvisory {
  id: string;
  message: string;
  severity: AdvisorySeverity;
}

const MAX_LIPASE_UNITS_PER_KG_PER_DAY = 10000; // FDA-published pediatric cap (D-03 hard-coded)

export function computeOralResult(state: PertStateData): PertOralResult | null {
  const w = state.weightKg;
  const fat = state.oral.fatGrams;
  const lipasePerSomething = state.oral.lipasePerKgPerMeal;  // see Q-01 — semantics resolution pending
  const strength = state.strengthValue;

  // D-08 empty-state guard: any required input null/non-positive → null result.
  if (
    w == null || w <= 0 ||
    fat == null || fat < 0 ||
    lipasePerSomething == null || lipasePerSomething <= 0 ||
    strength == null || strength <= 0
  ) return null;

  // FORMULA — see Q-01. Two candidate shapes:
  //   (A) xlsx-parity: capsulesPerDose = ROUND((fat * lipasePerG) / strength, 0)
  //   (B) CONTEXT-as-written: capsulesPerDose = Math.ceil((w * lipasePerKg) / strength)
  // Pick ONE after Q-01 resolves; Phase 3 fixtures must agree.
  const totalLipase = fat * lipasePerSomething;             // xlsx oral B9 = B5*B6
  const capsulesPerDose = Math.round(totalLipase / strength); // xlsx oral B10 — ROUND
  const lipasePerDose = capsulesPerDose * strength;
  const estimatedDailyTotal = capsulesPerDose * 3;

  return { capsulesPerDose, totalLipase, lipasePerDose, estimatedDailyTotal };
}

export function computeTubeFeedResult(state: PertStateData, formulas: Formula[]): PertTubeFeedResult | null {
  const w = state.weightKg;
  const formula = formulas.find((f) => f.id === state.tubeFeed.formulaId);
  const volume = state.tubeFeed.volumePerDayMl;
  const lipasePerG = state.tubeFeed.lipasePerKgPerDay; // again — semantics see Q-01
  const strength = state.strengthValue;

  if (
    w == null || w <= 0 ||
    formula == null ||
    volume == null || volume <= 0 ||
    lipasePerG == null || lipasePerG <= 0 ||
    strength == null || strength <= 0
  ) return null;

  // xlsx tube B8 = ROUND(B6*B7/1000, 1)
  const totalFatG = Math.round((formula.fatGPerL * volume / 1000) * 10) / 10;
  // xlsx tube B12 = B8*B9
  const totalLipase = totalFatG * lipasePerG;
  // xlsx tube B13 = ROUND(B12/B4, 0)
  const lipasePerKg = Math.round(totalLipase / w);
  // xlsx tube B14 = ROUND(B12/B11, 0) — see Q-01
  const capsulesPerDay = Math.round(totalLipase / strength);
  // xlsx tube B15 = B14 * 30 (no rounding — B14 is already integer)
  const capsulesPerMonth = capsulesPerDay * 30;

  return { capsulesPerDay, totalLipase, totalFatG, lipasePerKg, capsulesPerMonth };
}

export function getTriggeredAdvisories(
  mode: 'oral' | 'tube-feed',
  state: PertStateData,
  result: PertOralResult | PertTubeFeedResult | null,
  advisoryConfig: Advisory[]
): TriggeredAdvisory[] {
  if (result == null) return []; // D-08: empty state hides all advisories
  const triggered: TriggeredAdvisory[] = [];

  // D-05: per-mode daily lipase
  const dailyLipase =
    mode === 'oral'
      ? (result as PertOralResult).capsulesPerDose * (state.strengthValue ?? 0) * 3
      : (result as PertTubeFeedResult).capsulesPerDay * (state.strengthValue ?? 0);

  for (const a of advisoryConfig) {
    if (a.mode !== mode && a.mode !== 'both') continue;

    // D-03: max-lipase-cap is hard-coded check
    if (a.id === 'max-lipase-cap') {
      const cap = (state.weightKg ?? 0) * MAX_LIPASE_UNITS_PER_KG_PER_DAY;
      if (cap > 0 && dailyLipase > cap) {
        triggered.push({ id: a.id, message: a.message, severity: a.severity });
      }
      continue;
    }

    // Standard outside-range / gt / lt comparisons against state inputs
    const fieldValue = (state as Record<string, unknown>)[a.field];
    // ... feeds-style comparator dispatch (gt/gte/lt/lte/outside)
  }

  // D-10: severity DESC
  return triggered.sort((x, y) => (x.severity === 'stop' ? -1 : y.severity === 'stop' ? 1 : 0));
}
```

[Source: feeds analog `src/lib/feeds/calculations.ts:198-247`; types from `src/lib/pert/types.ts`; xlsx formulas verified via openpyxl read of `pert-calculator-pediatric-updated.xlsx` this session]

### Pattern 2: Result hero with `children` snippet escape hatch (mirrors `uac-uvc/UacUvcCalculator.svelte` and Phase-1 `PertCalculator.svelte`)

**What:** Use `<HeroResult>`'s `children` snippet to render the promoted-PERT eyebrow + numeral + unit. Phase 1 placeholder already uses this pattern for empty-state; Phase 2 adds the valid-state numeral.
**When to use:** Whenever a calculator's hero needs a custom shape (paired labels, mode-specific qualifier). Default `<HeroResult>` props give a single eyebrow + value + unit; `children` is the escape hatch for promoted-label variants.
**Example:**

```svelte
<!-- src/lib/pert/PertCalculator.svelte (Phase 2 hero shape) -->
<HeroResult
  eyebrow="PERT"
  value=""
  pulseKey={result ? `${mode}-${capsulesValue}` : `empty-${mode}`}
  ariaLabel="PERT capsule dose"
  numericValue={capsulesValue ?? null}
>
  {#snippet children()}
    <div class="flex flex-col gap-2">
      <div class="flex items-baseline gap-3">
        <span class="text-title font-black tracking-tight text-[var(--color-identity)] uppercase">
          PERT
        </span>
        <span class="text-2xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
          {mode === 'tube-feed' ? 'Tube-feed dose' : 'Oral dose'}
        </span>
      </div>
      {#if result}
        <div class="flex items-baseline gap-2">
          <span class="num text-display font-black text-[var(--color-text-primary)]">
            {capsulesValue}
          </span>
          <span class="text-ui font-medium text-[var(--color-text-secondary)]">
            {mode === 'oral' ? 'capsules/dose' : 'capsules/day'}
          </span>
        </div>
      {:else}
        <p class="text-ui text-[var(--color-text-secondary)]">{emptyMessage}</p>
      {/if}
    </div>
  {/snippet}
</HeroResult>
```

[Source: live `src/lib/pert/PertCalculator.svelte:25-50` (empty-state) + `src/lib/uac-uvc/UacUvcCalculator.svelte:35-100` (paired hero with children snippet)]

### Pattern 3: STOP-red advisory render branch (extends the feeds neutral pattern with a severity check)

**What:** A single `{#each}` block over triggered advisories with a conditional class set by `severity`.
**When to use:** Phase 2's advisory render. Mirrors `feeds/FeedAdvanceCalculator.svelte:311-322` neutral card and adds a STOP-red branch.
**Example:**

```svelte
<!-- src/lib/pert/PertCalculator.svelte advisories section -->
<script lang="ts">
  import { OctagonAlert, AlertTriangle } from '@lucide/svelte';
</script>

{#each triggeredAdvisories as advisory (advisory.id)}
  {#if advisory.severity === 'stop'}
    <section
      class="flex items-start gap-3 rounded-xl border-2 border-[var(--color-error)] bg-[var(--color-surface-card)] px-4 py-3"
      role="alert"
      aria-live="assertive"
    >
      <OctagonAlert
        size={20}
        class="mt-0.5 shrink-0 text-[var(--color-error)]"
        aria-hidden="true"
      />
      <p class="text-ui font-bold text-[var(--color-error)]">{advisory.message}</p>
    </section>
  {:else}
    <div
      class="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3"
      role="note"
    >
      <AlertTriangle
        size={20}
        class="mt-0.5 shrink-0 text-[var(--color-text-secondary)]"
        aria-hidden="true"
      />
      <p class="text-ui font-semibold text-[var(--color-text-primary)]">{advisory.message}</p>
    </div>
  {/if}
{/each}
```

[Source: `feeds/FeedAdvanceCalculator.svelte:311-322` neutral pattern + `gir/GirCalculator.svelte:8-119` STOP-red carve-out (`OctagonAlert` + `--color-error`)]

### Pattern 4: D-11 strength-reset-on-medication-change

**What:** A `$effect` inside `<PertInputs />` that watches `pertState.current.medicationId` and writes `null` to `pertState.current.strengthValue` whenever it changes. Cleanest insertion point — keeps Phase-1-frozen `state.svelte.ts` untouched and avoids tangling the SelectPicker component.
**When to use:** Exactly once, in `PertInputs.svelte`. Edge case: don't fire on initial mount with a previously-persisted `medicationId` (the user landed back here with a medication selected — strength shouldn't reset).
**Example:**

```svelte
<script lang="ts">
  import { pertState } from './state.svelte.js';
  // ...
  let prevMedicationId: string | null = $state(pertState.current.medicationId);

  $effect(() => {
    const next = pertState.current.medicationId;
    if (next !== prevMedicationId) {
      // Skip the initial run (prevMedicationId is initialised from current value)
      // — only reset when an actual change happened mid-session.
      pertState.current.strengthValue = null;
      prevMedicationId = next;
    }
  });
</script>
```

[Pattern reference: feeds `kcalPerOzStr` sync effect at `src/lib/feeds/FeedAdvanceInputs.svelte:62-74` (similar "watch a value, reflect to another field" idiom)]

### Anti-Patterns to Avoid

- **Anti-pattern: Using `Math.ceil` blindly because CONTEXT D-02 says so.** xlsx uses ROUND. Phase 3's ±1% parity gate WILL fail on a non-trivial fraction of fixtures if Phase 2 ships ceiling-rounded. **Resolve Q-01 first.** [VERIFIED: openpyxl read of xlsx oral B10 + tube B14 — both `=ROUND(...,0)`]
- **Anti-pattern: Putting strength-reset logic inside `state.svelte.ts`.** State.svelte.ts is Phase-1-frozen and verified at 6/6 tests + 361 full-suite. Adding side-effect logic to the singleton would expand its surface and require new tests; the effect belongs in the component layer (D-11 is a UX behavior, not a persistence behavior).
- **Anti-pattern: Re-mounting the secondaries section on every keystroke.** Use `$derived` to compute the result object once, then conditionally render with `{#if result}` — never `{#key ...}` around the secondaries (the existing HeroResult pulse uses class-toggle to avoid remount; Phase 2 must not regress that).
- **Anti-pattern: Inline em-dash in svelte template strings.** Phase 2 must NOT introduce any em-dash; the JSON-side audit (Risk-2) is mechanical but the executor will be tempted to "match the JSON" if the JSON still has em-dashes at write time. Order: Wave-0 fix the JSON FIRST, then Wave-1 lands calc, then Wave-2 lands UI.
- **Anti-pattern: Identity color on advisory chrome.** UI-SPEC §Color "Identity-purple BANNED in Phase 2 from advisory cards / borders / message text". Use `--color-error` for STOP-red, `--color-text-primary` + `--color-surface-alt` for warnings.
- **Anti-pattern: Adding identity color to the SegmentedToggle TRACK.** Track is `--color-surface-alt` chrome; the active pill is the identity carrier. (SegmentedToggle.svelte already has this right; Phase 2 just doesn't override it.)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Numeric input with range hint + blur-gated error + wheel-step + decimal `inputmode` | Custom `<input type="number">` | `<NumericInput>` (live verified `src/lib/shared/components/NumericInput.svelte`) | 215 lines of accumulated edge cases (wheel-passive override, decimal precision via `typeStep`, blur-gated error, slide transition gated on prefers-reduced-motion). |
| Numeric input + slider with bidirectional sync | NumericInput + bits-ui Slider hand-wired | `<RangedNumericInput>` | The slider/textbox sync has subtle echo-suppression logic (lines 60–96 of RangedNumericInput) — don't duplicate. |
| Mode toggle with keyboard nav + role=tablist | Custom buttons + manual `keydown` | `<SegmentedToggle>` | ←/→/Home/End wraparound and aria-selected propagation already correct. |
| Searchable dropdown for 17 formulas with bottom-sheet on mobile | Custom dialog | `<SelectPicker searchable={true}>` | 304-line component; native `<dialog>`, escape handling, search filter, focus management, aria roles. |
| Mobile bottom-sheet drawer that slides up | Custom dialog | `<InputDrawer>` | iOS Safari quirks already solved; reduced-motion gating; safe-area-inset. |
| Hero card with eyebrow/numeral/unit/pulse + ratio-jump warning + aria-live | Custom hero | `<HeroResult>` | 158-line component; the "Large change. Verify input." caption fires automatically on ≥2× ratio jumps — Phase 2 just passes `numericValue`. |
| Severity-DESC sort of advisories | Custom sort then render | One-liner sort in `getTriggeredAdvisories` return | `[...arr].sort((x,y) => x.severity==='stop' ? -1 : y.severity==='stop' ? 1 : 0)` — 1 line. |
| `Math.ceil(x)` to "round up to whole capsules" | Custom `roundUpToWhole(x)` helper | Either `Math.ceil(x)` (if Q-01 resolves to ceiling) or `Math.round(x)` (if Q-01 resolves to xlsx-parity) | JS built-ins handle Infinity/NaN sensibly; defensive empty-state gate (D-08) prevents those reaching the math anyway. |

**Key insight:** Every UI primitive Phase 2 needs already exists. The unique work is (1) the calc-layer pure functions, (2) the Phase 2 component composition (PertCalculator body + new PertInputs), (3) the em-dash audit, and (4) the STOP-red branch in the advisory render. Nothing in the shared library needs modification.

## Common Pitfalls

### Pitfall 1: Persist storms from many reactive inputs
**What goes wrong:** Adding 7+ NumericInput / SelectPicker bindings to `pertState.current.*` causes the existing `$effect` to fire `persist()` on every keystroke. Each persist() does `JSON.stringify(this.current)` + `localStorage.setItem` + `lastEdited.stamp()`. On a slow device, a clinician typing "1500" produces 4 stringify+writes.
**Why it happens:** `pertState.current` is a single `$state` object; every key mutation marks the whole proxy dirty for any `JSON.stringify(pertState.current)` reader.
**How to avoid:** This is the established pattern across feeds/uac-uvc/gir — they all do the same thing. The shared `<NumericInput>` only writes on actual value change (it doesn't fire on every focus event). LocalStorage writes are synchronous but cheap (the JSON blob is < 500 bytes). The `lastEdited.stamp()` is a single `Date.now()`. **No optimization needed; this is acceptable.** [VERIFIED: feeds analog `src/lib/feeds/FeedAdvanceInputs.svelte:35-38` — same `$effect` pattern; full vitest suite green at 361/361.]
**Warning signs:** Devtools Performance tab showing localStorage on the main thread — but only matters if the JSON exceeds ~10kB, which PERT's blob does not.

### Pitfall 2: Floating-point drift in `Math.ceil` (or `Math.round`) after division
**What goes wrong:** `Math.ceil(0.999999999)` returns 1, not 0 — fine. But `Math.ceil((25 * 2000) / 12000)` is `Math.ceil(4.16666...)` = 5, while the same computation in xlsx (which carries 15-digit double precision and rounds at display) returns ROUND(4.166...) = 4. If Phase 2 ships `Math.ceil` and Phase 3 fixtures expect ROUND, the per-fixture diff is ≥ 1 capsule, which exceeds the 1% epsilon for small capsule counts.
**Why it happens:** 64-bit floats represent decimal fractions imprecisely. `0.1 + 0.2 !== 0.3` in JS. xlsx and JS both use IEEE-754 doubles, so the *underlying* double is identical between xlsx and JS — but xlsx's ROUND and JS's `Math.round` both follow banker's rounding for `.5` ties, so for the typical fixture rows the answers MATCH. The drift is only a problem when `Math.ceil` vs `Math.round` produce different integers (always when the value isn't exactly an integer).
**How to avoid:** Resolve Q-01: pick `Math.round` for xlsx parity OR add a parity-tolerance epsilon. Don't pre-round to N decimals before the final round/ceil — that adds error rather than removing it. **Test fixture sketch**: weight=10, fat=25, lipasePerG=2000, Creon strength=12000 → xlsx B10 = 4 capsules. `Math.ceil(50000/12000)` = `Math.ceil(4.1666...)` = 5. `Math.round(50000/12000)` = 4. **Phase 3 will catch this; Phase 2 must not assume `Math.ceil` is correct.**
**Warning signs:** Spec says "round up to whole capsules" but xlsx says ROUND — clinical "always round up so the patient gets enough enzyme" intuition contradicts xlsx-as-canonical-truth.

### Pitfall 3: `Pertzye=2.0` re-injection through partial-merge state restore
**What goes wrong:** Phase 1 verified that the FDA-allowlist filter at `config.ts:13-19` strips `Pertzye=2.0` at config load. But `pertState.current.strengthValue` is a `number | null` written directly from the SelectPicker — if a malicious / corrupted localStorage blob has `strengthValue: 2.0` AND `medicationId: 'pertzye'`, the SelectPicker won't be open to filter it. The state.svelte.ts `init()` defensive merge (lines 41–55) accepts any `Partial<PertStateData>` JSON.
**Why it happens:** State persistence layer trusts what's already in localStorage. The trust boundary is the SelectPicker, which only renders allowlisted strengths — but state can carry a value that wasn't selected via the picker.
**How to avoid:** Phase 2's calc-layer should defensively cross-check `state.strengthValue` against the allowlist before computing. One simple approach: in `computeOralResult`/`computeTubeFeedResult`, look up the medication via `getMedicationById(state.medicationId)` and verify `med.strengths.includes(state.strengthValue)` before computing — return `null` if not. This is defense-in-depth, not paranoia: state restored from older / corrupted blobs is a real failure mode in PWAs (test users wipe disk, get partial migrations).
**Warning signs:** Phase 3 component test for "stale persisted state with Pertzye=2.0 doesn't compute a hero" failing.

### Pitfall 4: Mode-switch clobbers the other mode's inputs
**What goes wrong:** When the user switches Oral → Tube-Feed and back, `pertState.current.oral.fatGrams` should still be there (PERT-MODE-03). State shape is correct (D-10 nests sub-objects) but a careless code snippet that does `pertState.current.oral = {}` or destructures + reassigns `pertState.current = {...other...}` would lose the unwritten branch.
**Why it happens:** Svelte 5 `$state` is a deep proxy — partial updates work. But helper functions like `defaultState()` always return BOTH `oral` and `tubeFeed` sub-objects, and Phase 1's defensive merge (`init()` lines 46–51) preserves both. The risk is in Phase 2 code that touches the state shape.
**How to avoid:** All Phase 2 mutations target a leaf field (`pertState.current.oral.fatGrams = 25`, `pertState.current.tubeFeed.formulaId = '...'`). Never re-assign `pertState.current.oral = {...}` or `pertState.current = {...}`. The SegmentedToggle's `bind:value={pertState.current.mode}` only writes the leaf `mode` — no risk there.
**Warning signs:** A Phase 3 e2e test where the user enters fat in Oral, switches to Tube-Feed, switches back, and the fat input is empty — that would surface this bug.

### Pitfall 5: Hero `pulseKey` re-firing on every keystroke vs. only on value change
**What goes wrong:** If `pulseKey` is set to a string-stringified state blob (e.g. `JSON.stringify(state)`) the pulse fires on every keystroke including ones that don't change the result (typing "12" → "120" → backspace → "12"). HeroResult's pulse animation is gated on prefers-reduced-motion but visible animation noise is still a UX regression.
**Why it happens:** Easy to write a too-coarse pulse key. `<HeroResult>`'s `lastPulseKey` only re-fires when the key changes, but if you key on the input string, every keystroke is a new key.
**How to avoid:** Key on the result value (e.g. `pulseKey={result ? \`${mode}-${capsulesValue}\` : \`empty-${mode}\`}`). Mode change forces a new key (mode prefix differs); value change forces a new key; same value → same key → no pulse re-fire. This is exactly what UAC/UVC does (`uacUvcState.current.weightKg?.toFixed(2)` at `src/lib/uac-uvc/UacUvcCalculator.svelte:12`).
**Warning signs:** The hero pulses on every keystroke instead of just on result-changing edits.

### Pitfall 6: Empty-state gate races with calc-layer null-return
**What goes wrong:** Two empty-state mechanisms exist: (a) D-08's render-layer `$derived isComputable` boolean, (b) calc-layer null-return when any required input is missing/non-positive. If only (a) is enforced and (b) is missing, a partial input set could produce `Math.ceil(0/strength) = 0` or `Math.ceil(weight*lipase/0) = Infinity`. If only (b) is enforced and (a) is missing, the secondaries card might still render with placeholder text.
**Why it happens:** D-08 says "math layer returns 0 for capsule fields" but the practical safer behavior is "calc returns null when inputs incomplete; render layer checks `if (result == null)`". The two mechanisms reinforce each other; neither alone is sufficient.
**How to avoid:** Pattern 1's example shape returns `null` on missing inputs (recommended) AND the render layer gates on `if (result)` for secondaries/STOP-red. Empty hero copy is rendered in the `{:else}` branch. This is exactly what `uac-uvc/UacUvcCalculator.svelte:11-21` does (`result = $derived(calculateUacUvc(uacUvcState.current))` returns `null` when `weightKg == null`).
**Warning signs:** Hero shows "0 capsules/dose" on first visit instead of the empty-state copy.

### Pitfall 7: Two `<PertInputs />` instances on desktop sharing wrong state
**What goes wrong:** `+page.svelte` renders `<PertInputs />` once in the `<aside>` (md+) and once inside `<InputDrawer>` (mobile-only). On md+ both could exist in the DOM if the dialog is in the closed state; both bind to `pertState`. Two-way binds firing simultaneously could race.
**Why it happens:** Modal `<dialog>` is mounted but not visible until `showModal()`. Both component trees could read `pertState.current` reactively.
**How to avoid:** `pertState` is a singleton. Both component instances bind to the SAME proxy. Svelte 5's `$state` proxy serializes writes (synchronous mutate), so even with two bound `<NumericInput>`s on the same field, the last write wins and both inputs render the new value reactively. **No special handling needed; this is the established pattern across feeds/uac-uvc/gir.** The `<InputDrawer>` doesn't unmount on `expanded=false` — the dialog stays in DOM with `display: none` via the `[open]` selector. Verified safe by Phase-1 verifier across the existing 5 calculators. [VERIFIED: feeds analog `+page.svelte` does the same dual-mount; full e2e suite + axe sweeps green.]
**Warning signs:** A Phase 3 e2e test where typing into the desktop aside doesn't update the mobile drawer's input on viewport resize — would surface this if it were broken (it's not).

## Code Examples

### Example 1: Empty-state gate + valid-result hero (single component, Phase 2 PertCalculator body)

```svelte
<script lang="ts">
  import { computeOralResult, computeTubeFeedResult, getTriggeredAdvisories } from './calculations.js';
  import { pertState } from './state.svelte.js';
  import { advisories, formulas, validationMessages } from './config.js';
  import HeroResult from '$lib/shared/components/HeroResult.svelte';
  import { OctagonAlert, AlertTriangle } from '@lucide/svelte';

  // Per D-08: derive the result object; null if any required input missing.
  let oralResult = $derived(
    pertState.current.mode === 'oral' ? computeOralResult(pertState.current) : null
  );
  let tubeFeedResult = $derived(
    pertState.current.mode === 'tube-feed' ? computeTubeFeedResult(pertState.current, formulas) : null
  );
  let result = $derived(oralResult ?? tubeFeedResult);

  // Hero numeral
  let capsulesValue = $derived(
    oralResult?.capsulesPerDose ?? tubeFeedResult?.capsulesPerDay ?? null
  );

  // Empty-state copy + pulse key
  let emptyMessage = $derived(
    pertState.current.mode === 'tube-feed' ? validationMessages.emptyTubeFeed : validationMessages.emptyOral
  );
  let pulseKey = $derived(
    result ? `${pertState.current.mode}-${capsulesValue}` : `empty-${pertState.current.mode}`
  );

  // Advisories
  let triggered = $derived(
    getTriggeredAdvisories(pertState.current.mode, pertState.current, result, advisories)
  );

  // Phase 1 carry-over: persist on any state change.
  $effect(() => {
    JSON.stringify(pertState.current);
    pertState.persist();
  });
</script>

<div class="space-y-6">
  <!-- Hero (empty + valid via children snippet) -->
  <HeroResult
    eyebrow="PERT"
    value=""
    {pulseKey}
    ariaLabel="PERT capsule dose"
    numericValue={capsulesValue}
  >
    {#snippet children()}
      <div class="flex flex-col gap-2">
        <div class="flex items-baseline gap-3">
          <span class="text-title font-black tracking-tight text-[var(--color-identity)] uppercase">
            PERT
          </span>
          <span class="text-2xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
            {pertState.current.mode === 'tube-feed' ? 'Tube-feed dose' : 'Oral dose'}
          </span>
        </div>
        {#if result}
          <div class="flex items-baseline gap-2">
            <span class="num text-display font-black text-[var(--color-text-primary)]">{capsulesValue}</span>
            <span class="text-ui font-medium text-[var(--color-text-secondary)]">
              {pertState.current.mode === 'oral' ? 'capsules/dose' : 'capsules/day'}
            </span>
          </div>
        {:else}
          <p class="text-ui text-[var(--color-text-secondary)]">{emptyMessage}</p>
        {/if}
      </div>
    {/snippet}
  </HeroResult>

  <!-- Secondaries (only when result is computed) -->
  {#if oralResult}
    <section class="card">
      <div class="flex flex-col divide-y divide-[var(--color-border)]">
        <!-- Total lipase needed -->
        <div class="flex items-baseline justify-between px-5 py-4">
          <div>
            <div class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase">
              Total lipase needed
            </div>
            <div class="flex items-baseline gap-2">
              <span class="num text-title font-bold text-[var(--color-text-primary)]">
                {oralResult.totalLipase.toLocaleString('en-US')}
              </span>
              <span class="text-ui text-[var(--color-text-secondary)]">units/dose</span>
            </div>
          </div>
        </div>
        <!-- Lipase per dose + tertiary daily total — abbreviated for example -->
      </div>
    </section>
  {:else if tubeFeedResult}
    <!-- Tube-feed secondaries: total fat g, total lipase, lipase/kg, capsules/month -->
  {/if}

  <!-- Advisories: STOP-red first (severity DESC), then warnings -->
  {#each triggered as advisory (advisory.id)}
    {#if advisory.severity === 'stop'}
      <section
        class="flex items-start gap-3 rounded-xl border-2 border-[var(--color-error)] bg-[var(--color-surface-card)] px-4 py-3"
        role="alert"
        aria-live="assertive"
      >
        <OctagonAlert size={20} class="mt-0.5 shrink-0 text-[var(--color-error)]" aria-hidden="true" />
        <p class="text-ui font-bold text-[var(--color-error)]">{advisory.message}</p>
      </section>
    {:else}
      <div
        class="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3"
        role="note"
      >
        <AlertTriangle size={20} class="mt-0.5 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />
        <p class="text-ui font-semibold text-[var(--color-text-primary)]">{advisory.message}</p>
      </div>
    {/if}
  {/each}
</div>
```

[Source: composes (1) Phase-1 placeholder shape, (2) `feeds/FeedAdvanceCalculator.svelte:109-322`, (3) `uac-uvc/UacUvcCalculator.svelte:22-101`, (4) `gir/GirCalculator.svelte:8-119` STOP-red precedent. xlsx-confirmed formulas pending Q-01 resolution.]

### Example 2: PertInputs.svelte composition (mobile drawer + desktop aside)

```svelte
<!-- src/lib/pert/PertInputs.svelte (NEW Phase 2) -->
<script lang="ts">
  import { pertState } from './state.svelte.js';
  import { inputs, medications, formulas, getStrengthsForMedication } from './config.js';
  import SegmentedToggle from '$lib/shared/components/SegmentedToggle.svelte';
  import RangedNumericInput from '$lib/shared/components/RangedNumericInput.svelte';
  import NumericInput from '$lib/shared/components/NumericInput.svelte';
  import SelectPicker from '$lib/shared/components/SelectPicker.svelte';
  import type { SelectOption } from '$lib/shared/types.js';

  // D-11: reset strength when medication changes mid-session.
  // Initialize tracker from current state to avoid resetting on first render
  // when the user lands with a previously-persisted medication+strength pair.
  let prevMed: string | null = $state(pertState.current.medicationId);
  $effect(() => {
    const next = pertState.current.medicationId;
    if (next !== prevMed) {
      pertState.current.strengthValue = null;
      prevMed = next;
    }
  });

  let medOptions: SelectOption[] = $derived(
    medications.map((m) => ({ value: m.id, label: m.brand }))
  );
  let strengthOptions: SelectOption[] = $derived.by(() => {
    if (!pertState.current.medicationId) return [];
    const strengths = getStrengthsForMedication(pertState.current.medicationId);
    return strengths.map((s) => ({ value: String(s), label: `${s.toLocaleString('en-US')} units` }));
  });
  let formulaOptions: SelectOption[] = formulas.map((f) => ({ value: f.id, label: f.name }));

  // String-to-number bridge for strength SelectPicker
  let strengthStr = $state(
    pertState.current.strengthValue == null ? '' : String(pertState.current.strengthValue)
  );
  $effect(() => {
    if (strengthStr === '') {
      if (pertState.current.strengthValue !== null) pertState.current.strengthValue = null;
    } else {
      const n = parseInt(strengthStr, 10);
      if (!isNaN(n) && n !== pertState.current.strengthValue) pertState.current.strengthValue = n;
    }
  });
  $effect(() => {
    const cur = pertState.current.strengthValue == null ? '' : String(pertState.current.strengthValue);
    if (cur !== strengthStr) strengthStr = cur;
  });

  // Defensive persist (calculator's $effect also fires; defensive in mobile-drawer-isolated mount)
  $effect(() => {
    JSON.stringify(pertState.current);
    pertState.persist();
  });
</script>

<div class="space-y-4">
  <SegmentedToggle
    label="Mode"
    bind:value={pertState.current.mode}
    options={[{ value: 'oral', label: 'Oral' }, { value: 'tube-feed', label: 'Tube-Feed' }]}
    ariaLabel="PERT mode"
  />

  <RangedNumericInput
    bind:value={pertState.current.weightKg}
    label="Weight"
    suffix="kg"
    min={inputs.weightKg.min}
    max={inputs.weightKg.max}
    step={inputs.weightKg.step}
    typeStep={0.01}
    placeholder="3.0"
    id="pert-weight"
  />

  {#if pertState.current.mode === 'oral'}
    <NumericInput
      bind:value={pertState.current.oral.fatGrams}
      label="Fat per meal"
      suffix="g"
      min={inputs.fatGrams.min}
      max={inputs.fatGrams.max}
      step={inputs.fatGrams.step}
      placeholder="25"
      id="pert-fat-grams"
    />
    <NumericInput
      bind:value={pertState.current.oral.lipasePerKgPerMeal}
      label="Lipase per gram of fat"
      suffix="units/g"
      min={inputs.lipasePerKgPerMeal.min}
      max={inputs.lipasePerKgPerMeal.max}
      step={inputs.lipasePerKgPerMeal.step}
      placeholder="2000"
      id="pert-lipase-oral"
    />
  {:else}
    <SelectPicker
      label="Formula"
      value={pertState.current.tubeFeed.formulaId ?? ''}
      onValueChange={(v) => (pertState.current.tubeFeed.formulaId = v || null)}
      options={formulaOptions}
      searchable={true}
      placeholder="Select pediatric formula"
    />
    <NumericInput
      bind:value={pertState.current.tubeFeed.volumePerDayMl}
      label="Volume per day"
      suffix="mL"
      min={inputs.volumePerDayMl.min}
      max={inputs.volumePerDayMl.max}
      step={inputs.volumePerDayMl.step}
      placeholder="1000"
      id="pert-volume"
    />
    <NumericInput
      bind:value={pertState.current.tubeFeed.lipasePerKgPerDay}
      label="Lipase per gram of fat"
      suffix="units/g"
      min={inputs.lipasePerKgPerDay.min}
      max={inputs.lipasePerKgPerDay.max}
      step={inputs.lipasePerKgPerDay.step}
      placeholder="2500"
      id="pert-lipase-tube"
    />
  {/if}

  <SelectPicker
    label="Medication"
    value={pertState.current.medicationId ?? ''}
    onValueChange={(v) => (pertState.current.medicationId = v || null)}
    options={medOptions}
    placeholder="Select medication"
  />

  <SelectPicker
    label="Strength"
    bind:value={strengthStr}
    options={strengthOptions}
    placeholder="Select strength"
  />
</div>
```

> **CAVEAT on `SelectPicker` value bind:** the live SelectPicker exposes `value = $bindable()` of type `string`. The state shape carries `medicationId: string | null`. The planner must verify whether SelectPicker accepts null directly or requires a `null → ''` bridge (the example uses an explicit `onValueChange` callback as a defensive bridge — read SelectPicker.svelte line 9 to confirm; if it accepts `bind:value` against a state field that may be null, simplify accordingly). **[VERIFIED in this session: SelectPicker line 9 declares `value: string;` not nullable; a bridge IS required.]**

[Source: feeds analog `src/lib/feeds/FeedAdvanceInputs.svelte:55-74` for SelectPicker string bridge; uac-uvc analog for state binding pattern; live SelectPicker.svelte for the value contract]

### Example 3: getTriggeredAdvisories with severity-DESC sort

See Pattern 1 above. The key one-liner:

```typescript
return triggered.sort((x, y) => (x.severity === 'stop' ? -1 : y.severity === 'stop' ? 1 : 0));
```

This is a stable sort that places all `severity:'stop'` first, preserving JSON-config order within tier (D-10). For Phase 2's 4 advisories (1 stop + 3 warnings), this is sufficient. If a future phase adds a third severity tier, the sort needs to be replaced with a numeric severity rank.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Reference app: `runFormula` step engine + JSON formula DSL | Plain TypeScript pure functions matching xlsx cells directly | Phase 1 D-05 | Simpler to grep / test; no DSL execution layer; clinical-data-as-code (numbers in JSON, math in TS). |
| Reference app: `Math.round` (xlsx ROUND) | **CONTEXT D-02 says `Math.ceil`** (xlsx ROUNDUP) — but xlsx itself uses ROUND | CONTEXT D-02 lock | **CONFLICT — see Q-01.** REQUIREMENTS PERT-ORAL-06 says ROUNDUP; xlsx says ROUND. CONTEXT codified ROUNDUP. xlsx is the parity authority. |
| sessionStorage (PERT-MODE-02 spec) | localStorage (Phase 1 D-09 reinterpretation) | Phase 1 D-09 | Aligns with the 5 existing calculators. |
| First-run favorites order: `[morphine-wean, formula, gir, feeds]` (v1.13) | Alphabetical: `[feeds, formula, gir, morphine-wean]` (Phase 1 D-19/D-20) | Phase 1 | Already shipped; Phase 2 has no work here. |

**Deprecated/outdated:**
- `Math.round` is NOT used in pert calc-layer — but Q-01 may put it back if the planner reads xlsx-as-canonical and overrides D-02.
- `lipasePerKgPerMeal` field name (semantically misleading vs. xlsx) — not deprecated, but the field LABEL in the UI should clarify "Lipase per gram of fat" not "Lipase per kg per meal" if Q-01 confirms xlsx semantics. See Open Questions Q-03.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `Pertzye=2.0` corrupted-state attack surface (Pitfall 3) is worth defensive code in the calc layer | Common Pitfalls | If the planner deems this paranoia, the calc layer skips the `med.strengths.includes(strength)` cross-check. Phase 1's allowlist filter at config-load time handles 99% of cases; the remaining 1% is corrupted localStorage. Risk: low (the FDA filter strips at module load; only stale stored state is the failure mode). |
| A2 | `<SelectPicker>` doesn't accept null/undefined as `value` and requires a `null → ''` bridge | Code Example 2 | If SelectPicker handles null gracefully (which it does NOT in the live code — `selectedLabel` falls through to placeholder which is fine, but `value === undefined` would be type-error in `$bindable<string>()`), the bridge is unnecessary boilerplate. **[VERIFIED in this session: line 9 declares `value: string;` — bridge IS required.]** |
| A3 | Mode-switch state preservation (PERT-MODE-03) does NOT need explicit code in Phase 2 — the state shape's mode-split is sufficient | Architectural Responsibility Map | If the test ever fires "switch Oral → Tube-Feed → Oral, fat input is empty," the assumption is wrong. Mitigation: Phase 3 e2e test catches it; Phase 2 just doesn't introduce code that wipes sub-objects. |
| A4 | The calculator's `$effect` already in PertCalculator.svelte's placeholder is sufficient for persist; no per-input persist call needed | Pattern 4 + Pitfall 1 | The feeds analog runs persist from BOTH the calculator AND the inputs component (defensive when mounted in isolation). Phase 2's `<PertInputs />` should mirror that defensive double-effect — see code Example 2 line "Defensive persist (calculator's $effect also fires; defensive in mobile-drawer-isolated mount)". Risk if wrong: drawer-only mount on a slow first-paint scenario could miss a persist. Mitigation: belt-and-braces by mirroring feeds. |
| A5 | The xlsx default Tube-Feed B13 = 12000 (which exceeds 10,000 cap) is intentional clinical content suitable as a Phase 3 STOP-red fixture | xlsx Discovery | If the xlsx default is a typo / unintentional, the STOP-red advisory wouldn't fire on the canonical row in clinical use. xlsx changelog says `2026-04-02 corrected Viokase → Viokace`; no entries about B-row defaults. Likely intentional for the spreadsheet-as-tool to demo the cap. Mitigation: planner can pick a different fixture row if the canonical row firing STOP-red looks weird in the test report. |
| A6 | The em-dash latent bug (Risk-2) is a Wave-0 mechanical fix, not a Phase 4 polish task | Em-Dash Audit | If the planner declines, the rendered messages will fail Phase 4 `/impeccable` and re-work. Recommendation: include in Wave 0. Cost: 4-line JSON edit. |
| A7 | The reference app's `× 30` (calendar-month) for capsules per month is the right convention for D-12 | D-12 lock | xlsx tube B15 = `=B14*30`. Confirms `× 30` exact. Risk: NONE (ASSUMED → now VERIFIED via xlsx read). |

## Open Questions

### Q-01: Rounding direction — `Math.ceil` (CONTEXT D-02) vs. `Math.round` (xlsx-as-canonical)?

**What we know:**
- CONTEXT D-02 says `Math.ceil` everywhere ("xlsx ROUNDUP / CEILING"). [CITED: 02-CONTEXT.md `<decisions>` D-02]
- xlsx oral B10 raw formula = `=ROUND(B9/B8, 0)`. xlsx tube B14 raw formula = `=ROUND(B12/B11, 0)`. [VERIFIED: openpyxl read of `/home/ghislain/src/pert-calculator/pert-calculator-pediatric-updated.xlsx` this session]
- ROADMAP success criteria explicitly cite "matching xlsx `B11` within 1%" (now confirmed — B11 is `weight × 10000`, the cap; B10 is the actual capsules-per-dose).
- Reference app `dosing.ts:36` uses `Math.round`.
- Phase 3 will assert ±1% parity; for small capsule counts the round/ceil difference exceeds 1%.

**What's unclear:**
- Whether D-02 is a deliberate clinical override of xlsx ("we round up for safety even though xlsx rounds") or a misread of the xlsx formula.

**Recommendation for the planner:** Treat as a **user-decision-required block** — do NOT proceed past Wave 1 task design until the user confirms. The planner should ASK the user explicitly: "xlsx uses ROUND; CONTEXT D-02 says Math.ceil. Which do we ship?" Two clinically-defensible answers:
- **(A) `Math.round` (xlsx parity):** Phase 3 fixtures match xlsx exactly. Default if "spreadsheet-parity within 1%" is the contract.
- **(B) `Math.ceil` (clinical safety override):** Override CONTEXT D-02 from auto-recommended to user-locked; document rationale ("you can't dose a fractional capsule, always round up so the patient gets enough enzyme"). Phase 3 fixtures use `Math.ceil`-derived expected values, NOT xlsx values; ROADMAP success-criteria text "within 1%" is reinterpreted as "agrees with our ceiling-rounded reference" rather than "agrees with xlsx".

**Default if user is unavailable:** **(A) `Math.round`** — xlsx is the parity authority per CONTEXT canonical_refs; ROADMAP / REQUIREMENTS / Phase 3 spreadsheet-parity all key off xlsx; CONTEXT D-02's "(= xlsx ROUNDUP / CEILING)" parenthetical is verifiably incorrect; safest read of the docs is that the auto-recommendation in D-02 was based on a misread.

### Q-02: Oral capsule formula multiplicand — `fat × lipasePerG` (xlsx) vs. `weight × lipasePerKg` (REQUIREMENTS PERT-ORAL-06)?

**What we know:**
- xlsx oral B9 raw formula = `=B5*B6` where B5 = "Fat (g)" and B6 = "Lipase units per g". B10 = `=ROUND(B9/B8, 0)`. [VERIFIED: openpyxl read this session]
- REQUIREMENTS PERT-ORAL-06: "capsules per dose computed as `ROUNDUP((weight × lipasePerKg) / strength, 0)`".
- REQUIREMENTS PERT-ORAL-07: "total lipase needed (`weight × lipasePerKg`)".
- pert-config.json `oral.lipasePerKgPerMeal: 1000` (default) with range 500–4000.
- xlsx oral default uses `lipasePerG = 2000` with the same range 500–4000 (lipaseRates). [VERIFIED: xlsx F11 = 10000 default; B6 = 2000 in the example row]
- Reference app `dosing.ts:51-56`: `calculateTotalLipase(fatGrams, lipaseUnitsPerGram)` → `fatGrams * lipaseUnitsPerGram`. [VERIFIED: live read]

**What's unclear:**
- Whether REQUIREMENTS' `weight × lipasePerKg` is a deliberate choice (different clinical convention) or a misreading.

**Three possibilities:**
1. **REQUIREMENTS is wrong** (xlsx + reference app are right): formula should be `fat × lipasePerG`. Field rename needed.
2. **xlsx is wrong** (REQUIREMENTS is right): unlikely — Phase 1 verified xlsx values for fat g/L corrections (11 of 17), would have caught a wrong formula.
3. **Both are valid clinical conventions** and the choice is product-policy: weight-based dosing is used in some pediatric protocols (e.g., 1000–4000 units lipase per kg per meal), fat-based is used in others (CFF guideline: 500–2500 units lipase per gram of dietary fat).

**Strong evidence for #1:** xlsx is the named parity authority across CONTEXT canonical_refs, ROADMAP, REQUIREMENTS itself (PERT-ORAL-06: "parity within 1% of xlsx `B11` for fixture rows" — wait, B11 is the cap, not capsules; the requirement text has another error there). The reference app, the StatPearls citation in reference clinical-config sources, and the xlsx all agree on fat-based dosing. The CFF guidelines (`https://www.cff.org/medical-professionals/pancreatic-enzymes-clinical-care-guidelines` cited in reference app) recommend "500–2500 units lipase / g of dietary fat / meal".

**Recommendation for the planner:** **Adopt the xlsx / fat-based formula.** Align Phase 2's calc layer with:
- `totalLipase = fatGrams × lipasePerGramOfFat` (xlsx B9)
- `capsulesPerDose = round(totalLipase / strength)` (xlsx B10, see Q-01 for round vs. ceil)
- `dailyLipase = capsulesPerDose × strength × 3` (D-05's clinical convention; xlsx has no oral daily-lipase cell)

Update the field semantics: the JSON defaults remain numerically valid (1000 is a reasonable default for fat-based dosing too), but the UI label should read "Lipase per gram of fat" not "Lipase per kg per meal". This is a naming-only fix; the JSON keys stay (`lipasePerKgPerMeal`) for backward-compat with the Phase-1-frozen state schema, but the UI calls them "Lipase per gram of fat". **Phase 2 should NOT rename JSON keys** (that would invalidate state.test.ts and state.svelte.ts). Phase 2 SHOULD rename the UI labels.

**Default if user is unavailable:** Adopt xlsx fat-based formula; relabel UI inputs; do NOT rename JSON keys; document in 02-RESEARCH.md (this file) and SUMMARY.

### Q-03: Tube-Feed lipase-per-day field — same semantic mismatch?

**What we know:**
- xlsx tube B9 = "Lipase units per g" with default 2500. Tube B12 = `=B8*B9` (totalFat × lipasePerG). [VERIFIED: openpyxl this session]
- pert-config.json `tubeFeed.lipasePerKgPerDay: 1000` (default) with range 500–4000.
- REQUIREMENTS PERT-TUBE-06: `totalLipase = (formulaFatGPerL × volumePerDay/1000) × lipasePerKgPerDay × weight` — multiplies by weight.
- xlsx tube formula: `totalLipase = totalFatG × lipasePerG`, NO weight multiplication. Then B13 = `totalLipase / weightKg` is the per-kg downstream metric.

**Recommendation for the planner:** Same as Q-02 — adopt xlsx semantics. Update the UI label for tube-feed lipase to "Lipase per gram of fat" (default 2500 if matching xlsx; or keep 1000 if D-11 / Phase 1 default already shipped). The state-shape key `lipasePerKgPerDay` stays; only the UI label changes.

### Q-04: First-mount pulse on hero — fire or skip on initial result?

**What we know:**
- HeroResult line 88: `if (pulseKey === undefined || pulseKey === lastPulseKey) return;` — fires on first non-undefined key.
- Phase 1 placeholder uses `pulseKey={\`empty-${mode}\`}` — pulses on mode change but stable across renders.
- Phase 2 will switch keys from `empty-${mode}` to `${mode}-${capsulesValue}` on first valid result — that's a key change, so the pulse fires on first calculation.

**What's unclear:**
- Whether a single pulse fires on first valid-result is desired UX (showing the result is "new") or noise (the user just typed; they know it's new).

**Recommendation:** **Fire on first valid-result** — matches the feeds + uac-uvc precedent, and the pulse is reduced-motion-gated. **No special handling needed.** Default behavior is the right behavior.

### Q-05: STOP-red message string — UI-SPEC suggests a fix, but execution timing matters

**What we know:**
- Current pert-config.json `max-lipase-cap.message` = `"Exceeds 10,000 units/kg/day cap — verify with prescriber"` (em-dash present). [VERIFIED: live read of pert-config.json:99]
- DESIGN.md line 312 bans em-dash in user-rendered strings.
- UI-SPEC §Copywriting Contract recommends: `"Exceeds 10,000 units/kg/day cap. Verify with prescriber."`

**Recommendation:** Wave 0 mechanical edit to all 4 advisory message strings (lines 99, 108, 117, 126):
- 99: `"Exceeds 10,000 units/kg/day cap. Verify with prescriber"`
- 108: `"Outside expected pediatric range. Verify."`
- 117: `"Outside expected fat range. Verify."`
- 126: `"Outside expected volume range. Verify."`

**No behavior change.** All 4 are 4-line JSON edits. The Phase-1-frozen `state.test.ts` and `config.test.ts` do NOT assert these strings (config.test.ts only asserts shape + count + STOP severity); Wave 0 fix doesn't break them.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `pnpm` | Build / install / test | ✓ | 10.33+ (project pin) | None — required by lockfile |
| `node` | Vitest + Vite + Playwright | ✓ | (project pin) | None |
| `pnpm svelte-check` | Type gate | ✓ | (transitive) | None |
| `pnpm test:run` (Vitest) | Unit tests | ✓ | 4.1.2 | None |
| `pnpm exec playwright test` | E2E + axe sweeps | ✓ (CI=1 path authoritative) | 1.58.2 | Dev `pnpm dev` server collision possible (Phase 1 SUMMARY caveat: stale port 5173). CI path uses 4173 + fresh prod build. |
| `epi-pert-calculator.xlsx` | Phase 3 parity authority | ✗ in workstream root | n/a | Reference clone available at `/home/ghislain/src/pert-calculator/pert-calculator-pediatric-updated.xlsx` (verified via openpyxl this session). Phase 3 uses this. Phase 2 is xlsx-formula-aware but does not load the workbook at runtime. |
| `openpyxl` (Python lib) | THIS RESEARCH only — read xlsx formulas | ✓ | (system) | Used only in research; not added to project. |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** `epi-pert-calculator.xlsx` is in the reference clone, not the workstream root. The workstream's CONTEXT canonical_refs claims the xlsx is at "repo root" but the file isn't actually there in this checkout. Phase 3 fixture authoring will need to point at the reference clone (`/home/ghislain/src/pert-calculator/pert-calculator-pediatric-updated.xlsx`) or copy the workbook into the workstream. **Not a Phase 2 blocker** — Phase 2 hand-codes the xlsx formulas in TS; the workbook is only needed for Phase 3 fixture generation. Flag for Phase 3 planning.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 (project-pinned, configured at `vitest.config.ts` — 4580 source files in svelte-check pass; 38 test files / 361 tests passing on Phase-1 baseline `aa60629`) |
| Config file | `vitest.config.ts` at project root (Phase-1-verified — implicit per `pnpm test:run` reaching it) |
| Quick run command | `pnpm test:run src/lib/pert/` (10 tests at end of Phase 2 — 6 state + 11 config + N new calc) |
| Full suite command | `pnpm test:run` (361 → 361+N where N is new calc tests; **Phase 2 exit gate: 0 regressions vs 361**) |

### Phase Requirements → Test Map

> Phase 2 SHIPS testable code; Phase 3 OWNS the test files. The map below shows what each requirement's validation surface is, but the explicit test commands are Phase 3's responsibility. Phase 2 must produce calc functions and components that Phase 3 can drive.

| Req ID | Behavior | Test Type | Automated Command (Phase 3) | File Exists? |
|--------|----------|-----------|-----------------------------|--------------|
| PERT-ORAL-06 | Capsules-per-dose math, ±1% xlsx parity | unit (vitest) | `pnpm test:run src/lib/pert/calculations.test.ts` | ❌ Phase 3 (PERT-TEST-01) |
| PERT-ORAL-07 | Secondary outputs (totalLipase, lipasePerDose) | unit | same | ❌ Phase 3 |
| PERT-ORAL-08 | Tertiary `× 3` daily total | unit | same | ❌ Phase 3 |
| PERT-TUBE-06 | Capsules-per-day math, ±1% xlsx B14 | unit | same | ❌ Phase 3 (PERT-TEST-02) |
| PERT-TUBE-07 | Secondary outputs (totalFatG, lipasePerKg, capsulesPerMonth=B14×30) | unit | same | ❌ Phase 3 |
| PERT-MODE-01 | SegmentedToggle keyboard nav (←/→/Home/End) | component (vitest + jsdom) | `pnpm test:run src/lib/pert/PertInputs.test.ts` | ❌ Phase 3 (PERT-TEST-03) |
| PERT-MODE-03 | Mode-switch state preservation | e2e (Playwright) | `pnpm exec playwright test e2e/pert-mode-switch.spec.ts` | ❌ Phase 3 (PERT-TEST-05) |
| PERT-MODE-04 | `aria-live` on hero updates | e2e + a11y | `pnpm exec playwright test e2e/pert-a11y.spec.ts` | ✅ exists (Phase 1; Phase 2 must NOT regress 4/4) |
| PERT-SAFE-01 | STOP-red advisory fires when `dailyLipase > weight × 10000` | unit (calc layer) + component (advisory render) | calc tests + component tests | ❌ Phase 3 |
| PERT-SAFE-02..03 | Range advisories blur-gated | component | NumericInput integration test | ❌ Phase 3 |
| PERT-SAFE-04 | Empty-state hero copy | component (snapshot) | calc returning null + render of `validationMessages.emptyOral`/`emptyTubeFeed` | ❌ Phase 3 |
| (existing) | Phase 1 axe sweeps stay green | e2e + axe | `CI=1 pnpm exec playwright test pert-a11y` (4/4) | ✅ exists |
| (existing) | Phase 1 config + state shape | unit | `pnpm test:run src/lib/pert/{config,state}.test.ts` (17/17) | ✅ exists |

### Sampling Rate

- **Per task commit:** `pnpm test:run src/lib/pert/` (covers config, state, and the new calc tests when Phase 3 lands them; for Phase 2 commits this is just config + state — must stay 17/17).
- **Per wave merge:** Full Vitest suite (`pnpm test:run`, must stay 361+/361+) + Playwright pert-a11y (`CI=1 pnpm exec playwright test pert-a11y`, must stay 4/4).
- **Phase gate:** Full Vitest + Full Playwright + svelte-check 0/0 + `pnpm build` ✓. The single Playwright disclaimer-banner.spec flake from Phase 1 verification is pre-existing and NOT a Phase 2 regression criterion.

### Wave 0 Gaps

- [ ] `src/lib/pert/calculations.ts` — DOES NOT EXIST. Phase 2 Wave 1 creates it.
- [ ] `src/lib/pert/PertInputs.svelte` — DOES NOT EXIST. Phase 2 Wave 2 creates it.
- [ ] `src/lib/pert/calculations.test.ts` — Phase 3 (PERT-TEST-01/02). Phase 2 ensures the calc-layer functions are exportable + testable.
- [ ] `src/lib/pert/PertCalculator.test.ts` — Phase 3 (PERT-TEST-03). Phase 2 ensures the component composes against the calc layer.
- [ ] `pert-config.json` em-dash audit — FIX in Wave 0 (4-line JSON edit per Q-05).
- [ ] Framework install: NONE — Vitest, Svelte 5, jsdom (transitive via Vitest config) all already pinned.

*(Existing Phase-1 test infrastructure covers state + config + axe sweeps. Phase 2 doesn't expand the test surface; Phase 3 does.)*

## Sources

### Primary (HIGH confidence)

- **Live source files (Phase 1 baseline `aa60629` — read this session):**
  - `src/lib/pert/PertCalculator.svelte` (51 lines, placeholder)
  - `src/lib/pert/state.svelte.ts` (80 lines)
  - `src/lib/pert/types.ts` (80 lines)
  - `src/lib/pert/config.ts` (41 lines)
  - `src/lib/pert/pert-config.json` (146 lines, including em-dash audit findings at lines 99, 108, 117, 126)
  - `src/routes/pert/+page.svelte` (90 lines)
  - `src/lib/feeds/calculations.ts` (lines 198–247: `checkAdvisories` canonical pattern)
  - `src/lib/feeds/FeedAdvanceCalculator.svelte` (lines 305–322: advisory render canonical pattern)
  - `src/lib/feeds/FeedAdvanceInputs.svelte` (closest PertInputs structural analog)
  - `src/lib/uac-uvc/UacUvcCalculator.svelte` (closest hero-with-children analog)
  - `src/lib/gir/GirCalculator.svelte` (lines 8 + 109–119: STOP-red `OctagonAlert` carve-out precedent)
  - `src/lib/shared/components/{HeroResult,SegmentedToggle,NumericInput,RangedNumericInput,SelectPicker,InputDrawer,InputsRecap}.svelte` (live read; D-14 NumericInput showRangeError verified)
- **xlsx canonical formulas (read this session via openpyxl):**
  - `/home/ghislain/src/pert-calculator/pert-calculator-pediatric-updated.xlsx` Pediatric PERT Tool: B9=`=B5*B6`, B10=`=ROUND(B9/B8,0)`, B11=`=B4*10000`
  - Same workbook Pediatric Tube Feed PERT: B6=48, B8=`=ROUND(B6*B7/1000,1)`, B12=`=B8*B9`, B13=`=ROUND(B12/B4,0)`, B14=`=ROUND(B12/B11,0)`, B15=`=B14*30`
  - Default-row computed values: oral B10=4 (with weight 10, fat 25, lipasePerG 2000, Creon 12000); tube B14=5 / B15=150 (with weight 15, Kate Farms Pediatric Standard 1.2, volume 1500, lipasePerG 2500, Pancreaze 37000); tube B13=12000 (which **exceeds the 10,000 cap**)
- **Phase 1 outputs (read this session):**
  - `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/01-CONTEXT.md` (D-01..D-24)
  - `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/01-04-SUMMARY.md`
  - `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/01-03-SUMMARY.md`
  - `.planning/workstreams/pert/phases/01-architecture-identity-hue-clinical-data/VERIFICATION.md`
  - `.planning/workstreams/pert/STATE.md`
  - `.planning/workstreams/pert/ROADMAP.md`
  - `.planning/workstreams/pert/REQUIREMENTS.md`
  - `.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/02-CONTEXT.md`
  - `.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/02-UI-SPEC.md`
- **Project docs:**
  - `CLAUDE.md` (tech stack pin, no native, WCAG 2.1 AA, em-dash ban via DESIGN.md)
  - `DESIGN.md` (Identity-Inside Rule, Tabular-Numbers, Eyebrow-Above-Numeral, 11px Floor, Red-Means-Wrong, em-dash ban line 312)
  - `DESIGN.json` (token allowlist, machine-readable contract)

### Secondary (MEDIUM confidence)

- Reference codebase `/home/ghislain/src/pert-calculator/`:
  - `src/lib/dosing.ts` (uses `Math.round`; reference for the runFormula step engine which Phase 1 D-05 chose NOT to port)
  - `src/lib/clinical-config.json` (medication strengths confirmed; pattern reference)
  - `src/lib/tube-feed/formulas.ts` (pattern reference)
  - The reference codebase predates the workstream-side clinical-data corrections in Phase 1 Plan 01-03 (added Zenpep 60000, Pancreaze 37000; corrected 11 of 17 formula fatGPerL values).

### Tertiary (LOW confidence — flagged for the planner / user)

- The interpretation that CONTEXT D-02's "Math.ceil" is a misread of xlsx (Q-01) is RESEARCHER OPINION based on direct xlsx inspection. The user authored CONTEXT under `/gsd-discuss-phase --auto`; the auto-recommendation may have been based on a different reading. **Defer to user.**
- The interpretation that REQUIREMENTS PERT-ORAL-06's "weight × lipasePerKg" is wrong (Q-02) is RESEARCHER OPINION supported by xlsx + reference app + CFF clinical guideline. **Defer to user.**
- The recommendation to relabel UI inputs from "Lipase per kg per meal" to "Lipase per gram of fat" (Q-03) follows Q-02. **Defer to user.**

## Risks & Landmines

### Risk-1: Calc-layer formula contract conflict (Q-01 + Q-02 + Q-03 stacked)
**Severity:** Phase-blocking until resolved.
**Surface:** CONTEXT D-02 + D-05 + REQUIREMENTS PERT-ORAL-06/07/TUBE-06 say one thing; xlsx (the named parity authority) says another. If Phase 2 ships per CONTEXT-as-written, Phase 3's ±1% spreadsheet-parity gate fails.
**Resolution path:** User confirms Q-01/Q-02/Q-03 before the calc-layer task locks. Recommended default: adopt xlsx-canonical formulas (`Math.round`, `fat × lipasePerG`); document the override of CONTEXT D-02 in 02-RESEARCH.md (this doc) + 02-PLAN-01-SUMMARY.md.

### Risk-2: 4 em-dash advisory strings violate DESIGN.md em-dash ban
**Severity:** Phase-2-rendered (was latent in Phase 1; rendering on Phase 2 surfaces them to users).
**Surface:** `pert-config.json` lines 99, 108, 117, 126. DESIGN.md line 312 bans em-dash in user-rendered strings, aria-label, and screen-reader copy.
**Resolution path:** Wave 0 mechanical fix per Q-05.

### Risk-3: `Pertzye=2.0` re-injection via stale persisted state
**Severity:** Medium (defense-in-depth; Phase 1's allowlist filter handles 99% of cases).
**Surface:** `pertState` localStorage blob can carry `strengthValue: 2.0` from corrupted older state; SelectPicker filters at render time but state read directly into calc layer doesn't.
**Resolution path:** Calc layer cross-checks `state.strengthValue` against `getMedicationById(state.medicationId).strengths` and returns null if not in the allowlisted set. See Pitfall 3.

### Risk-4: Phase-1-frozen state schema requires JSON-key vs UI-label split (if Q-02/Q-03 resolve to xlsx)
**Severity:** Low — discipline issue, not a code issue.
**Surface:** `pertState` state shape uses `lipasePerKgPerMeal` / `lipasePerKgPerDay` keys. If we adopt xlsx semantics, the keys are misleading but the values still flow through correctly. Renaming the keys would invalidate Phase-1-frozen `state.test.ts` (6 tests) and break the schema contract.
**Resolution path:** **Do NOT rename JSON keys.** Rename ONLY the UI labels. The internal model carries the value labelled per-kg-per-meal but the UI calls it per-gram-of-fat. Add a comment in `types.ts` or `pert-config.json` explaining the historical naming. Revisit in a future schema-bump phase if needed.

### Risk-5: First-paint flash of empty hero before localStorage restore
**Severity:** Low — Phase 1 verification confirmed eager init in constructor handles this.
**Surface:** `pertState` constructor calls `this.init()` synchronously, so by the time any component reads `pertState.current`, localStorage has been read. **No first-paint flash.** [VERIFIED: Phase 1 SUMMARY 01-04 line 62: "Eager init: child $effects mounted before onMount can fire persist() with default values and clobber the restored state."]

### Risk-6: Phase 1 Playwright disclaimer-banner.spec.ts flake reproduces in Phase 2 exit gate
**Severity:** Low (pre-existing, unrelated, well-documented).
**Surface:** `e2e/disclaimer-banner.spec.ts:28` flakes occasionally on full Playwright run. Reproduces on Phase 1 baseline `fcf3e4d`, NOT a Phase 2 regression. Phase 1 verifier explicitly carved this out as a baseline-stability concern.
**Resolution path:** Phase 2 exit gate accepts 1 known flake; pert-a11y.spec.ts must stay 4/4; full suite acceptance is "0 NEW failures vs Phase 1 baseline."

### Risk-7: Plan-time research / planner divergence on PertInputs scope
**Severity:** Low.
**Surface:** UI-SPEC §IA "PertInputs internal layout" lists 7 inputs (toggle + weight + 2 oral OR 3 tube + medication + strength). The structurally identical analog is `src/lib/feeds/FeedAdvanceInputs.svelte` at 280+ lines with similar mode branching. The planner could reasonably split PertInputs into smaller pieces (`PertOralInputs.svelte` + `PertTubeFeedInputs.svelte`) — but UI-SPEC explicitly says ONE file at `src/lib/pert/PertInputs.svelte` mirroring feeds/uac-uvc/gir analog.
**Resolution path:** Honor UI-SPEC. Single file. ~200–300 lines including the strength-bridge effect.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every shared component live-verified at the cited line numbers; project pin verified via Phase 1 verifier `aa60629`.
- Architecture patterns: HIGH — feeds + uac-uvc + gir analogs all live-verified; severity-DESC sort and STOP-red branch are 1-line additions to the established pattern.
- Pitfalls: HIGH — every pitfall references live code or canonical xlsx behavior; mitigations match the established pattern.
- xlsx canonical formulas: HIGH — read directly via openpyxl in this session; raw cell formulas + computed default-row values both captured.
- xlsx vs CONTEXT/REQUIREMENTS conflicts (Q-01/02/03): Researcher confidence HIGH (the conflict is concrete and mechanically verifiable); product-policy resolution requires USER decision (cannot be researched away).
- Em-dash audit (Q-05): HIGH — verified in JSON; mechanical fix.

**Research date:** 2026-04-24

**Valid until:** ~30 days for the patterns and shared-component contracts (Tailwind 4 / Svelte 5 / SvelteKit 2 are stable pins); ~7 days for the Phase 1 baseline reference (`aa60629` HEAD), since other workstreams may merge.

---

*Generated by gsd-phase-researcher on 2026-04-24. Workstream: pert. Phase: 02-calculator-core-both-modes-safety. Status: research complete; calc-layer task BLOCKED on Q-01/Q-02/Q-03 user decision.*
