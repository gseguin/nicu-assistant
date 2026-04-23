# Phase 42: UAC/UVC Calculator - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning
**Mode:** `--auto` (all decisions are recommended defaults — review before planning if any feel wrong)

<domain>
## Phase Boundary

Add the fifth clinical calculator: UAC/UVC umbilical catheter depth. Clinicians open it from the hamburger menu (Phase 40/41 ship it as a non-favorited calculator), enter a weight (0.3–10 kg) via textbox OR slider with bidirectional sync, and see two visually-distinct hero cards — UAC depth (`weight × 3 + 9` cm) and UVC depth (`(weight × 3 + 9) / 2` cm) — matching `uac-uvc-calculator.xlsx` within 1% epsilon. Own identity hue researched before PR (per v1.8 Key Decision) passes 4.5:1 in both themes on first sweep. Wave-0 architecture (`CalculatorId` union + registry entry + `/uac-uvc` route) lands first-commit; logic, UI, then tests. Exercises the Phase 40/41 end-to-end flow naturally (star-to-bottom-bar + disabled-at-cap) without needing to invent that workflow.

**Requirements covered:** UAC-01..09, UAC-ARCH-01..05, UAC-TEST-01..04 (18 requirements).

**Explicit non-goals (belong to other phases):**
- No changes to the favorites store, hamburger menu, or NavShell rendering logic (Phase 40/41 shipped; Phase 41 D-05 already generalized `activeCalculatorId` to registry-driven lookup so UAC/UVC plugs in with zero NavShell edits).
- No alternate UAC/UVC formulas (Shukla, Dunn, etc.) — REQUIREMENTS.md Out of Scope; single rule-of-thumb matches the xlsx.
- No imaging-confirmation workflow — AboutSheet disclaimer points to institutional protocol only.
- No version bump or AboutSheet app-version edit (Phase 43).
- No per-breakpoint UI or device-specific layout (v1.13 holds at 4-fav universal cap).

</domain>

<decisions>
## Implementation Decisions

### Calculator ID & registry entry
- **D-01 [auto / recommended]:** `CalculatorId` union in `src/lib/shared/types.ts` extends to `'morphine-wean' | 'formula' | 'gir' | 'feeds' | 'uac-uvc'`. Registry entry in `src/lib/shell/registry.ts` uses `id: 'uac-uvc'`, `label: 'UAC/UVC'`, `href: '/uac-uvc'`, icon **`Ruler`** from `@lucide/svelte` (already installed — no new dep), `identityClass: 'identity-uac'`. `identityClass` union in `CalculatorEntry` extends to include `'identity-uac'`.
  - Rationale: `Ruler` maps to "depth measurement" cleanly without conflicting with existing icons (Syringe/Milk/Droplet/Baby). Label `UAC/UVC` (with slash) is how clinicians speak and search for this tool; fits the 375px bottom-bar column width once favorited (tested against the 4-char worst case already in shell layout).
  - Route id = calculator id, matching the shipped convention for all 4 prior calculators.

### First-run favorites — UAC/UVC stays OFF by default
- **D-02 [auto / recommended]:** UAC/UVC is **NOT** in the first-run defaults. Phase 40 D-09 defaults remain `['morphine-wean', 'formula', 'gir', 'feeds']`. Registry position places UAC/UVC as the 5th entry (last). This makes Phase 42 the natural test of the "open hamburger → find non-favorited calc → star → see it join the bar" flow.
  - Rationale: Milestone goal (PROJECT.md §Current Milestone) is "preserves the current v1.12 bottom bar for existing users". If UAC/UVC were default-favorited, we'd either (a) push Feeds off the default bar — visible regression — or (b) ship a 5-tab default which violates the 4-cap. Neither is acceptable. The "exercising the end-to-end flow naturally" is the whole reason favorites landed before UAC/UVC.
  - **Defaults-slice defense (edge case):** Phase 40 `defaultIds()` returns `registry.map(c => c.id).slice(0, FAVORITES_MAX)` — adding UAC/UVC at registry position 5 preserves defaults because slice(0, 4) stops before it. Confirmed in `src/lib/shared/favorites.svelte.ts:17-20`.

### Identity hue selection
- **D-03 [auto / recommended]:** New hue **hue ~350 (muted rose/crimson)**, targeting the only visually distinct segment of the OKLCH wheel not already claimed:
  - Morphine: 220 (clinical blue)
  - Formula: 195 (teal)
  - GIR: 145 (green)
  - Feeds: 30 (terracotta amber)
  - Available gaps: ~350 (rose), ~280 (violet/indigo), ~90 (olive-yellow-orange).
  - **Why ~350 rose:** Perceptually farthest from all 4 existing hues in OKLCH (farthest from 30 = `30 + 360 − 350 = 40° Δ`, farthest from 220 = `130° Δ` — all neighbors at ≥40°). Crimson/rose associates visually with umbilical / arterial/venous clinical imagery without crossing into the "error red" semantic used in the app (which is a narrow red in the `--color-error` range, not a chroma-dampened rose). Violet (~280) was considered and deferred — less distinct from blue (220) at low chroma than rose is from terracotta (30).
  - **Why NOT use a semantic UAC-is-red + UVC-is-blue scheme:** Phase decisions D-06/D-07 (below) address UAC-vs-UVC distinction at the card level with independent cues; the calculator's **tab identity** is a single hue per v1.5 convention. Trying to bake two colors into one `.identity-uac` token pair would fight the shipped identity system.
  - **Research-before-PR obligation:** Per PROJECT.md Key Decision (v1.8 GIR hue 145 lesson), gsd-phase-researcher MUST compute exact lightness/chroma pairs and verify 4.5:1 against `--color-identity-hero` for all 4 identity surfaces (result hero, focus rings, eyebrows, active-nav indicator) in BOTH themes before any component code is written. Target token pair shape:
    ```css
    .identity-uac {
      --color-identity: oklch(L% C 350);        /* light mode text on hero */
      --color-identity-hero: oklch(L% C 350);   /* light mode hero fill */
    }
    .dark .identity-uac, [data-theme='dark'] .identity-uac {
      --color-identity: oklch(L% C 350);        /* dark mode text */
      --color-identity-hero: oklch(L% C 350);   /* dark mode hero */
    }
    ```
    Starting candidates based on the GIR 145 / Feeds 30 dark-hero pattern (`L ~22-24%, C ~0.045-0.05`): expect light `--color-identity` around `oklch(46-50% 0.12 350)` against `--color-identity-hero` at `oklch(93-95% 0.04 350)`; dark `--color-identity` around `oklch(80-83% 0.10 350)` against `--color-identity-hero` at `oklch(22-24% 0.05 350)`. Exact numbers are researcher's job — starting from GIR 145's tuning math (`42% 0.12 145` light + `22% 0.045 145` dark-hero) is the proven path.

### Layout: two hero cards (UAC-05 distinction)
- **D-04 [auto / recommended]:** Two side-by-side cards on desktop (`md:grid-cols-2`), stacked vertically on mobile (`grid-cols-1`). Card order: **UAC first, UVC second** (matches xlsx row order + UAC is the "parent formula" that UVC halves). Both cards render as `.card .animate-result-pulse .identity-uac`, each with its own `aria-live="polite"` region.
  - Rationale: Side-by-side on desktop shows the 2:1 relationship (UAC≈10cm, UVC≈5cm for a 1-kg infant) at a glance. Stacked on mobile is required by 375px — side-by-side mobile would crush the tabular-numeral hero values below readable size.
  - **Why not a single card with two rows (like GIR's dual-metric card):** GIR's dual metric (CURRENT GIR + INITIAL RATE) is one decision surface. UAC vs UVC are two SEPARATE physical procedures with different equipment and different placement depths — visually merging them invites the exact confusion UAC-05 forbids. Two distinct containers = two distinct mental objects.

### UAC-vs-UVC distinction strategy (UAC-05)
- **D-05 [auto / recommended]:** Three independent cues so a clinician cannot confuse UAC for UVC at a glance:
  1. **Distinct icons:** UAC card uses `ArrowDownToLine` (arterial, drives "down to aorta"); UVC card uses `ArrowUpFromLine` (venous, drives "up to IVC/right atrium"). Both from `@lucide/svelte`. Icons sit at the top-left of each hero card at 24px, colored `--color-identity`.
  2. **Distinct eyebrow labels:** UAC card eyebrow reads `"UAC DEPTH — ARTERIAL"`; UVC card eyebrow reads `"UVC DEPTH — VENOUS"`. Typography: uppercased `text-2xs font-semibold tracking-wide text-[var(--color-identity)]` (matches every other hero eyebrow convention).
  3. **Shared value styling with card-level tinting:** Both cards share the identity hero tint (same `--color-identity-hero`) so the family relationship is clear, but the header strip of each card uses a thin `border-t-4` in `--color-identity` — UAC's stripe on the TOP of the card, UVC's stripe on the BOTTOM of the card. Subtle visual mirror reinforces the arterial/venous (top-to-bottom) pairing at card-level without needing two identity tokens.
  - Rationale: redundant cues (icon + text + position) is the WCAG-grade pattern for preventing clinical misreading under cognitive load. Icons alone fail for color-blind users or when icons render at small size; text alone fails under interruption; position alone fails if the grid flips on mobile. Three cues = robust.
  - **D-05 is UI-spec territory** — final icon choice and stripe position go through the UI-SPEC.md phase (the phase has `UI hint: yes` in roadmap). Flag to the UI-researcher: "UAC-05 requires visible, card-level distinction — test with color-blind simulation at 375px."

### Hero card content composition
- **D-06 [auto / recommended]:** Each card shows (top-down):
  - 4px identity stripe (D-05 positional cue: UAC top, UVC bottom)
  - Icon + eyebrow label in one row (D-05)
  - Large tabular numeral value + unit: `{depth.toFixed(1)}` + `cm`, using `num text-display font-black text-[var(--color-text-primary)]` (matches morphine/GIR hero pattern in `src/lib/gir/GirCalculator.svelte:118-121`). 1 decimal is the xlsx's native precision and matches bedside documentation convention.
  - Empty state (no weight entered yet): `"Enter weight to compute depth"` in `text-ui text-[var(--color-text-secondary)]` — same empty-state pattern as GIR at `GirCalculator.svelte:138-141`.
  - Reduced-motion-gated pulse on value change via `animate-result-pulse` class (shipped v1.6) keyed off `pulseKey = weight.toFixed(2)` — matches GIR's `pulseKey` pattern.
  - `aria-live="polite" aria-atomic="true"` per UAC-06.

### Weight input: textbox + slider bidirectional sync (UAC-01, UAC-02)
- **D-07 [auto / recommended]:** Single source of truth is `uacUvcState.current.weightKg: number | null` in a new `state.svelte.ts` singleton. Textbox uses the existing shared `NumericInput` component (v1.6 range hint + blur-gated error — UAC-07 is "free" via `showRangeHint={true} showRangeError={true}`); slider is a **new `<input type="range">`** rendered inline below the textbox inside the SAME input card. Binding pattern:
  ```svelte
  <NumericInput bind:value={uacUvcState.current.weightKg} min={0.3} max={10} step={0.1} ... />
  <input
    type="range"
    min="0.3" max="10" step="0.1"
    value={uacUvcState.current.weightKg ?? 1}
    oninput={(e) => uacUvcState.current.weightKg = parseFloat((e.target as HTMLInputElement).value)}
    aria-label="Weight slider"
    class="range-uac"
  />
  ```
  - Rationale: Svelte 5 `bind:value` on `NumericInput` + a manual `oninput` on the slider that writes the SAME `uacUvcState.current.weightKg` is the simplest possible bidirectional sync — both surfaces read/write the same reactive `$state` field. No derived store, no broadcast pattern. Blur-gated error on NumericInput continues to fire even when the slider drives the value (confirmed — NumericInput's blur handler is local; sliding via the range input never triggers a textbox blur, so the "Outside expected range" advisory appears only on textbox-typed out-of-range values, which is the desired behavior because the slider physically cannot produce out-of-range).
  - **Why not build a new "WeightSlider" composite component:** Shell complexity isn't earned yet — this is the only calculator with a slider so far. A custom component would add test surface, a11y surface, and maintenance surface to solve a problem that 20 lines of inline markup solves. If/when a second calculator needs a weight slider, extract then.
  - **Slider styling:** use `accent-color: var(--color-identity)` in the `.range-uac` CSS (modern cross-browser pattern, works in Chrome/Safari/Firefox/Edge) — ties the slider thumb to the identity hue without custom thumb styling. Tailwind 4 exposes this cleanly via `[&::-webkit-slider-thumb]:...` if we need more control; default `accent-color` should suffice per the UI-SPEC review.
  - **Step size:** `0.1 kg` on both textbox and slider — matches GIR weight step (`src/lib/gir/gir-config.json:8`) and the xlsx's natural precision. 0.3–10 kg / 0.1 step = 97 discrete positions, which is a reasonable slider granularity at 320px track width.
  - **Slider min/max from config, not hardcoded:** `uac-uvc-config.json` owns `inputs.weightKg = { min: 0.3, max: 10, step: 0.1 }` exactly like `gir-config.json`. Keeps clinical parameters editable without touching component code (PROJECT.md constraint "Clinical data in JSON").

### Module layout
- **D-08 [auto / recommended]:** `src/lib/uac-uvc/` contains:
  ```
  UacUvcCalculator.svelte        — UI composition (inputs card + 2 hero cards)
  UacUvcCalculator.test.ts        — component test (UAC-TEST-02)
  calculations.ts                 — pure functions calculateUacDepth / calculateUvcDepth / calculateUacUvc
  calculations.test.ts            — parity tests (UAC-TEST-01)
  uac-uvc-config.json             — { defaults, inputs } block only (no glucoseBuckets analog)
  uac-uvc-config.ts               — typed wrapper
  uac-uvc-config.test.ts          — shape test
  uac-uvc-parity.fixtures.json    — weights 0.3, 1.0, 2.5, 5.0, 10.0 kg + expected UAC/UVC outputs from xlsx
  state.svelte.ts                 — sessionStorage-backed singleton
  types.ts                        — UacUvcStateData, UacUvcInputRanges, UacUvcResult
  ```
  - Exact mirror of `src/lib/gir/` layout. gsd-pattern-mapper will confirm the 1:1 analog.
  - No `normalize.ts` (GIR has one for EPIC paste; UAC/UVC is a single numeric input — EPIC-paste isn't in scope per REQUIREMENTS.md).
  - No titration grid (UAC/UVC is a single-shot depth calculator, not a titration tool).

### State persistence
- **D-09 [auto / recommended]:** sessionStorage key `nicu_uac_uvc_state` (matches GIR's `nicu_gir_state` naming convention). Shape `{ weightKg: number | null }`. `defaultState()` returns `{ weightKg: config.defaults.weightKg }` — default weight `2.5 kg` (matches xlsx B2/B6 value). `init()` / `persist()` / `reset()` methods mirror GIR's `GirState` class (`src/lib/gir/state.svelte.ts:21-55`).
  - Rationale: UAC-08 says "sessionStorage persistence consistent with other calculators". GIR is the closest analog (single-form calculator with a numeric default). Copy exactly.
  - `init()` called from `+page.svelte` `onMount` — identical wiring to every other calculator.

### Route
- **D-10 [auto / recommended]:** `src/routes/uac-uvc/+page.svelte`. Header uses `Ruler` icon (same as registry) + h1 `"UAC/UVC Catheter Depth"` + subtitle `"cm · weight-based formula"`. Wrap content in `.identity-uac mx-auto max-w-lg space-y-4 px-4 py-6 md:max-w-4xl` — exactly the GIR route layout at `src/routes/gir/+page.svelte:21`.
  - Rationale: Phase 41 D-03 / D-04 design principle: "non-favorited active routes self-identify via page `<h1>`" — the UAC/UVC route header IS the active-route indicator because NavShell won't highlight a non-favorited tab. This is specifically called out in Phase 41's Deferred Ideas ("On-page header chrome for `/uac-uvc` — caught by D-03 as a downstream implication for Phase 42; Phase 42 research should pick it up"). The h1 + identity icon in the header satisfies this.
  - The `identity-uac` CSS class on the container scopes the new OKLCH tokens to this route + its children; no bleed into other routes.

### `activeCalculatorId` — already correct via Phase 41 D-05
- **D-11 [auto / recommended]:** NavShell requires **zero edits** for `activeCalculatorId`. Phase 41 D-05 already replaced the hardcoded ternary with a registry-driven lookup (`NavShell.svelte:23-25`: `CALCULATOR_REGISTRY.find((c) => page.url.pathname.startsWith(c.href))?.id`). Adding UAC/UVC to the registry automatically makes `/uac-uvc` resolve to `'uac-uvc'` as the active id.
  - Rationale: this is the payoff of Phase 41 doing the Wave-0 cleanup in its own scope — Phase 42 inherits correct routing without touching NavShell.
  - UAC-ARCH-05 is technically already satisfied by Phase 41's work — Phase 42 still validates via a component test that `/uac-uvc` resolves to `'uac-uvc'` (the test exists once UAC/UVC is in the registry). NavShell is NOT edited for UAC-ARCH-05.

### AboutSheet entry (UAC-09)
- **D-12 [auto / recommended]:** Extend `aboutContent` record in `src/lib/shared/about-content.ts` with a `'uac-uvc'` key:
  ```ts
  'uac-uvc': {
    title: 'UAC/UVC Catheter Depth',
    version: appVersion,
    description:
      'Calculates umbilical arterial (UAC) and umbilical venous (UVC) catheter insertion depths from infant weight, using the Shukla/Dunn weight-based rule of thumb.',
    notes: [
      'Formulas: UAC depth = weight × 3 + 9 (cm); UVC depth = (weight × 3 + 9) / 2 (cm).',
      'Source: uac-uvc-calculator.xlsx (cells B3 and B7).',
      'Rule-of-thumb estimate only — final placement MUST be confirmed by imaging (chest/abdominal X-ray) per institutional protocol before use.'
    ]
  }
  ```
  - Rationale: UAC-09 explicitly requires citing `uac-uvc-calculator.xlsx` + imaging-confirmation caveat. Structure and tone mirror GIR's entry at `about-content.ts:37-48`. Title "UAC/UVC Catheter Depth" disambiguates from the tab label "UAC/UVC" (the tab is tight space; the dialog has room for the full phrase).
  - "Shukla/Dunn weight-based rule of thumb" is the published attribution — even though REQUIREMENTS.md Out of Scope excludes alternate formulas, attribution of the formula class is clinically honest and doesn't open the door to implementing alternates.

### Parity tests (UAC-TEST-01)
- **D-13 [auto / recommended]:** `calculations.test.ts` validates UAC and UVC formulas against a fixture file with 5 representative weights:
  ```
  0.3 kg  → UAC 9.90 cm, UVC 4.95 cm  (smallest infant)
  1.0 kg  → UAC 12.00 cm, UVC 6.00 cm
  2.5 kg  → UAC 16.50 cm, UVC 8.25 cm  (xlsx default)
  5.0 kg  → UAC 24.00 cm, UVC 12.00 cm
  10.0 kg → UAC 39.00 cm, UVC 19.50 cm (largest in-range)
  ```
  - Fixture file: `uac-uvc-parity.fixtures.json` (plain JSON, matches `gir-parity.fixtures.json` shape).
  - Epsilon: `1% relative OR 0.01 cm absolute` — `weight*3+9` is exact under IEEE-754 for these inputs so 1% is comfortable headroom; the epsilon exists for parity-test consistency with GIR/feeds/morphine, not because we expect drift.
  - Also tested: boundary values (0.3 kg floor, 10.0 kg ceiling), non-input robustness (negative weight returns a computed value, not a throw — matches GIR's `calculateCurrentGir` which trusts its inputs; blur-gated range error is the UX guard, not the math guard).

### Component test (UAC-TEST-02)
- **D-14 [auto / recommended]:** `UacUvcCalculator.test.ts` covers:
  1. Empty state — no weight set, both hero cards show `"Enter weight to compute depth"` placeholder.
  2. Valid input flow — type `2.5` in textbox, both hero cards render `16.5 cm` and `8.3 cm` respectively (1-decimal display).
  3. Bidirectional sync — set slider to `5.0`, textbox reads `5`; type `1.0` in textbox, slider value reflects `1.0`.
  4. Out-of-range advisory — type `15`, blur, expect `"Outside expected range — verify"` from the NumericInput; slider cannot produce out-of-range by construction.
  5. sessionStorage persistence — call `uacUvcState.persist()`, re-instantiate via `init()`, value survives.
  - Pattern: mirror `GirCalculator.test.ts` layout and Svelte Testing Library usage.

### E2E test (UAC-TEST-03) — doubles as favorites-flow exerciser
- **D-15 [auto / recommended]:** New Playwright spec `e2e/uac-uvc.spec.ts` covers the happy path + the unique-to-this-phase favorites flow:
  1. Mobile 375 / desktop 1280: navigate to `/uac-uvc`, enter weight via textbox, assert UAC and UVC hero values; verify `inputmode="decimal"` attribute on the weight textbox (regression guard consistent with GIR test convention).
  2. **Favorites round-trip (Phase 42 unique path):** Start at `/`, open hamburger, confirm UAC/UVC appears in the list as non-favorited, tap its star, assert bottom bar now shows 5 tabs OR assert that clicking star when cap=4 is disabled — the test cleanly expresses BOTH arms: (a) first un-favorite Feeds → bar has 3 tabs, star UAC/UVC → bar has 4 tabs with UAC/UVC; (b) re-favorite Feeds → cap=4 is full, try to star UAC/UVC → star is `disabled` + `aria-disabled="true"` + the cap-full caption `"4 of 4 favorites — remove one to add another."` is visible in the hamburger (assertion from Phase 40 D-05).
  3. Reload page, confirm UAC/UVC favorite state persisted (localStorage).
  4. `input[type="range"]` slider interaction — drag to `5`, assert textbox reflects `5`.
  - Rationale: this spec extends but does NOT duplicate Phase 41's `favorites-nav.spec.ts` — that test used "un-favorite then re-favorite Feeds" as a round-trip because UAC/UVC didn't exist yet (Phase 41 D-10 called this out explicitly: "Phase 42 extends this spec to use UAC/UVC"). Phase 42 fulfills that promise.

### Axe sweeps (UAC-TEST-04)
- **D-16 [auto / recommended]:** New Playwright a11y spec `e2e/uac-uvc-a11y.spec.ts` mirrors `gir-a11y.spec.ts` — 2 sweeps (light + dark) at viewport 375, then 2 more at viewport 1280 if that matches existing a11y-spec granularity (audit `gir-a11y.spec.ts` during implementation). **Expected: 2 new sweeps minimum (light + dark), bringing the project total from 20/20 → 22/22 by end of Phase 42.** Phase 41 added 2 hamburger sweeps, so the 20/20 baseline already includes them; Phase 42 adds UAC/UVC-route sweeps on top.
  - `axe-core/playwright` as configured in existing specs. No new dependencies.
  - Research-before-PR obligation (D-03) means the axe sweeps pass on the FIRST run — any a11y regression from identity hue is a researcher bug, not a tuning-loop.

### Out-of-scope for this phase (explicit)
- **D-OUT-01:** No changes to `favorites.svelte.ts`, `HamburgerMenu.svelte`, or `NavShell.svelte` beyond what the new registry entry triggers transitively. All Phase 40/41 contracts are honored.
- **D-OUT-02:** No version bump, no PROJECT.md edits, no favicon regeneration — those are Phase 43.
- **D-OUT-03:** No alternate UAC/UVC formulas. Single xlsx formula is the source of truth.
- **D-OUT-04:** No imaging-confirmation UI flow — only the AboutSheet caveat (D-12).
- **D-OUT-05:** No slider-driven out-of-range UX (slider physically can't produce it by construction). Textbox is the sole path for out-of-range input.
- **D-OUT-06:** No `WeightSlider` component extraction (D-07) — inline markup until a second calculator earns the abstraction.
- **D-OUT-07:** No clinical data beyond what's in the xlsx. No gestational-age-adjusted formulas, no umbilical-stump-length offsets, no tip-position radiologic verification logic.

### Claude's Discretion
- Exact icon choice for UAC/UVC tab (D-01 recommends `Ruler` but `ActivitySquare` or `Maximize2` are alternates if a visual audit in UI-SPEC prefers one).
- Exact icon choice for UAC arterial / UVC venous card headers (D-05 recommends `ArrowDownToLine` / `ArrowUpFromLine` — final UI-SPEC can swap if pattern-mapper finds a cleaner analog in the existing codebase).
- Whether the slider has visible min/max labels (`"0.3 kg" ... "10 kg"`) or just a range hint in text. Default: inherit NumericInput's `showRangeHint` output and don't duplicate on the slider.
- Whether slider + textbox share a single `<label>` or have separate `aria-label`s. UI-SPEC reviews.
- Exact decimal precision in hero display: D-06 picks 1 decimal; if UI-SPEC says 0 decimals (whole cm) aligns better with bedside documentation, that's a valid override — research should surface clinical convention.
- Pulse animation key composition (`${uac.toFixed(2)}-${uvc.toFixed(2)}` vs just `weight.toFixed(2)`): `weight` is the only independent variable so keying off weight is sufficient and simpler. Either is fine.
- Whether the Ruler icon in the h1 header rotates (visual rhyme with "depth down") — likely NO, stays upright per the existing GIR `Droplet` pattern.
- Whether the route's `+page.ts` needs any config (disable SSR for sessionStorage access). Default: NO — existing GIR route doesn't have one; sessionStorage access is guarded inside `init()` via the `try/catch` pattern.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone-level
- `.planning/PROJECT.md` — Core value, constraints (tech stack, PWA-only, WCAG 2.1 AA, 48px touch targets), v1.13 milestone goals. Key Decision §"Research before PR for new identity hues" — MUST be followed for D-03.
- `.planning/REQUIREMENTS.md` §UAC-01..09, §UAC-ARCH-01..05, §UAC-TEST-01..04 — the 18 requirements this phase closes. Also §"Out of Scope" for v1.13 constraints.
- `.planning/ROADMAP.md` §"Phase 42: UAC/UVC Calculator" — success criteria; §"Order Rationale" for why UAC/UVC follows favorites-nav.

### Prior phase context (must-read)
- `.planning/phases/40-favorites-store-hamburger-menu/40-CONTEXT.md` — Phase 40 decisions (favorites store API, cap behavior, registry-iteration contract). D-02 depends on Phase 40 D-09 first-run defaults behavior.
- `.planning/phases/41-favorites-driven-navigation/41-CONTEXT.md` — Phase 41 decisions. D-11 relies on Phase 41 D-05 (registry-driven `activeCalculatorId`) and D-03 ("non-favorited active routes: bars don't grow a tab"). D-10 explicitly references this phase's E2E as the "UAC/UVC extension" of `favorites-nav.spec.ts`.
- `.planning/phases/40-favorites-store-hamburger-menu/40-VERIFICATION.md` — Confirms the favorites-flow infrastructure that D-15's E2E round-trip exercises.
- `.planning/phases/41-favorites-driven-navigation/41-VERIFICATION.md` — Confirms the NavShell flip that D-11 rides on for zero-edit integration.

### Clinical sources / spreadsheets (MANDATORY for parity)
- `uac-uvc-calculator.xlsx` (repo root) — **Formula source.** Cells B3 and B7 are the authoritative formulas (`=B2*3+9` and `=(B6*3+9)/2`); cell B2/B6 = 2.5 kg is the xlsx default. Parity fixtures (D-13) must be re-derived from this file, not from this CONTEXT.md.

### Existing code Phase 42 edits or reads
- `src/lib/shared/types.ts` §`CalculatorId` — extended in D-01.
- `src/lib/shell/registry.ts` §`CalculatorEntry`, §`CALCULATOR_REGISTRY` — new entry added per D-01; `identityClass` union extended for `'identity-uac'`.
- `src/app.css` — new `.identity-uac` + `.dark .identity-uac` / `[data-theme='dark'] .identity-uac` token pair (D-03). Reference existing `.identity-gir`, `.identity-feeds` OKLCH pairs for tuning math.
- `src/lib/shared/about-content.ts` — new `'uac-uvc'` key in `aboutContent` record (D-12). TypeScript `Record<CalculatorId, AboutContent>` forces this to compile once the union is extended.
- `src/lib/gir/` — **Reference implementation.** Every file in this directory is the template Phase 42 mirrors:
  - `src/lib/gir/GirCalculator.svelte` — hero card composition pattern, `pulseKey` derivation, empty-state text, `aria-live` placement.
  - `src/lib/gir/state.svelte.ts` — sessionStorage singleton class pattern.
  - `src/lib/gir/calculations.ts` — pure-function layout with JSDoc rationale block.
  - `src/lib/gir/gir-config.json` — `{ defaults, inputs }` shape (UAC/UVC drops `glucoseBuckets`).
  - `src/lib/gir/gir-config.ts` — typed wrapper pattern.
  - `src/lib/gir/types.ts` — state/result/inputs-range type pattern.
  - `src/lib/gir/GirCalculator.test.ts` — component-test structure.
  - `src/lib/gir/calculations.test.ts` — parity-test structure.
  - `src/lib/gir/gir-parity.fixtures.json` — parity-fixture shape.
- `src/routes/gir/+page.svelte` — route-level shell pattern (onMount init, setCalculatorContext, svelte:head title, `.identity-gir mx-auto max-w-lg ...` container).
- `src/lib/shared/components/NumericInput.svelte` — used as-is; v1.6 `showRangeHint` + `showRangeError` props satisfy UAC-07.
- `src/lib/shell/NavShell.svelte` — **read-only in Phase 42** (D-11). Registry-driven `activeCalculatorId` already handles `/uac-uvc`.

### Existing tests Phase 42 extends
- `e2e/gir.spec.ts` — structural reference for `e2e/uac-uvc.spec.ts` (D-15). Viewport conventions (375 / 1280), `inputmode="decimal"` regression.
- `e2e/gir-a11y.spec.ts` — structural reference for `e2e/uac-uvc-a11y.spec.ts` (D-16). Light + dark sweep pattern.
- `e2e/favorites-nav.spec.ts` (Phase 41) — the "un-favorite Feeds then re-favorite" round-trip is extended by `uac-uvc.spec.ts` D-15 part 2 with "star UAC/UVC" as the real round-trip.
- `src/test-setup.ts` — jsdom `HTMLDialogElement` + `matchMedia` polyfills. No changes needed.

### A11y / design tokens
- `src/app.css` §`.identity-morphine`, §`.identity-formula`, §`.identity-gir`, §`.identity-feeds` — canonical OKLCH tuning reference for D-03. Note the consistent pattern: light `L~42-50% C~0.11-0.13` / hero `L~92-96% C~0.03-0.05`; dark `L~80-83% C~0.09-0.10` / dark-hero `L~22-32% C~0.045-0.08`.
- Existing axe spec suite in `e2e/` — reference for `uac-uvc-a11y.spec.ts` (D-16).
- `--color-scrim`, `--color-border`, `--color-surface`, `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary` — already shipped; Phase 42 consumes unchanged.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`NumericInput` (v1.6-hardened)** — One prop flip (`showRangeHint={true} showRangeError={true}`) delivers UAC-07's blur-gated out-of-range advisory with zero new code. `id="uac-weight"` gives a stable label hook for Playwright.
- **`animate-result-pulse` utility** (shipped v1.6) — Reduced-motion-gated result pulse on the two hero cards. Keying pattern: `{#key pulseKey}...{/key}` wrapping each card.
- **`aria-live="polite" aria-atomic="true"` convention on hero cards** — consumed verbatim from GIR's pattern at `GirCalculator.svelte:106-107`. No new a11y wiring needed.
- **`sessionStorage`-backed state class pattern** — `GirState` in `src/lib/gir/state.svelte.ts` is a drop-in template. Rename `nicu_gir_state` → `nicu_uac_uvc_state`, swap types, done.
- **`@lucide/svelte` icon set** — `Ruler`, `ArrowDownToLine`, `ArrowUpFromLine` are all in the installed set (v1.8.0). No dep additions.
- **`setCalculatorContext({ id, accentColor })` from `context.svelte.ts`** — called in `onMount` of each route; Phase 42 uses `setCalculatorContext({ id: 'uac-uvc', accentColor: 'var(--color-identity)' })`.
- **Favorites store, hamburger menu, and NavShell favorites-flip** — all shipped in Phase 40/41. Adding UAC/UVC to the registry is the ONLY integration point; every other surface (hamburger list, bottom bar, desktop nav, activeCalculatorId, AboutSheet routing) updates automatically via registry iteration.

### Established Patterns
- **`.svelte.ts` singleton for calculator state** — 4 existing examples (morphine, formula/fortification, gir, feeds). UAC/UVC follows identically.
- **Module layout `src/lib/{calculator}/`** — 4 identical shapes (morphine, fortification, gir, feeds). Pattern-mapper can mechanically map Phase 42's files to GIR's.
- **JSON config with typed wrapper + shape test** — config isolation for clinical parameters; v1.6 Key Decision.
- **Spreadsheet-parity tests with ~1% epsilon + named-constant inputs** — v1.8 Key Decision.
- **Wave-0 latent-bug fixes before feature work** — v1.8 Key Decision. D-01 (union + registry) + D-03 (identity CSS) land in the first commit so subsequent plans compile cleanly.
- **Research before PR for new identity hues** — v1.8 Key Decision. D-03 is the single hardest-to-iterate item in the phase; bundling research BEFORE any CSS commit avoids the v1.5 Morphine-axe-tuning-loop pain.
- **`aria-live="polite" aria-atomic="true"` on result heroes** — v1.6 a11y contract.
- **Co-located Vitest tests** — project memory `feedback_test_colocation.md`. `UacUvcCalculator.test.ts` sits beside `UacUvcCalculator.svelte`, not in `__tests__/`.
- **`aria-current="page"` NOT touched by Phase 42** — Phase 41 D-04 preserves current `role="tab"` + `aria-selected` shell ARIA. Phase 42 inherits without modification.
- **Identity CSS scoping via `.identity-X` class on the route container** — 4 existing examples. UAC/UVC adds a 5th, with `.identity-uac` on `/uac-uvc` + the calculator component's root.

### Integration Points
- **`src/lib/shared/types.ts` §`CalculatorId`** — extend union (one-line edit).
- **`src/lib/shell/registry.ts` §`CALCULATOR_REGISTRY`** — append new entry (D-01). `identityClass` union literal type also extends.
- **`src/app.css`** — new `.identity-uac` rule-pair (light + dark). 4 OKLCH tokens tuned from researcher's output (D-03).
- **`src/lib/shared/about-content.ts` §`aboutContent`** — new key (D-12). TypeScript will error at compile time if the key is missing once `CalculatorId` includes `'uac-uvc'` — compiler-enforced completeness.
- **`src/lib/uac-uvc/` — new directory** — 11 files per D-08.
- **`src/routes/uac-uvc/+page.svelte` — new route** — D-10 shape mirrors `/gir`.
- **`e2e/uac-uvc.spec.ts`, `e2e/uac-uvc-a11y.spec.ts` — new Playwright specs** — D-15 / D-16.
- **`e2e/favorites-nav.spec.ts` — read-only in Phase 42.** The "UAC/UVC round-trip" belongs in `uac-uvc.spec.ts` (the calculator owns its E2E), not as an edit to the favorites-nav spec. Keeps specs topically focused.

### Integration WITH Phase 40/41 shipped infrastructure
- `HamburgerMenu.svelte` iterates `CALCULATOR_REGISTRY` (Phase 40 D-12). UAC/UVC appears in the hamburger automatically once it's in the registry — zero changes to the component.
- `favorites.svelte.ts` `defaultIds()` uses `CALCULATOR_REGISTRY.map(...).slice(0, 4)` — slice cap means UAC/UVC is never auto-favorited (D-02 holds).
- `NavShell.svelte` `activeCalculatorId` uses `CALCULATOR_REGISTRY.find(...)` (Phase 41 D-05) — UAC/UVC active-id resolution works without NavShell edits.
- `AboutSheet` `calculatorId` prop accepts `CalculatorId` — TypeScript forces `about-content.ts` to add the entry (D-12).

</code_context>

<specifics>
## Specific Ideas

- **Icon hierarchy — three independent levels:**
  1. Tab/registry icon = `Ruler` (catalog-level, "this is the depth tool").
  2. Route h1 icon = `Ruler` (route-level, same as tab — muscle memory).
  3. Per-card icon = `ArrowDownToLine` (UAC, arterial, "goes down") / `ArrowUpFromLine` (UVC, venous, "goes up") — semantic anatomy cue.
  No conflict; three levels each carry distinct information.
- **"Arterial" / "Venous" eyebrow text is essential** — the semantic word beats any icon, especially for new clinicians or those cross-reading under interruption. Eyebrow text + icon is redundant by design (UAC-05).
- **Slider is visibly weight-only.** It does not drive any computed field directly; it drives `weightKg`, and both hero cards re-derive from `weightKg`. This is a clinical-trust principle: "the slider moves ONE thing, and I see TWO outputs flow from it" — keeps the cause/effect unambiguous.
- **Default weight 2.5 kg** matches the xlsx (B2/B6) AND is a clinically representative value (~small term infant, ~mid-preterm), so the demo UAC 16.5 / UVC 8.25 cm values read as realistic on first paint.
- **1-decimal hero display (`toFixed(1)`)** — matches xlsx precision and matches how clinicians mark catheters (cm markings at 0.5 or 1.0 cm intervals). 2 decimals would read as false precision.
- **Identity-hue stripe on card (D-05 #3)** — the v1.5 identity system + the v1.8 dock-magnification card styling both already use identity for the hero tint; the `border-t-4 border-[var(--color-identity)]` stripe is a single additional line of markup that rides on the shipped identity token — no new tokens required.

</specifics>

<deferred>
## Deferred Ideas

- **Alternate catheter-depth formulas (Shukla, Dunn, Wright, birth-weight vs current-weight)** — REQUIREMENTS.md Out of Scope for v1.13. If clinicians request a formula switcher, that's a v1.14+ discussion; a `<SegmentedToggle>` infrastructure exists to add it cleanly later.
- **Gestational-age adjustment or umbilical-stump-length offset** — not in scope; clinical precision beyond rule-of-thumb is imaging's job.
- **Tip-position radiologic verification calculator** — different tool class entirely; out of v1.13 scope and arguably out of PWA scope.
- **`WeightSlider` shared component extraction** (D-07 deferred until a 2nd slider consumer exists).
- **Slider tick marks at integer kg values** — nice-to-have UX polish; not required for clinical correctness. Flag for polish pass if UI-SPEC thinks it's worth it.
- **Haptic feedback on slider thumb snap** — iOS PWA API limitation (same deferral as Phase 40's star-toggle haptic).
- **Drag-to-reorder favorites** (FAV-FUT-01) — still deferred from milestone; unchanged.
- **Per-breakpoint cap** (FAV-FUT-02) — still deferred; unchanged.
- **Search box in hamburger** (CAT-FUT-01) — with UAC/UVC we hit 5 calculators; search becomes relevant past ~8 per Phase 40's Deferred Ideas.
- **Minimum-favorite floor** (Phase 41 Deferred) — unchanged; still deferred.
- **Distinct identity hue per card (UAC hue + UVC hue) instead of one shared `.identity-uac`** — considered in D-03/D-05 discussion; rejected because v1.5 identity convention is one hue per calculator. Revisit only if a v2 "catheter suite" expands into multiple distinct tools.

</deferred>

---

*Phase: 42-uac-uvc-calculator*
*Context gathered: 2026-04-23 (auto mode — 16 decisions + 7 explicit out-of-scope items auto-selected from recommended defaults)*
