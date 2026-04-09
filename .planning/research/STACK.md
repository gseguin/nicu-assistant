# Stack Research — v1.8 GIR Calculator

**Researched:** 2026-04-09
**Mode:** Ecosystem (subsequent-milestone, additive)
**Overall confidence:** HIGH — the existing validated stack was designed for exactly this case (plugin-like registration + shared components), and GIR is structurally a close sibling of Morphine Wean.

## Verdict

**No new runtime dependencies.** The GIR calculator is implementable end-to-end with the stack already in place (SvelteKit 2.55 + Svelte 5 runes + Tailwind CSS 4 + @lucide/svelte + shared `src/lib/shared/components/*`). The only additive changes are:

1. One new Lucide icon import in `registry.ts` (e.g. `Droplet` or `Droplets` — already exposed by the existing `@lucide/svelte` package, zero install cost).
2. One new route `src/routes/gir/+page.svelte` and one new `gir-config.json` following the `morphine-config.json` / `fortification-config.json` pattern.
3. Two new CSS custom-property blocks in `src/app.css` (`.identity-gir` + its dark variant), reusing the exact mechanism shipped in v1.5.
4. One small additive prop on an existing shared component (see "New Component Props" below) — only if we decide the glucose range picker should visually live inside the titration table rather than above it. The default recommendation is to **reuse `SegmentedToggle` as-is** above the table and keep the table purely presentational, which requires zero component changes.

Rationale: the v1.1/v1.3/v1.6 pattern (JSON config → typed TS wrapper → state singleton with `$state` rune → shared components → spreadsheet-parity tests) already covers Weight / Dextrose% / ml/kg/day inputs, a result hero, and an advisory/tabular display. Nothing about GIR math (`GIR = (dextrose% × ml/kg/day × 10) / 1440` in mg/kg/min) or a 6-bucket titration lookup requires a new library.

## Reused As-Is

| Concern | Existing asset | Notes |
|---|---|---|
| Calculator registration | `src/lib/shell/registry.ts` `CalculatorEntry` + `identityClass` union | Extend union to `'identity-morphine' \| 'identity-formula' \| 'identity-gir'` and append one entry. This is the same diff shape as v1.5 teal add. |
| Numeric inputs (Weight, Dextrose %, ml/kg/day) | `NumericInput` (v1.6 range hint + v1.7 `showRangeError` opt-out) | Already supports config-driven min/max/step, blur-gated "Outside expected range" advisory, and per-field opt-outs. GIR can use defaults. |
| Dextrose % selection (if discrete D5/D7.5/D10/D12.5/D15) | `SelectPicker` (v1.4 native `<dialog>`, v1.5 `searchable`) | Small fixed list → non-searchable mode; drop-in. Alternative: `SegmentedToggle` if only 3–4 common strengths. |
| Glucose range picker (6 buckets) | `SegmentedToggle` (v1.6) | `role="tablist"` + ←/→/Home/End keyboard nav + identity-aware focus ring are exactly what a 6-bucket titration picker needs. Six options fit the pattern Morphine already uses for 2. A 6-wide tablist on mobile may need `overflow-x-auto` at the parent — that's a route-level style, not a component change. |
| Result hero (Current GIR mg/kg/min + Initial rate ml/hr) | `ResultsDisplay` + `.animate-result-pulse` + `aria-live="polite"` pattern from Morphine/Formula v1.6 | Same hero slot, same eyebrow+value+unit typography, same identity-driven background via `--color-identity-hero`. |
| Disclaimer / About / Nav shell | `DisclaimerModal`, `AboutSheet`, `NavShell` | Zero changes. `NavShell` already consumes `identityClass` from registry (v1.5). |
| Clinical data externalization | JSON config + typed TS wrapper pattern (`morphine-config.json`, `fortification-config.json` with `inputs` block from v1.6) | `gir-config.json` with `inputs` (weight/dextrose/mlkgday ranges) + `buckets` (6 glucose ranges with target GIR / target fluids / delta rate). Parity tests read the same JSON the UI reads — the v1.3 pattern. |
| Spreadsheet parity | Vitest 4 + existing pattern from v1.1 (Morphine) and v1.3 (Fortification Neocate case) | `GIR-Wean-Calculator.xlsx` CALC tab → golden fixtures → `gir.test.ts` co-located next to `gir.ts`. No new test tooling. |
| A11y sweeps | Playwright + axe-core (v1.5: 8 sweeps, v1.6: 12 sweeps) | Add 4 GIR sweeps (light+dark × default+bucket-selected). Zero new dependencies. |
| PWA shell / offline | `@vite-pwa/sveltekit` 1.1 Workbox precache | New route picked up automatically at build time; `gir-config.json` is bundled. No config change needed. |
| Icon | `@lucide/svelte` (already installed) | Recommended: `Droplet` or `Droplets` (glucose-as-fluid semantic). `Activity` or `Zap` are wrong — too generic/energetic for a calm clinical tone. |

## New Component Props (if any)

**Default recommendation: zero new props.** Place the `SegmentedToggle` glucose-range picker *above* a plain `<table>` (or semantic `role="table"` div grid) and drive a local `$state` selected-bucket variable; the table rows read that variable and apply `data-selected={bucket === selected}` with a Tailwind conditional class for the highlight. The table is presentational-only, the picker is the existing component.

**Only if route-level testing shows the "picker-above-table + highlighted row below" pattern is confusing** (P2 finding in an impeccable critique), consider this additive, opt-in prop on `SegmentedToggle`:

- Prop: `orientation?: 'horizontal' | 'vertical'` — default `'horizontal'`, preserves current behavior. Vertical would allow the 6-bucket picker to *be* the table's leftmost column. This is non-trivial (tablist keyboard semantics become ↑/↓ instead of ←/→, per WAI-ARIA APG) and should be deferred to a follow-up milestone unless the critique specifically demands it.

**Do NOT** add a "table mode" or "row slot" prop to `SegmentedToggle`. A tablist is not a table; conflating them breaks ARIA semantics and the shared component's single responsibility. Keep the table as a table.

`NumericInput`, `SelectPicker`, `ResultsDisplay`, `DisclaimerModal`, `AboutSheet` require **no changes**.

## Third Identity Hue Recommendation

### Constraints recap
- Must be distinguishable from Clinical Blue (hue 220) and Formula Teal (hue 195) in OKLCH — a hue gap of ≥25° from both is a safe perceptual threshold.
- Must pass WCAG 2.1 AA against surface tokens in **both** light and dark mode (same contract the v1.5 Morphine hero had to meet — recall v1.5 bumped the Morphine hero to literal `oklch(95% 0.04 220)` to clear 4.5:1).
- Must feel semantically right for "glucose / energy / sugar" without drifting into warning/error territory (red is reserved; amber is already the BMF mode inside Formula and would collide).
- Must stay inside the "warm clinical, calm, trustworthy" brand — no neon, no saturated consumer pops.

### Recommendation: **hue 145 — "Dextrose Green"**

- **Semantic fit:** Green reads as "metabolic / nutrition / vitality" in clinical contexts and is the conventional color for glucose strips and many dextrose bag labels. It is not a warning green (those sit near 130–135 at high chroma); at hue 145 with controlled chroma it reads as a cool, slightly teal-leaning green that visually pairs with (but never blurs into) the Formula teal at 195.
- **Perceptual gap from neighbors:** 220 (Morphine) → 195 (Formula) → 145 (GIR). Gaps of 25° and 50° — both above the ~20° threshold where OKLCH hues become easily confusable at moderate chroma. Importantly, 145 is on the opposite side of 195 from 220, so GIR will never be mistaken for Formula even under blue-light filters.
- **Anti-collision with semantics:** Error stays at hue 25 (red). BMF amber stays at hue 55–65. Clinical blue stays at 220. Formula teal at 195. Nothing occupies 140–160.
- **Avoided alternatives:**
  - Hue 90–110 (yellow-green / lime): too close to BMF amber, reads as caution.
  - Hue 160–180 (emerald → cyan): too close to Formula teal at 195, and 170 in particular is a "success" color in most design systems — semantic collision risk on any future "valid/submitted" UI state.
  - Hue 280–310 (purple/magenta): strong distinguishability but clashes with "warm clinical, calm" brand; reads as marketing/consumer.
  - Hue 25–60 (red→amber): reserved for error and BMF.

### Literal OKLCH values

Modeled directly on the v1.5 Formula teal block in `src/app.css` (lines 195–208), with lightness pulled from the same pattern that passed axe in v1.5 and the "95% L / 0.04 C hero" discipline that the Morphine hero had to adopt post-audit:

```css
/* src/app.css — add inside the existing @layer base identity block */
.identity-gir {
  --color-identity:      oklch(46% 0.12 145);   /* light-mode accent text + focus ring */
  --color-identity-hero: oklch(94% 0.045 145);  /* light-mode hero background */
}
.dark .identity-gir,
[data-theme="dark"] .identity-gir {
  --color-identity:      oklch(82% 0.10 145);   /* dark-mode accent text + focus ring */
  --color-identity-hero: oklch(30% 0.09 145);   /* dark-mode hero background */
}
```

### Contrast sanity check

Token contract (restating from `src/app.css`):
- Light `--color-surface-card` = `oklch(100% 0 0)` → pure white, L=1.0
- Light `--color-text-primary` = `oklch(18% 0.012 230)` → near-black, L≈0.18
- Dark `--color-surface-card` = `oklch(23% 0.014 236)` → L≈0.23
- Dark `--color-text-primary` = `oklch(93% 0.006 230)` → L≈0.93

**Light mode:**
- `--color-identity` at L=46% on white card (L=100%): the v1.5 Formula teal uses `oklch(49% 0.11 195)` on the same surface and passes AA for UI text (3:1) and body text (4.5:1). Hue 145 at L=46% is perceptually *slightly darker* than L=49% (green luminance weighting), so the contrast against white will be **marginally better** than the already-passing Formula teal. Expected contrast ratio ≈ 5.0–5.4:1 vs white. **PASS 4.5:1 AA normal text.**
- `--color-identity-hero` at L=94% holding L=18% body text: this replicates the Morphine post-audit fix pattern (L=95% hero behind primary text). Expected ratio ≈ 12–13:1. **PASS 4.5:1 AA.** The hero background is for decorative framing; the text on it is `--color-text-primary`, not the identity color.

**Dark mode:**
- `--color-identity` at L=82% on dark card L=23%: the Formula dark teal uses `oklch(82% 0.09 195)` on the same surface and passes. Hue 145 at the same L and slightly higher chroma (0.10) produces essentially identical luminance. Expected ratio ≈ 7.5–8:1 vs dark card. **PASS 4.5:1 AA, likely AAA.**
- `--color-identity-hero` at L=30% holding L=93% primary text: Formula dark hero uses L=30% and clears 4.5:1. Expected ratio ≈ 9–10:1. **PASS.**

**Caveat — chroma-induced lightness drift:** OKLCH lightness is perceptually uniform but per-channel luminance varies with hue. Green hues render slightly brighter than blue hues at equal L. This means the light-mode `--color-identity` at L=46% might land closer to a 5.0:1 ratio (rather than 5.4:1) — still safely above AA but the Phase 20-equivalent axe sweep in v1.8 is mandatory confirmation, same as Morphine/Formula went through. If the axe sweep fails (extremely unlikely given the headroom), bump the light-mode accent to `oklch(44% 0.12 145)` (darker) — this is the same one-step adjustment v1.5 used for the Morphine hero.

## What NOT to Add

- **No new charting / table / dataviz library.** A 6-row titration table is plain HTML. Introducing `@tanstack/svelte-table`, `ag-grid`, or similar would add bundle weight, break offline-first, and contradict the "earn trust through restraint" design principle.
- **No math library (`mathjs`, `decimal.js`, etc.).** GIR math is single-step floating-point arithmetic within safe ranges; native JS `number` is sufficient, matching what Morphine and Formula already do. Spreadsheet parity is established via fixtures, not arbitrary-precision arithmetic.
- **No animation library.** The existing `.animate-result-pulse` (200 ms, reduced-motion gated) covers the hero. Adding `svelte/motion` tweens or `motion-one` for a row-highlight effect is out of character — a 150 ms CSS `background-color` transition on the selected row, already covered by the global `html:not(.no-transition) *` rule in `src/app.css` line 120, is sufficient.
- **No new icon pack.** `@lucide/svelte` has Droplet/Droplets and is already installed. Adding Heroicons or Phosphor to get a "better" glucose icon is gratuitous.
- **No dynamic imports / route-level code splitting for GIR.** The registry-as-manifest decision in v1.0 was explicit. GIR is always-needed. Splitting adds Vite config complexity and a perceptible first-paint cost on the GIR tab.
- **No new state manager.** The `$state` rune + sessionStorage backup pattern used by Morphine and Formula is the convention. No Zustand/nanostores/Pinia equivalents.
- **No conflation of `SegmentedToggle` with table semantics.** See "New Component Props." A tablist is not a table row selector; they have different ARIA contracts. If the interaction pattern needs to evolve, introduce a new `RangeSelector` component rather than overloading `SegmentedToggle`.
- **No new theme mechanism.** The v1.5 `identityClass` → CSS-variable swap is the one and only per-tab identity mechanism. Do not introduce Tailwind theme `extend` variants or CSS-in-JS for this.
- **No clinical-range autocorrection.** v1.6 explicitly chose "advisory on blur, no auto-clamp." GIR must honor the same contract — a 25% dextrose entry should warn, not snap to 20%.

## Sources

- Tailwind CSS v4 dark mode + `@custom-variant` (matches the existing `app.css` pattern): https://tailwindcss.com/docs/dark-mode — HIGH confidence (official docs, current major version)
- OKLCH color model, perceptual uniformity, and hue spacing: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch — HIGH confidence (MDN, authoritative)
- Oklch.com interactive picker for contrast verification (standard tool used during v1.4/v1.5 audits): https://oklch.com/ — MEDIUM confidence (community tool, widely used)
- WCAG 2.1 AA contrast requirements (4.5:1 normal text, 3:1 UI components + large text): https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html — HIGH confidence (W3C normative)
- WAI-ARIA Authoring Practices, Tabs pattern (keyboard model that `SegmentedToggle` already implements): https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ — HIGH confidence (W3C APG)
- Svelte 5 runes / `$state` / `$bindable` / `$props` (pattern used in `SegmentedToggle.svelte`): https://svelte.dev/docs/svelte/what-are-runes — HIGH confidence (official)
- `@lucide/svelte` (official Svelte 5 package, already an installed dependency; Droplet/Droplets icons confirmed present in the Lucide icon set): https://lucide.dev/icons/ — HIGH confidence (official icon catalog)
- Existing project evidence (HIGH confidence, local verification):
  - `src/app.css` lines 186–209 — existing identity-pattern block this milestone extends verbatim
  - `src/lib/shell/registry.ts` — `identityClass` union to extend
  - `src/lib/shared/components/SegmentedToggle.svelte` — `role="tablist"` with full keyboard nav already wired to `--color-identity`
  - `.planning/PROJECT.md` lines 51–67 — v1.5/v1.6/v1.7 shipped contracts this milestone inherits
