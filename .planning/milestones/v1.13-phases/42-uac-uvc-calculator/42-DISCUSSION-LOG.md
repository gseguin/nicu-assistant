# Phase 42: UAC/UVC Calculator - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 42-uac-uvc-calculator
**Mode:** `--auto` (all gray areas auto-selected; each decision chose the recommended default)
**Areas discussed:** Architecture scaffolding, Identity hue, Hero card layout, UAC/UVC distinction, Weight input (textbox+slider), Module layout, State persistence, Route shell, AboutSheet, Parity tests, Component tests, E2E coverage, Axe coverage

---

## Architecture scaffolding (D-01, D-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Wave-0 pattern (CalculatorId + registry + route in first commit) | Follow v1.8 Key Decision; land plumbing before feature code | ✓ |
| Feature-first (build UI against stubbed registry) | Faster to see UI, but breaks types and forces redo | |
| Split into separate phases | Over-fragmentation given calculator simplicity | |

**User's choice:** Wave-0 pattern (auto default).
**Notes:** Phase 41 D-05 already generalized `activeCalculatorId` to registry-driven, so the only NavShell-adjacent work is the registry entry itself.

---

## First-run favorites policy (D-02)

| Option | Description | Selected |
|--------|-------------|----------|
| UAC/UVC non-favorited by default (registry position 5) | Preserves current 4-tab default bar; exercises favorites flow naturally | ✓ |
| UAC/UVC default-favorited, push Feeds off | Visible regression for existing v1.12 users | |
| UAC/UVC default-favorited, ship 5-tab default | Violates 4-cap (Phase 40 contract) | |

**User's choice:** Non-favorited (auto default).
**Notes:** `defaultIds()` slice(0, 4) holds; UAC/UVC lives in the hamburger until the user stars it. This is the whole reason favorites-nav shipped before UAC/UVC.

---

## Identity hue (D-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Hue ~350 (muted rose/crimson) | Farthest perceptual gap from all 4 existing hues; clinically reads "umbilical" | ✓ |
| Hue ~280 (violet/indigo) | Available gap but less distinct from blue (220) at low chroma | |
| Hue ~90 (olive-yellow-orange) | Too close to Feeds (30) at low chroma; risks confusion | |
| Pink/magenta ~340 | Too close to "warning pink" association in clinical context | |

**User's choice:** ~350 rose (auto default).
**Notes:** Researcher MUST compute exact OKLCH pairs and verify 4.5:1 across all 4 identity surfaces in light + dark BEFORE any CSS commit (v1.8 Key Decision). Starting candidates from GIR 145 / Feeds 30 tuning math are in CONTEXT.md D-03.

---

## Hero card layout (D-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Two side-by-side cards on desktop, stacked on mobile | 2:1 relationship visible at a glance on desktop; readable on mobile | ✓ |
| Single card with two rows (GIR-style dual metric) | Merges UAC and UVC visually — violates UAC-05 | |
| Tabbed toggle between UAC and UVC views | Hides one from view; clinicians want both simultaneously | |

**User's choice:** Two cards (auto default).
**Notes:** Side-by-side `md:grid-cols-2` / stacked `grid-cols-1`.

---

## UAC-vs-UVC distinction (D-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Three independent cues (icon + semantic eyebrow text + positional identity stripe) | Redundancy is the WCAG-grade pattern for preventing clinical misreading | ✓ |
| Icon-only distinction | Fails for color-blind users and at small render sizes | |
| Label-only distinction | Violates UAC-05 "visually distinct" | |
| Per-card distinct identity hues (UAC hue + UVC hue) | Conflicts with v1.5 one-hue-per-calculator convention | |

**User's choice:** Three cues (auto default).
**Notes:** `ArrowDownToLine` / `ArrowUpFromLine` icons; "UAC DEPTH — ARTERIAL" / "UVC DEPTH — VENOUS" eyebrows; identity stripe on card top (UAC) vs bottom (UVC). UI-SPEC phase validates.

---

## Hero card content (D-06)

| Option | Description | Selected |
|--------|-------------|----------|
| GIR-style hero (eyebrow + large tabular numeral + unit + empty-state placeholder + aria-live + reduced-motion pulse) | Matches every other hero in the app | ✓ |
| Minimalist (value-only) | Breaks convention; hurts AT discoverability | |
| Add secondary metadata row (formula expression shown) | Adds noise; formula is in AboutSheet | |

**User's choice:** GIR-style (auto default).
**Notes:** 1-decimal precision (`toFixed(1)`) matches xlsx and bedside documentation.

---

## Weight input: textbox + slider bidirectional sync (D-07)

| Option | Description | Selected |
|--------|-------------|----------|
| Shared `weightKg` state; NumericInput with `bind:value` + `<input type="range">` with manual oninput | Simplest possible sync; no derived store or broadcast | ✓ |
| Extract `WeightSlider` composite component | Unearned complexity; single consumer | |
| Slider only (no textbox) | Can't type exact weight; fails UAC-01 | |
| Textbox only (no slider) | Fails UAC-02 | |

**User's choice:** Shared state + inline markup (auto default).
**Notes:** `accent-color: var(--color-identity)` for thumb; `step=0.1`; min/max from `uac-uvc-config.json`.

---

## Module layout (D-08)

| Option | Description | Selected |
|--------|-------------|----------|
| `src/lib/uac-uvc/` mirroring `src/lib/gir/` exactly | 4 shipped calculators prove the pattern; pattern-mapper friendly | ✓ |
| Flattened into `src/lib/calculators/` | Breaks v1.0 pattern with no benefit | |
| Share math with an existing module | No math overlap with existing calculators | |

**User's choice:** Mirror GIR layout (auto default).
**Notes:** 11 files per the GIR shape, minus `normalize.ts` and minus any titration-grid equivalents.

---

## State persistence (D-09)

| Option | Description | Selected |
|--------|-------------|----------|
| sessionStorage key `nicu_uac_uvc_state` via class-based singleton (GIR pattern) | Clinical-correct (sessionStorage, not localStorage); consistent with all 4 shipped calcs | ✓ |
| localStorage | Would persist across browser sessions — UAC-08 says sessionStorage | |
| No persistence | Loses value across route navigation; breaks muscle memory | |

**User's choice:** sessionStorage (auto default).
**Notes:** Default weight 2.5 kg matches xlsx B2/B6.

---

## Route shell (D-10)

| Option | Description | Selected |
|--------|-------------|----------|
| `/uac-uvc` route with `.identity-uac mx-auto max-w-lg ...` container + Ruler-icon + h1 header | Mirrors GIR route; satisfies Phase 41 D-03 "non-favorited active routes self-identify" | ✓ |
| Dynamic route (`/catheter/[type]`) | Over-engineered; two closed-form formulas don't need dynamic routing | |
| Route inside `/calculators/` prefix | Inconsistent with existing flat route layout | |

**User's choice:** `/uac-uvc` flat route (auto default).

---

## `activeCalculatorId` / NavShell (D-11)

| Option | Description | Selected |
|--------|-------------|----------|
| Zero NavShell edits — rely on Phase 41 D-05 registry-driven lookup | Phase 41 already generalized this; UAC/UVC resolves automatically | ✓ |
| Re-add a ternary for `/uac-uvc` explicitly | Regresses Phase 41 D-05; pointless duplication | |

**User's choice:** Zero edits (auto default).
**Notes:** UAC-ARCH-05 already satisfied by Phase 41's code; Phase 42 confirms via test only.

---

## AboutSheet entry (D-12)

| Option | Description | Selected |
|--------|-------------|----------|
| Extend `aboutContent` record with UAC/UVC key citing xlsx + imaging caveat + Shukla/Dunn attribution | Matches GIR's entry structure; satisfies UAC-09 | ✓ |
| Skip clinical attribution | Honesty about formula class is clinically correct | |
| Add alternates list | v1.13 Out of Scope | |

**User's choice:** Extended entry (auto default).

---

## Parity tests (D-13)

| Option | Description | Selected |
|--------|-------------|----------|
| 5-weight fixture (0.3, 1.0, 2.5, 5.0, 10.0 kg) with 1% relative OR 0.01 cm absolute epsilon | Matches `gir-parity.fixtures.json` shape; covers boundaries | ✓ |
| Exact-equality tests (no epsilon) | IEEE-754 drift at boundaries not worth debugging | |
| Monte Carlo sweep | Over-kill for closed-form formulas | |

**User's choice:** 5-weight fixture (auto default).

---

## Component test (D-14)

| Option | Description | Selected |
|--------|-------------|----------|
| 5 test cases: empty state, valid flow, sync, out-of-range, persistence | Matches GIR's component-test depth | ✓ |
| Add snapshot testing | Snapshots add flakiness; skip | |
| Skip component tests (rely on E2E) | UAC-TEST-02 explicitly requires component test | |

**User's choice:** 5 cases (auto default).

---

## E2E coverage (D-15)

| Option | Description | Selected |
|--------|-------------|----------|
| `e2e/uac-uvc.spec.ts` with happy-path + favorites round-trip + slider interaction | Fulfills Phase 41 D-10 "Phase 42 extends this with UAC/UVC" | ✓ |
| Edit `favorites-nav.spec.ts` to add UAC/UVC steps | Cross-cuts topical ownership; harder to navigate | |
| Add as a dedicated favorites-flow spec | Duplicates Phase 41's coverage | |

**User's choice:** New topical spec (auto default).

---

## Axe coverage (D-16)

| Option | Description | Selected |
|--------|-------------|----------|
| New `uac-uvc-a11y.spec.ts` with light + dark sweeps at 375 (+ possibly 1280) | Mirrors `gir-a11y.spec.ts`; research-before-PR means first-run green | ✓ |
| Fold into `uac-uvc.spec.ts` | Blurs functional vs a11y separation (contra project convention) | |
| Skip (rely on existing sweeps) | Route-specific axe run is required by UAC-TEST-04 | |

**User's choice:** New dedicated spec (auto default).

---

## Claude's Discretion

The following items are delegated to Claude / UI-SPEC / planner judgment:

- Exact icon choice for registry entry (D-01 recommends `Ruler`; alternates: `ActivitySquare`, `Maximize2`).
- Exact icon choice for UAC arterial / UVC venous card headers (D-05 recommends directional arrows; pattern-mapper may suggest an established alternate).
- Visible min/max labels on slider vs only in text hint.
- Label association pattern between textbox and slider.
- Final hero-display decimal precision (1 vs 0).
- Pulse-key composition (`weight.toFixed(2)` is sufficient).
- Whether Ruler rotates in the h1 header (no).
- Whether `+page.ts` needs SSR disablement (no).
- Precise OKLCH values for `.identity-uac` — researcher's deliverable.
- Slider tick marks at integer kg values.

---

## Deferred Ideas

See `42-CONTEXT.md` `<deferred>` section. Key items:
- Alternate catheter-depth formulas (Shukla, Dunn, birth-weight variants)
- Gestational-age adjustment
- `WeightSlider` shared component extraction
- Slider tick marks
- Haptic feedback
- Per-card identity hues (rejected in favor of single `.identity-uac`)

---

*Phase: 42-uac-uvc-calculator*
*Discussion log generated: 2026-04-23 (auto mode — reflects recommended defaults for all gray areas)*
