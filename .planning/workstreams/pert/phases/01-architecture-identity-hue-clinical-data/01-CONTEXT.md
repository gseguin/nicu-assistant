# Phase 1: Architecture, Identity Hue & Clinical Data — Context

**Workstream:** pert
**Milestone:** v1.15 (Pediatric EPI PERT Calculator)
**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

A `/pert` route shell exists, registers the sixth calculator with a hand-tuned identity hue and embedded clinical config, and downstream phases can compile against `CalculatorId = 'pert'` without modifying any existing calculator.

**In scope:** `CalculatorId` union extension, `CALCULATOR_REGISTRY` entry (alphabetized), `.identity-pert` OKLCH tokens, `pert-config.json` + typed wrapper, `/pert` route shell rendering `<PertCalculator />` placeholder, `pertState` localStorage singleton, AboutSheet entry, NavShell `activeCalculatorId` ternary extension, first-run favorites default change, `recover()` re-sort behavior change.

**Out of scope (Phase 2):** Calculator math (oral / tube-feed), SegmentedToggle, max-lipase advisory, range advisories, empty-state copy.
**Out of scope (Phase 3):** Spreadsheet-parity tests, component tests, Playwright E2E, axe sweeps (the *pre-PR* axe sweep on `.identity-pert` is in Phase 1 to validate the hue; the formal E2E suite expansion is Phase 3).
**Out of scope (Phase 4):** `/impeccable` critique, DESIGN.md / DESIGN.json contract enforcement.
**Out of scope (Phase 5):** Version bump, release gate.

</domain>

<decisions>
## Implementation Decisions

### Identity Hue (`.identity-pert`)

- **D-01:** Hue family **OKLCH 285 (purple/violet)**. Sits in the 220→350 gap on the color wheel, distinct from all 5 taken hues (Morphine 220, Formula 195, GIR 145, Feeds 30, UAC 350). Calm/clinical, pairs with the warm-restraint aesthetic.
- **D-02:** Tuning constants **match GIR/Feeds**. Light: `L=42% C=0.12 H=285`. Dark: `L=80% C=0.10 H=285`. Hero-tint: light `L=96% C=0.03 H=285`; dark `L=22% C=0.045 H=285`. Same shape that passed for GIR + Feeds + UAC — lowest research risk.
- **D-03:** `.identity-pert` applied on **4 surfaces only** per Identity-Inside Rule (DESIGN.md): result hero, focus rings, eyebrows, active nav indicator. Never on chrome. SegmentedToggle styling is a Phase 4 question and does not lock a token in Phase 1.
- **D-04:** Contrast target **WCAG AA 4.5:1** on first run, both themes, all 4 surfaces. Pre-PR axe-core sweep gates merge (PERT-HUE-03, v1.8 research-before-PR contract).

### Config Shape (`pert-config.json` + `config.ts`)

- **D-05:** **Mirror feeds-config.json shape** — `{ defaults, inputs, dropdowns, advisories }`. Phase 2 calc functions are plain TypeScript functions (no `runFormula` step engine ported from the reference app).
- **D-06:** Pediatric formulas as a **flat array** `[{ id, name, fatGPerL }]` inside `dropdowns.formulas`. SelectPicker consumes directly; alphabetical-by-name in the picker.
- **D-07:** **Static FDA strength allowlist** in JSON per medication. `Pertzye=2.0` and any sub-1000 strength are absent from the JSON to begin with; a config shape test fails CI if a non-allowlist value appears (PERT-DATA-03).
- **D-08:** **`advisories[]` array** inside the JSON, one entry per advisory `{ id, field, comparator, value, message, severity }`. Max-lipase advisory carries `severity: 'stop'` to trigger the v1.13 STOP-red carve-out (PERT-SAFE-01). Range advisories use `severity: 'warning'`. Phase 2 reads + renders.

### State (`pertState`)

- **D-09:** **localStorage** (key `nicu_pert_state`) — overrides ROADMAP/REQUIREMENTS spec inconsistency in favor of the established 5-calculator pattern (`nicu_uac_uvc_state`, `nicu_feeds_state`, etc.). PERT-MODE-02's sessionStorage `nicu:pert:mode` is reinterpreted: mode lives inside the same localStorage blob as everything else.
- **D-10:** **Single `PertState` class** with mode-specific sub-objects. Shape: `current = { mode: 'oral'|'tube-feed', weightKg, medicationId, strengthValue, oral: { fatGrams, lipasePerKgPerMeal }, tubeFeed: { formulaId, volumePerDayMl, lipasePerKgPerDay } }`. Shared keys (weight/med/strength) at root; mode-specific keys nested. Honors PERT-MODE-03.
- **D-11:** **First-run defaults: weight=3.0 kg only**, all other inputs null. Hero shows empty-state copy ("Enter weight and fat grams" / tube-feed equivalent) on first visit per PERT-SAFE-04. Weight pre-populated to match UAC/GIR convention.
- **D-12:** **Mode default = most-recent-edited mode**, persisted as part of `pertState.current.mode`. Overrides PERT-MODE-02's "first-run defaults to Oral" — first-run is Oral (since that's the localStorage default), but on subsequent visits the user lands in whichever mode they last touched.
- **D-13:** Eager `init()` in constructor, `persist()` on every `current` mutation, `reset()` clears localStorage + `LastEdited` stamp. Mirror `src/lib/uac-uvc/state.svelte.ts` exactly. `LastEdited` instance with key `nicu_pert_state_ts`.

### Registry Entry

- **D-14:** **Icon = Lucide `Pill`**. No new dep. Reads instantly as "medication"; distinct silhouette from Syringe/Milk/Droplet/Baby/Ruler.
- **D-15:** **Label = "PERT"** (4 chars, all-caps). Recognized clinical acronym. Fits at 375px even alongside icon when favorited.
- **D-16:** **Description = "Pediatric EPI PERT calculator"**. Concise; matches GIR pattern.
- **D-17:** **`identityClass = 'identity-pert'`**. Add to the `identityClass` union at `src/lib/shell/registry.ts:11`.
- **D-18:** **`href = '/pert'`**, route file `src/routes/pert/+page.svelte` rendering `<PertCalculator />` (placeholder component in Phase 1; real implementation in Phase 2).

### Registry Order (Alphabetical — cross-cutting change)

- **D-19:** **`CALCULATOR_REGISTRY` re-sorted alphabetically** by `id`: `feeds`, `formula`, `gir`, `morphine-wean`, `pert`, `uac-uvc`. (Both id-sort and label-sort produce the same order.) Predictable, scales with future calculators, easier for new clinicians.
- **D-20:** **First-run favorites default changes** to `['feeds', 'formula', 'gir', 'morphine-wean']` (alphabetical, dropping `morphine-wean`'s historical first-position). Overrides PERT-ARCH-07's literal `['morphine-wean', 'formula', 'gir', 'feeds']`. **Action item:** PROJECT.md and REQUIREMENTS.md (PERT-ARCH-07 + Key Decisions row) need updating to reflect this change before merge. Worth a release-note callout — visible change for new installs only.
- **D-21:** **`favorites.svelte.ts:recover()` drops the registry-order re-sort.** Stored favorites preserve user's chosen order verbatim; only filtering of unknown ids and `FAVORITES_MAX` cap remain. Existing v1.13/v1.14 users' favorites order is preserved (no snap-to-alphabetical on first v1.15 load). Honors user agency. Add a regression test: stored `[morphine-wean, gir, feeds, formula]` round-trips identically.
- **D-22:** **`registry.test.ts` position-locked tests rewritten** to match alphabetical order. The `[0]=morphine-wean, [1]=formula, [2]=gir, [3]=feeds, [4]=uac-uvc` assertions become `[0]=feeds, [1]=formula, [2]=gir, [3]=morphine-wean, [4]=pert, [5]=uac-uvc`.

### NavShell Integration

- **D-23:** `NavShell.activeCalculatorId` ternary chain extends to handle `/pert` → `'pert'`. Mirror existing pattern (no new abstraction). Identity color logic flows through automatically once `'identity-pert'` is in the union.

### AboutSheet Entry

- **D-24:** Append `pert` entry to `aboutContent` in `src/lib/shared/about-content.ts`. Title: "Pediatric EPI PERT Calculator". Description references both modes. Notes cite `epi-pert-calculator.xlsx` Pediatric tabs (`Pediatric Oral PERT Tool`, `Pediatric Tube Feed PERT`) and DailyMed for medication strengths. Disclaimer: shared `DISCLAIMER` constant (institutional-protocol pattern matching GIR/UAC).

### Claude's Discretion

- AboutSheet body copy wording (D-24 sets the citations and structure; exact prose left to executor).
- Validation message phrasing for empty/invalid inputs (config-level — exact strings TBD in Phase 2 with empty-state copy unification).
- File-level layout inside `src/lib/pert/` (types.ts, state.svelte.ts, calculations.ts, config.ts, pert-config.json, PertCalculator.svelte placeholder, parity.fixtures.json — exact split mirrors `src/lib/uac-uvc/`).
- Whether the alphabetical-fallback `defaultIds()` function is removed entirely (now that the hardcoded first-run default is alphabetical and matches registry order) or kept as a defense-in-depth fallback. Either is acceptable; planner decides.

### Folded Todos

None — no pending todos matched Phase 1 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Workstream-local (read these first)

- `.planning/workstreams/pert/PROJECT.md` — Workstream charter, validated history, key decisions.
- `.planning/workstreams/pert/REQUIREMENTS.md` — All 54 PERT-* requirements, with PERT-ARCH-* and PERT-HUE-* and PERT-DATA-* mapped to this phase.
- `.planning/workstreams/pert/ROADMAP.md` §"Phase 1: Architecture, Identity Hue & Clinical Data" — Phase goal, success criteria, dependencies.

### Project-level (constraints & contracts)

- `.planning/PROJECT.md` — Main project charter; v1.13/v1.14 validated decisions referenced by D-19/D-20/D-21.
- `.planning/STATE.md` — Current mainline state (mid-v1.14 Kendamil work); v1.15 lands in parallel.
- `DESIGN.md` — Design contract: Identity-Inside Rule, OKLCH-Only, Five-Roles-Only, Tabular-Numbers, Eyebrow-Above-Numeral, 11px Floor. Phase 1 must honor Identity-Inside Rule (D-03).
- `DESIGN.json` — Machine-readable design contract (token allowlist, identity-class allowlist).
- `CLAUDE.md` — Project tech-stack pin (SvelteKit 2.55 + Svelte 5 + Tailwind 4 + Vite 8 + pnpm 10.33, no native, PWA-only, WCAG 2.1 AA).

### Source of clinical truth

- `epi-pert-calculator.xlsx` (repo root) — `Pediatric Oral PERT Tool` and `Pediatric Tube Feed PERT` sheets are the parity authority. Phase 1 reads columns to build `pert-config.json` (medications + strengths, formulas + fatGPerL); the parity formulas (`B11`, `B13`, `B14`, `B12 = B5 × 10000`) are Phase 2 territory.
- DailyMed (NDA records) — secondary citation for medication strengths in AboutSheet (D-24); the xlsx is the primary authority for this app.

### Closest codebase analogs (Phase 1 mirrors these structurally)

- `src/lib/shell/registry.ts` — Registry entry pattern + `identityClass` union (D-14..D-19).
- `src/lib/shared/types.ts:7` — `CalculatorId` union (extend with `'pert'`).
- `src/lib/uac-uvc/state.svelte.ts` — State singleton pattern (D-13). Mirror eager-init, persist-on-mutate, reset semantics, `LastEdited` integration.
- `src/lib/feeds/feeds-config.json` — Closest config shape analog (D-05): `defaults` + `inputs.ranges` + `dropdowns` + `advisories[]`.
- `src/lib/uac-uvc/uac-uvc-config.json` — Smaller config shape (single input); shows the minimum surface but PERT needs the multi-input feeds shape.
- `src/lib/shared/favorites.svelte.ts` — Favorites store; D-20/D-21 modify `defaultIds()` and `recover()`.
- `src/lib/shell/HamburgerMenu.svelte:95` — Reads registry order (alphabetization affects this surface).
- `src/lib/shared/about-content.ts` — AboutSheet content map (D-24 appends `pert` entry).
- `src/lib/shell/NavShell.svelte` — `activeCalculatorId` ternary (D-23 extends).
- `src/app.css` lines 240–283 — Identity hue token pattern; D-01/D-02 add `.identity-pert` light + dark blocks.

### Reference (do NOT copy verbatim — pattern inspiration only)

- `/home/ghislain/src/pert-calculator/src/lib/dosing.ts` — Reference app's `runFormula` step engine. **Not** ported (D-05 chose feeds-shape over runFormula).
- `/home/ghislain/src/pert-calculator/src/lib/clinical-config.ts` — Reference app's clinical config shape. **Not** ported.
- `/home/ghislain/src/pert-calculator/src/lib/medications.ts`, `tube-feed/formulas.ts` — Pattern reference for medication/formula data structure.

### Related past phases (precedent for this phase's choices)

- v1.13 Phase 42 (UAC/UVC) — Closest analog: Wave-0 architecture + identity hue research-before-PR + AboutSheet entry. `.planning/milestones/v1.13-ROADMAP.md` for archive.
- v1.8 Phase 26 (GIR architecture) — Wave-0 latent-bug fix pattern; identity hue tuning constants source for D-02.
- v1.13 Phase 40 (favorites store + hamburger) — `favorites.svelte.ts` and `HamburgerMenu.svelte` ownership; D-20/D-21 modify these.
- v1.6 (SegmentedToggle introduction) — Background for Phase 2/4 SegmentedToggle decisions; not directly modified in Phase 1.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`CalculatorEntry` type + `CALCULATOR_REGISTRY`** at `src/lib/shell/registry.ts` — Add `'identity-pert'` to the `identityClass` union (line 11–17), append `pert` entry to the array (D-14..D-18), then re-sort alphabetically (D-19).
- **`CalculatorId` union** at `src/lib/shared/types.ts:7` — Extend with `'pert'`. Type-check propagates to all consumers (registry, AboutSheet, NavShell, favorites store).
- **`<RangedNumericInput>` / `<NumericInput>` / `<SelectPicker>`** — All shared components Phase 2 will consume. Phase 1 only needs to ensure the placeholder `<PertCalculator />` compiles; no actual input wiring yet.
- **`LastEdited`** at `src/lib/shared/lastEdited.svelte.ts` — Reuse as-is for the `nicu_pert_state_ts` timestamp.
- **`aboutContent` map** at `src/lib/shared/about-content.ts` — Append `pert` entry (D-24). `DISCLAIMER` constant is shared.
- **Identity hue CSS pattern** at `src/app.css` lines 240–283 — Add `.identity-pert` (light) and `.dark .identity-pert, [data-theme='dark'] .identity-pert` (dark) blocks, mirroring `.identity-feeds` exactly with hue=285.

### Established Patterns

- **State singleton: eager init in constructor + `persist()` on mutate + `reset()`** — Universal across all 5 calculators. UAC/UVC is the simplest, cleanest mirror (single input, no normalize step). D-13 follows it exactly.
- **Config shape: feeds-style `{ defaults, inputs, dropdowns, advisories }`** — D-05/D-06/D-08 match. UAC's micro-shape is too thin for a multi-input calculator.
- **Identity-Inside Rule (DESIGN.md)** — `.identity-X` on inside-the-route surfaces only, never on chrome. D-03 honors.
- **Pre-PR axe-core sweep for new identity hues** — v1.8 / v1.13 precedent. PERT-HUE-03 locks the contract; Phase 1 plan must include the sweep before merging.
- **Wave-0 latent-bug fixes commit-first** — `CalculatorId` + registry + NavShell ternary land in commit 1 so Phase 2's `<PertCalculator />` compiles cleanly without modifying any other calculator.
- **`favorites.svelte.ts:recover()` six-step pipeline** — D-21 modifies step 6 (drops the registry-order re-sort) but preserves the rest.

### Integration Points

- **`src/routes/pert/+page.svelte`** — New route file. Renders `<PertCalculator />` placeholder (real implementation Phase 2).
- **`src/lib/pert/`** — New module directory. Mirror structure of `src/lib/uac-uvc/`: `types.ts`, `state.svelte.ts`, `calculations.ts` (Phase 1: stub functions; Phase 2: real math), `pert-config.json`, `config.ts` wrapper, `PertCalculator.svelte` (Phase 1: placeholder; Phase 2: real UI), `parity.fixtures.json` (Phase 1: empty file or skip; Phase 3: populated).
- **`src/lib/shell/NavShell.svelte`** — Extend `activeCalculatorId` ternary for `/pert` → `'pert'`.
- **`src/lib/shared/favorites.svelte.ts`** — Modify `defaultIds()` (D-20) + `recover()` step 6 (D-21).
- **`src/lib/shell/__tests__/registry.test.ts`** — Update position-locked assertions to match alphabetical order (D-22).
- **`src/lib/shared/about-content.ts`** — Append `pert` entry (D-24).
- **`src/app.css`** — Append `.identity-pert` light + dark blocks (D-01, D-02).

</code_context>

<specifics>
## Specific Ideas

- **Hue 285 (purple/violet) over yellow-green or magenta.** Yellow-green risks confusion with Formula amber (~60) and GIR green (~145) under fluorescent NICU lighting; magenta is too close to UAC rose (350). Purple/violet sits in the largest unoccupied gap on the OKLCH wheel.
- **Tuning constants borrowed from GIR/Feeds (`L=42% C=0.12` light / `L=80% C=0.10` dark)** rather than custom tuning — same shape passed for 3 prior calculators, lowest research risk for PERT-HUE-03's pre-PR axe sweep.
- **Lucide `Pill` over inline custom SVG.** User explicitly chose to stay within the existing icon family for Phase 1; the inline-SVG option remains available for a future polish phase if desired.
- **Alphabetical registry — accepted side-effects.** User explicitly accepted that PERT-ARCH-07's first-run favorites change to `[feeds, formula, gir, morphine-wean]` (D-20) and that `recover()` drops registry-order re-sorting (D-21). PROJECT.md / REQUIREMENTS.md must be updated accordingly during Phase 1 execution, before merge.
- **localStorage over sessionStorage.** Spec inconsistency resolved in favor of codebase consistency (D-09). All 5 existing calculators use localStorage; PERT joins them.
- **Mode default = most-recent-edited.** D-12 overrides PERT-MODE-02's literal "first-run defaults to Oral." First-run is still Oral (initial localStorage default), but returning users land in their last-edited mode.
- **First-run weight pre-populated to 3.0 kg, other inputs null.** Hero renders empty-state on fresh visit; weight is conventionally pre-populated to match UAC/GIR.

</specifics>

<deferred>
## Deferred Ideas

- **SegmentedToggle identity-hue wash** — Phase 4 design polish question (PERT-DESIGN-05). Phase 1 does NOT lock a token for this.
- **Custom inline SVG icon** — Available as a future polish option if Lucide `Pill` feels generic in critique sweep (Phase 4). Not Phase 1.
- **AboutSheet body copy wording** — Claude's discretion in Phase 1 execution; can be polished during Phase 4 critique.
- **Schema-bump for favorites store** — Considered and rejected in favor of D-21's drop-the-re-sort approach. If a future phase needs a true migration path, schema v2 is on the table then.
- **Adult Oral PERT / Adult Tube Feed PERT modes** — Out of scope for v1.15 (workstream PROJECT.md Out of Scope). Adult tabs in xlsx exist but are deferred.
- **Per-meal historical logging** — Out of scope (workstream PROJECT.md Out of Scope). Stateless calculator like the other 5.
- **Custom formula entry (user adds a non-listed enteral formula)** — Out of scope; clinical-data-as-code is a project principle.

### Reviewed Todos (not folded)

None — no pending todos matched Phase 1 scope at the cross-reference step.

</deferred>

---

*Phase: 01-architecture-identity-hue-clinical-data*
*Workstream: pert*
*Context gathered: 2026-04-25*
