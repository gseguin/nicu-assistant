# Phase 1: Architecture, Identity Hue & Clinical Data — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `01-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Workstream:** pert
**Phase:** 01-architecture-identity-hue-clinical-data
**Areas discussed:** Identity hue, Config shape, State strategy, Registry icon + label

---

## Identity Hue

### Q1: Hue family

| Option | Description | Selected |
|--------|-------------|----------|
| Purple/Violet (~285) | Distinct from all 5 taken hues; sits in 220→350 gap. Calm, clinical. | ✓ |
| Yellow-green (~95) | Sits in 60→145 gap; risk of confusion with Formula amber (60) and GIR green (145) under fluorescent NICU lighting. | |
| Magenta (~330) | Sits in 30→350 gap; close to UAC (350). | |

### Q2: Hue tuning

| Option | Description | Selected |
|--------|-------------|----------|
| Match GIR/Feeds | Light L=42% C=0.12; Dark L=80% C=0.10. Hero light L=96% C=0.03; dark L=22% C=0.045. Lowest research risk. | ✓ |
| Match UAC | Same structure, minor hero-tint delta. | |
| Custom hand-tune | Researcher decides L/C from scratch with axe-core in the loop. | |

### Q3: Hue scope

| Option | Description | Selected |
|--------|-------------|----------|
| 4 surfaces, Identity-Inside only | Result hero, focus rings, eyebrows, active nav indicator. Per DESIGN.md Identity-Inside Rule. | ✓ |
| Add SegmentedToggle wash | 4 surfaces + Oral/Tube-Feed toggle picks up identity tint. (Deferred to Phase 4.) | |

### Q4: Accessibility floor

| Option | Description | Selected |
|--------|-------------|----------|
| WCAG 4.5:1 (AA) | Matches PERT-HUE-01 / PERT-HUE-03 verbatim. Same bar as all 5 existing calculators. | ✓ |
| WCAG 7:1 (AAA) | Stretch target; not enforced for any other calculator. | |

**Notes:** Hue 285 is in the largest unoccupied OKLCH gap on the wheel. Tuning borrowed from GIR/Feeds gives the highest probability of passing the pre-PR axe sweep on first try (PERT-HUE-03 / v1.8 research-before-PR contract).

---

## Config Shape

### Q1: `pert-config.json` shape

| Option | Description | Selected |
|--------|-------------|----------|
| NICU pattern (feeds-shape) | `{ defaults, inputs, dropdowns, advisories }`. Plain TS calc functions. Max consistency with the 4 multi-input calculators. | ✓ |
| Reference app's runFormula | Port `clinical-config.json` + `dosing.ts` declarative step engine. | |
| Hybrid — NICU shell, runFormula inside | feeds-shape outside, runFormula step config for the 3 PERT formulas. | |

### Q2: Pediatric formula shape

| Option | Description | Selected |
|--------|-------------|----------|
| Flat array `[{id, name, fatGPerL}]` | Simple, sortable, search-friendly via SelectPicker. | ✓ |
| Grouped by manufacturer | Mirrors formula-calculator's grouping. | |
| Match xlsx column order verbatim | Preserve H/I ordering for line-by-line spreadsheet diffs. | |

### Q3: FDA strength filter

| Option | Description | Selected |
|--------|-------------|----------|
| Static FDA allowlist in JSON | Embed allowlists per medication; shape test fails CI if non-allowlist value appears. | ✓ |
| Runtime filter in `config.ts` wrapper | JSON has all xlsx strengths; wrapper filters at load. | |
| Hard-code in shape test only | JSON hand-curated; shape test enforces. | |

### Q4: Advisories location

| Option | Description | Selected |
|--------|-------------|----------|
| `advisories[]` array (feeds pattern) | `{ id, field, comparator, value, message, severity }`. STOP-red max-lipase has `severity: 'stop'`. | ✓ |
| Inline in `inputs{ranges}` | Each input has `min/max/advisoryMessage`. | |
| Hard-coded in calculations.ts | Advisories in code; config has only ranges + defaults. | |

**Notes:** Inline-in-ranges doesn't fit cross-input rules like max-lipase (function of weight × lipase × meals). The `advisories[]` array supports those.

---

## State Strategy

### Q1: Storage

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage — match 5-cal pattern | Key `nicu_pert_state`. Mirrors `nicu_uac_uvc_state` and the rest. Resolves spec inconsistency in favor of codebase pattern. | ✓ |
| sessionStorage — honor spec | Key `nicu:pert:mode` schema `{v:1, mode}` per PERT-MODE-02. Diverges from established pattern. | |
| Hybrid | Mode in sessionStorage, inputs in localStorage. | |

### Q2: State shape

| Option | Description | Selected |
|--------|-------------|----------|
| Single class, mode-specific sub-objects | `{ mode, weightKg, medicationId, strengthValue, oral: {...}, tubeFeed: {...} }`. Honors PERT-MODE-03. | ✓ |
| Two state classes | `pertOralState` + `pertTubeFeedState` + shared. | |
| Flat with mode prefix | All keys flat; `oralFatGrams`, `tubeVolumePerDayMl`, etc. | |

### Q3: First-run defaults

| Option | Description | Selected |
|--------|-------------|----------|
| Match xlsx default rows | Oral: weight=9.98 kg, fat=25 g, etc. Tube-Feed: weight=6.80 kg, Kate Farms 1.2, volume=1000. First-run renders meaningful number. | |
| Empty / null inputs | Hero shows empty-state copy on first visit. Honors PERT-SAFE-04 from clean slate. | |
| Conservative weight only | weight=3.0 kg, other inputs null. Mixed signal; matches UAC/GIR convention. | ✓ |

### Q4: Mode default

| Option | Description | Selected |
|--------|-------------|----------|
| Oral | Per PERT-MODE-02 literal text. Most-used pediatric pathway. | |
| Most-recent across modes | Persist last-edited mode, restore on next visit. | ✓ |

**Notes:** D-09 overrides spec sessionStorage in favor of codebase consistency. D-12 overrides PERT-MODE-02's literal "first-run defaults to Oral" — first-run *is* still Oral (initial state), but returning users get their last-edited mode.

---

## Registry Icon + Label

### Q1: Icon source

| Option | Description | Selected |
|--------|-------------|----------|
| Lucide `Pill` | No new dep; already-used family; reads as 'medication'; distinct silhouette. | ✓ |
| Inline custom `Pert.svelte` | Hand-drawn capsule glyph at 24px / 1.5px stroke matching Lucide. Most distinctive; ~30 min design work. | |
| Tabler `IconCapsule` | Adds `@tabler/icons-svelte` dep; explicit two-tone capsule. Mixed-family risk. | |
| Iconify `@iconify/svelte` | Pulls single SVG without full library; runtime resolver +5KB. | |

**Notes:** Reframing question — user asked whether a non-Lucide source would have a better symbol. Surveyed Tabler (Capsule), Phosphor (Capsule, Pill), Material Symbols (medication, capsule_pill_outline), Iconify resolver, and inline-SVG. User picked Lucide `Pill` for minimum friction; inline-SVG remains available as a future Phase 4 polish option.

### Q2: Label

| Option | Description | Selected |
|--------|-------------|----------|
| PERT | 4 chars, all-caps acronym. Recognized clinically. | ✓ |
| Enzymes | 7 chars; plain-English; loses clinical-acronym signal. | |
| PERT Dose | 9 chars; risks crowding past UAC/UVC's 8-char ceiling. | |

### Q3: Description

| Option | Description | Selected |
|--------|-------------|----------|
| Pediatric EPI PERT calculator | Concise; matches GIR pattern. | ✓ |
| Pancreatic enzyme replacement therapy calculator | Spells out acronym for assistive tech. | |
| PERT capsule dosing for pediatric oral and tube feeds | Most descriptive; verbose. | |

### Q4: Registry position

| Option | Description | Selected |
|--------|-------------|----------|
| Append at end (after UAC/UVC) | Maintains historical add-order; zero side-effects. | |
| Insert by clinical category | Group by category; registry rewrite. | |
| **(User free-text override)** Sort alphabetically | Re-sort all 6 entries alphabetically by id/label. | ✓ |

**Notes:** User overrode the option list with "Sort them alphabetically." This forced two follow-up clarifications:

#### Q4a: Side-effect 1 — `defaultIds()` first-run order changes

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcode `FIRST_RUN_DEFAULTS` array | Decouple first-run set from registry order. Honors PERT-ARCH-07 verbatim. | |
| Accept new alphabetical default `[feeds, formula, gir, morphine-wean]` | First-run favorites change. Visible at v1.15 cut. PERT-ARCH-07 reframed. | ✓ |
| Sort hardcoded list to match registry | Effectively same as accept-alphabetical. | |

#### Q4b: Side-effect 2 — `recover()` re-sort behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Drop registry-order re-sort | Stored order preserved verbatim; only filter/cap remain. Honors user agency; smallest visible churn. | ✓ |
| Re-sort to alphabetical | Existing users' explicit ordering snaps on first v1.15 load. | |
| Schema-bump + one-time migration | Bump SCHEMA_VERSION; migrate then preserve. Modifies favorites contract. | |

**Notes on side-effects:** PROJECT.md and REQUIREMENTS.md PERT-ARCH-07 must be updated to reflect alphabetical first-run defaults during Phase 1 execution — before merge. Worth a release-note callout. Existing v1.13/v1.14 users' favorites order is preserved (D-21); only fresh installs see the new default.

---

## Claude's Discretion

- AboutSheet body-copy wording (citations + structure locked in D-24; exact prose left to executor).
- Validation message phrasing (config-level; exact strings TBD in Phase 2 with empty-state unification).
- File-level layout inside `src/lib/pert/` (mirrors `src/lib/uac-uvc/`).
- Whether to remove or keep the `defaultIds()` registry-fallback after hardcoding the first-run default.

---

## Deferred Ideas

- SegmentedToggle identity-hue wash → Phase 4 (PERT-DESIGN-05).
- Custom inline SVG icon → Phase 4 polish option if Lucide `Pill` feels generic.
- AboutSheet body copy → Phase 4 polish.
- Schema-bump for favorites → Future phase if needed; rejected in favor of D-21.
- Adult Oral / Adult Tube-Feed PERT modes → Out of scope for v1.15.
- Per-meal historical logging → Out of scope.
- Custom formula entry → Out of scope.
