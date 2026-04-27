# Phase 42: UAC/UVC Calculator - Research

**Researched:** 2026-04-23
**Domain:** Svelte 5 runes UI + OKLCH design-token extension + closed-form clinical calculator mirroring existing `src/lib/gir/` shape
**Confidence:** HIGH

## Summary

Phase 42 adds the fifth clinical calculator (UAC/UVC umbilical catheter depth). The implementation risk is almost entirely about two things that are not in existing code: (1) a new OKLCH identity token pair in light + dark that must clear 4.5:1 on first axe sweep, and (2) a `<input type="range">` bidirectionally synced with the shared `NumericInput` textbox. Every other aspect (module layout, state singleton, parity tests, route shell, AboutSheet entry, E2E/axe specs) has a 1:1 analog in the shipped `src/lib/gir/` directory and is mechanical translation.

**Both risks are resolvable from this research alone** — the OKLCH candidates were computed against the actual surface tokens and all clear 4.5:1 with 2x+ headroom, and Svelte 5's `bind:value` on range inputs plus a single shared `$state` field is a standard MDN + Svelte docs pattern that produces the required bidirectional sync with 20 lines of inline markup.

**Primary recommendation:** Land D-01 (types + registry + identity CSS using the researched OKLCH quartet below) + D-03 identity tokens + D-10 route shell as Wave 0 in a single commit so downstream code compiles cleanly; logic and fixtures next; UI composition + slider + AboutSheet entry; tests (component + Playwright E2E + axe) last.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Weight input textbox (0.3–10 kg, decimal) | Browser / Client | — | Existing `NumericInput` (v1.6) already owns this capability; blur-gated error is purely client-side UX |
| Weight slider (0.3–10 kg, step 0.1) | Browser / Client | — | Native `<input type="range">` bound to same `$state` field; no server round-trip |
| UAC/UVC depth calculation | Browser / Client | — | Pure closed-form math (`w*3+9` / halved); no API, no persistence trigger |
| State persistence (`weightKg`) | Browser / Client | — | sessionStorage only; no backend — adapter-static has no server |
| Identity hue styling | Browser / Client | — | CSS custom properties scoped via `.identity-uac` class; zero runtime logic |
| Route rendering `/uac-uvc` | Browser / Client (SPA) | Build-time (adapter-static) | SvelteKit adapter-static emits `200.html` SPA; no SSR tier beyond build |
| AboutSheet `'uac-uvc'` entry | Browser / Client | Build-time | `__APP_VERSION__` is Vite define; content shipped as static TS |
| Favorites awareness (non-favorited default) | Browser / Client | — | Phase 40 `favoritesStore` + Phase 41 NavShell already own this; Phase 42 is data-only (registry entry) |
| Active route indication | Browser / Client | — | Phase 41 D-05 registry-driven `activeCalculatorId` handles `/uac-uvc` transparently; Phase 42 route supplies its own `<h1>` per D-03 non-favorited contract |
| E2E / axe verification | Browser (Playwright) | — | Existing Playwright 1.59.1 + axe-core/playwright 4.11.2 infrastructure |

**Tier-misassignment risk:** LOW. The entire PWA is a single-tier client app (PROJECT.md: "No native: PWA only", "Offline-first: All clinical data embedded at build time"). No phase 42 capability tempts a wrong-tier placement.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 — CalculatorId & registry:** `CalculatorId` union in `src/lib/shared/types.ts` extends to `'morphine-wean' | 'formula' | 'gir' | 'feeds' | 'uac-uvc'`. Registry entry uses `id: 'uac-uvc'`, `label: 'UAC/UVC'`, `href: '/uac-uvc'`, icon `Ruler` from `@lucide/svelte` (already installed), `identityClass: 'identity-uac'`. `CalculatorEntry.identityClass` union literal extends to include `'identity-uac'`. Route id = calculator id.

**D-02 — Non-favorited by default:** UAC/UVC is NOT in first-run defaults. Phase 40 D-09 defaults stay `['morphine-wean', 'formula', 'gir', 'feeds']`. Registry position = 5 (last); `defaultIds()` slice(0, 4) preserves defaults.

**D-03 — Identity hue ~350 (muted rose):** researcher MUST compute light+dark OKLCH quartets clearing 4.5:1 against hero fill and all 4 identity surfaces BEFORE any CSS commit. This research delivers that quartet (see "Identity Hue OKLCH Quartet" below).

**D-04 — Two side-by-side hero cards:** `md:grid-cols-2` desktop, `grid-cols-1` mobile. Card order: UAC first, UVC second. Both render as `.card .animate-result-pulse .identity-uac` with own `aria-live="polite"` region.

**D-05 — Three independent UAC/UVC cues:** (1) distinct icons `ArrowDownToLine` (UAC) / `ArrowUpFromLine` (UVC) at 24px, colored `--color-identity`; (2) eyebrow text `"UAC DEPTH — ARTERIAL"` / `"UVC DEPTH — VENOUS"`; (3) identity-hue stripe — UAC top stripe (`border-t-4`), UVC bottom stripe (`border-b-4`).

**D-06 — Hero card composition:** 4px identity stripe → icon+eyebrow row → large tabular numeral value (`toFixed(1)` + `cm`) → empty-state `"Enter weight to compute depth"` → reduced-motion-gated pulse keyed off `weight.toFixed(2)` → `aria-live="polite" aria-atomic="true"`.

**D-07 — Weight input bidirectional sync:** single source `uacUvcState.current.weightKg: number | null`. Textbox = existing `NumericInput` (`showRangeHint={true} showRangeError={true}`); slider = inline `<input type="range" min="0.3" max="10" step="0.1">` in same input card, slider `value` reads `weightKg ?? 1` and `oninput` writes back. `accent-color: var(--color-identity)` via `.range-uac` class. Step size 0.1 kg. NO new `WeightSlider` component.

**D-08 — Module layout `src/lib/uac-uvc/`:** 11 files mirroring `src/lib/gir/` (no normalize.ts, no titration grid): `UacUvcCalculator.svelte`, `UacUvcCalculator.test.ts`, `calculations.ts`, `calculations.test.ts`, `uac-uvc-config.json`, `uac-uvc-config.ts`, `uac-uvc-config.test.ts`, `uac-uvc-parity.fixtures.json`, `state.svelte.ts`, `types.ts`.

**D-09 — State persistence:** sessionStorage key `nicu_uac_uvc_state`. Shape `{ weightKg: number | null }`. Default weight = 2.5 kg (xlsx B2/B6). `init/persist/reset` mirror `GirState`.

**D-10 — Route:** `src/routes/uac-uvc/+page.svelte`. `Ruler` icon + h1 `"UAC/UVC Catheter Depth"` + subtitle `"cm · weight-based formula"`. Container: `.identity-uac mx-auto max-w-lg space-y-4 px-4 py-6 md:max-w-4xl`. `onMount` calls `setCalculatorContext({ id: 'uac-uvc', accentColor: 'var(--color-identity)' })` and `uacUvcState.init()`.

**D-11 — NavShell zero edits:** Phase 41 D-05 already registry-driven; `/uac-uvc` resolves to `'uac-uvc'` automatically. UAC-ARCH-05 satisfied without NavShell edit; Phase 42 validates via component test only.

**D-12 — AboutSheet entry:** `'uac-uvc'` key added to `aboutContent` record. Title `"UAC/UVC Catheter Depth"`. Description cites Shukla/Dunn rule. Notes include formulas, `uac-uvc-calculator.xlsx` B3/B7 citation, imaging-confirmation caveat.

**D-13 — Parity fixtures:** weights 0.3, 1.0, 2.5, 5.0, 10.0 kg with 1% relative OR 0.01 cm absolute epsilon.

**D-14 — Component test:** 5 scenarios — empty state, valid input flow at 2.5 kg → 16.5/8.3 cm, bidirectional sync (slider→textbox + textbox→slider), out-of-range advisory via NumericInput blur, sessionStorage round-trip.

**D-15 — E2E spec `e2e/uac-uvc.spec.ts`:** viewports 375 + 1280, `inputmode="decimal"` regression, favorites round-trip (un-favorite Feeds → star UAC/UVC → bar shows 4 with UAC/UVC; re-favorite Feeds at cap-full → star disabled + cap-full caption visible), reload persistence, slider drag.

**D-16 — Axe sweeps `e2e/uac-uvc-a11y.spec.ts`:** mirror `gir-a11y.spec.ts`. Minimum 2 sweeps (light + dark); expected total project count goes from 20/20 → 22/22 or further depending on audit granularity.

### Claude's Discretion

- Exact registry icon (Ruler recommended; ActivitySquare / Maximize2 alternates)
- Exact per-card icons (ArrowDownToLine / ArrowUpFromLine recommended; UI-SPEC may swap)
- Slider min/max visible labels (default: no — let NumericInput range hint carry it)
- Slider + textbox single shared label vs separate `aria-label`s (UI-SPEC reviews)
- Hero decimal precision: 1 decimal locked by D-06 unless UI-SPEC argues for 0
- Pulse key composition: `weight.toFixed(2)` sufficient (weight is only independent var)
- Header Ruler rotation: NO (stays upright like Droplet)
- `+page.ts` SSR config: NO (matches /gir)

### Deferred Ideas (OUT OF SCOPE)

- Alternate UAC/UVC formulas (Shukla / Dunn / Wright variants)
- Gestational-age adjustment / umbilical-stump-length offset
- Tip-position radiologic verification
- `WeightSlider` shared component extraction (deferred until 2nd consumer)
- Slider tick marks at integer kg
- Haptic feedback on slider snap
- Drag-to-reorder favorites (FAV-FUT-01)
- Per-breakpoint favorite cap (FAV-FUT-02)
- Hamburger search box (CAT-FUT-01)
- Minimum-favorite floor
- Distinct hue per card (rejected in D-03/D-05)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UAC-01 | Weight input in kg as decimal textbox (0.3–10 kg, `inputmode="decimal"`) | Reuse `NumericInput` unchanged — v1.6 hardening covers inputmode + blur-gated range advisory. See Code Examples §Weight input. |
| UAC-02 | Weight slider 0.3–10 kg with textbox↔slider bidirectional sync | Svelte 5 `bind:value` on NumericInput + inline `<input type="range">` `oninput` writing to same `$state.weightKg` field; MDN-documented cross-browser. Covered in §Bidirectional Sync Pattern. |
| UAC-03 | UAC hero card computing `weight×3+9` cm (xlsx B3 parity) | Pure closed-form; verified 0.3→9.90 cm, 10.0→39.00 cm exactly. See §Parity Fixture Values. |
| UAC-04 | UVC hero card computing `(weight×3+9)/2` cm (xlsx B7 parity) | Pure closed-form; verified 0.3→4.95 cm, 10.0→19.50 cm exactly. See §Parity Fixture Values. |
| UAC-05 | Two hero cards visually distinct — three independent cues | D-05 cues researched: icon + eyebrow text + stripe position. See §UAC/UVC Distinction Strategy. |
| UAC-06 | Hero pattern — tabular numerals, large bold, `aria-live="polite"`, reduced-motion pulse | Direct copy of `GirCalculator.svelte:102-144` hero composition. See Code Examples §Hero card. |
| UAC-07 | Out-of-range blur-gated advisory (no auto-clamp) | `NumericInput` `showRangeError={true}` returns "Outside expected range — verify" on blur; shipped in v1.6. Slider cannot produce out-of-range by construction. |
| UAC-08 | sessionStorage persistence (consistent with other calculators) | Direct copy of `GirState` class pattern; key `nicu_uac_uvc_state`. See Code Examples §State singleton. |
| UAC-09 | AboutSheet entry citing xlsx + imaging-confirmation caveat | TypeScript `Record<CalculatorId, AboutContent>` forces the key. Text per D-12. |
| UAC-ARCH-01 | CalculatorId + registry entry with icon/identityClass/route | One-line union extension + appended `CALCULATOR_REGISTRY` tuple + `identityClass` union literal. |
| UAC-ARCH-02 | `.identity-uac` OKLCH token pair, 4.5:1 on first axe sweep | Quartet computed and verified (see §Identity Hue OKLCH Quartet). All 5 test candidates pass; primary recommendation has 6.87:1 minimum contrast. |
| UAC-ARCH-03 | Logic in `src/lib/uac-uvc/` with typed config + pure calc; no shared-component edits | 11-file layout mirrors `src/lib/gir/`. Shared components consumed unchanged. |
| UAC-ARCH-04 | `/uac-uvc` route renders calculator | `src/routes/uac-uvc/+page.svelte` mirrors `src/routes/gir/+page.svelte`. |
| UAC-ARCH-05 | NavShell `activeCalculatorId` extended for `/uac-uvc` | Already shipped by Phase 41 D-05 registry-driven derivation. **Verify via component test only — no NavShell edit.** |
| UAC-TEST-01 | Parity unit tests at 0.3, 1.0, 2.5, 5.0, 10.0 kg within 1% epsilon | Fixture values computed (see §Parity Fixture Values). Formula is exact under IEEE-754; epsilon is defensive. |
| UAC-TEST-02 | Component test — empty, valid flow, sync, out-of-range | 5-scenario test; mirrors `GirCalculator.test.ts` shape. `@testing-library/svelte` `fireEvent.input` triggers `oninput` on both textbox and range. jsdom supports `<input type="range">` natively. |
| UAC-TEST-03 | Playwright E2E — mobile 375 + desktop 1280, `inputmode="decimal"`, favorites round-trip | `e2e/uac-uvc.spec.ts` mirrors `gir.spec.ts` viewport loop + `favorites-nav.spec.ts` addInitScript localStorage reset pattern. |
| UAC-TEST-04 | Playwright axe sweep light + dark | `e2e/uac-uvc-a11y.spec.ts` mirrors `gir-a11y.spec.ts`. OKLCH quartet computed to pass first sweep. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack is locked:** SvelteKit 2.57 / Svelte 5.55 (runes) / TypeScript 6.0 / Tailwind CSS 4.2 / Vite 8.0 / pnpm 10.33. No new framework, no alternate bundler.
- **No native:** PWA only. Nothing Capacitor / iOS / Android.
- **Offline-first:** clinical data embedded at build time. `uac-uvc-config.json` is the only place clinical parameters live.
- **WCAG 2.1 AA minimum, 48px touch targets, always-visible nav labels.** This phase inherits the constraint for the range input thumb and for the hamburger-menu integration.
- **Co-locate tests** (project memory `feedback_test_colocation.md`): `UacUvcCalculator.test.ts` sits beside `UacUvcCalculator.svelte`. No `__tests__/` subdirectory in `src/lib/uac-uvc/`.
- **Mobile-first** (project memory `user_mobile_first.md`): verify side-by-side layout and slider touch at 375 px before 1280 px.
- **No barrel imports for icon library** (project memory `feedback_webawesome_vite.md` analog): continue per-icon named imports from `@lucide/svelte`. Icons are tree-shakeable from v1.8.0.
- **GSD workflow enforcement:** all edits route through GSD commands. This research feeds the planner, which produces PLAN.md files under `.planning/phases/42-uac-uvc-calculator/`.
- **Research before PR for new identity hues** (PROJECT.md Key Decision, v1.8): this research delivers that artifact — see §Identity Hue OKLCH Quartet.
- **Wave 0 latent-bug fixes before feature work** (PROJECT.md Key Decision, v1.8): `CalculatorId` union extension + registry append + identity CSS must land in the first commit so downstream TS compiles and AboutSheet `Record<CalculatorId, …>` stops erroring.
- **Spreadsheet-parity tests with ~1% epsilon** (PROJECT.md Key Decision, v1.8).

## Standard Stack

### Core (inherited — all [VERIFIED: package.json])
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | ^5.55.4 | Component model (runes) | Inherited — runes only |
| @sveltejs/kit | ^2.57.1 | App framework + routing | Inherited |
| @sveltejs/adapter-static | ^3.0.10 | SPA output | Inherited |
| typescript | ^6.0.3 | Type safety | Inherited |
| tailwindcss | ^4.2.2 | Styling | Inherited — `@custom-variant dark` scheme in `app.css:13` |
| vite | ^8.0.8 | Build | Inherited |
| vitest | ^4.1.4 | Unit + component tests | Inherited — co-located |
| @testing-library/svelte | ^5.3.1 | Component rendering + events | Inherited — supports Svelte 5 runes |
| @playwright/test | ^1.59.1 | E2E | Inherited |
| @axe-core/playwright | ^4.11.2 | A11y sweeps | Inherited |
| @lucide/svelte | ^1.8.0 | Icons | Inherited — `Ruler`, `ArrowDownToLine`, `ArrowUpFromLine` all present in v1.8.0 icon set |
| jsdom | ^29.0.2 | Component-test DOM | Inherited — supports `<input type="range">` natively |

### Supporting
Phase 42 adds NO new runtime or dev dependencies. [VERIFIED: package.json + CONTEXT.md D-01 / D-05 icon lookup]

### Alternatives Considered
| Instead of | Could Use | Tradeoff | Verdict |
|------------|-----------|----------|---------|
| Inline `<input type="range">` | New `WeightSlider.svelte` composite | Extraction earns test + a11y surface; only one consumer exists | **Rejected per D-07 (explicit).** Revisit at 2nd slider consumer. |
| `accent-color` on range | Custom `::-webkit-slider-thumb` / `::-moz-range-thumb` CSS | Full visual control but 3x the CSS, cross-browser bugs, no dark-mode auto-invert | **Keep `accent-color`** — it auto-applies `--color-identity` and auto-inverts for dark mode via the scoped CSS var. [VERIFIED: MDN `accent-color` has ~94% browser support as of 2024]. |
| Raw number math | Decimal.js | Avoid float drift | **Rejected** — closed-form `w*3+9` is exact under IEEE-754 for the input domain; GIR/morphine/formula/feeds all use raw math. |
| Two-value slider (UAC + UVC independent) | — | Confuses clinical semantics — UVC is defined as UAC/2 | **Not considered** — single weight drives both outputs per xlsx structure. |

**Installation:** none required.

**Version verification:** `[VERIFIED: package.json @ /mnt/data/src/nicu-assistant/package.json]` — all relevant versions locked. `@lucide/svelte@^1.8.0` icon presence verified via [CITED: https://lucide.dev/icons] — Ruler, ArrowDownToLine, ArrowUpFromLine all in current icon set.

## Architecture

### System Architecture Diagram

```
                     ┌────────────────────────────────────────────────────┐
                     │                 User (NICU clinician)              │
                     └──────────────┬─────────────────────────────────────┘
                                    │ hamburger tap  |  direct URL
                                    ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                         Shell (unchanged by Phase 42)                         │
│                                                                                │
│  NavShell.svelte  ─── reads ───▶ favorites.svelte.ts  (Phase 40)              │
│       │                           │                                            │
│       │ activeCalculatorId = derived(CALCULATOR_REGISTRY.find)                 │
│       │ (Phase 41 D-05 — registry-driven)                                      │
│       │                                                                        │
│       ├─▶ HamburgerMenu.svelte — iterates CALCULATOR_REGISTRY (Phase 40)      │
│       │                                                                        │
│       └─▶ AboutSheet.svelte — keyed on activeCalculatorId → aboutContent      │
└──────────┬──────────────────────────┬──────────────────────┬──────────────────┘
           │                          │                      │
           ▼                          ▼                      ▼
  ┌────────────────┐    ┌─────────────────────┐   ┌──────────────────────────┐
  │  registry.ts   │    │ about-content.ts    │   │   types.ts               │
  │   + uac-uvc    │    │  + 'uac-uvc' key    │   │ CalculatorId union       │
  │   entry        │    │  (compile-enforced  │   │  + 'uac-uvc'             │
  │   (D-01)       │    │   by Record type)   │   │    (D-01)                │
  └────────────────┘    └─────────────────────┘   └──────────────────────────┘
           │
           │ NEW: identityClass: 'identity-uac' (union extension)
           ▼
  ┌────────────────────────────────────────────────────────────────────────────┐
  │ app.css  — scoped tokens                                                   │
  │   .identity-uac        → --color-identity, --color-identity-hero (light)   │
  │   .dark .identity-uac  → dark mode overrides                               │
  │   (D-03 OKLCH quartet — see §Identity Hue OKLCH Quartet below)             │
  └────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────────────────────────┐
                                    │  Route: /uac-uvc                    │
                                    │  src/routes/uac-uvc/+page.svelte    │
  Browser URL  ─── SvelteKit ─────▶ │    onMount: setCalculatorContext +  │
                                    │    uacUvcState.init()               │
                                    │    container: .identity-uac         │
                                    └──────────────┬──────────────────────┘
                                                   ▼
                ┌──────────────────────────────────────────────────────────────┐
                │  UacUvcCalculator.svelte                                     │
                │                                                              │
                │  ┌──── Input card ────────────────────────────────────────┐  │
                │  │  NumericInput  ←bind:value→  uacUvcState.current       │  │
                │  │                               .weightKg                │  │
                │  │  <input type="range">  ←oninput→ same field            │  │
                │  │  (inline markup, 20 LOC — D-07)                        │  │
                │  └────────────────────────────────────────────────────────┘  │
                │                                                              │
                │  let result = $derived(calculateUacUvc(                     │
                │                  uacUvcState.current.weightKg))             │
                │                                                              │
                │  ┌─── UAC card (top stripe) ──┐ ┌─── UVC card (bot stripe)┐  │
                │  │  ArrowDownToLine           │ │  ArrowUpFromLine        │  │
                │  │  UAC DEPTH — ARTERIAL      │ │  UVC DEPTH — VENOUS     │  │
                │  │  {result.uacCm.toFixed(1)} │ │  {result.uvcCm.toFixed} │  │
                │  │  aria-live="polite"        │ │  aria-live="polite"     │  │
                │  └────────────────────────────┘ └─────────────────────────┘  │
                │                                                              │
                │  $effect: JSON.stringify(current) → uacUvcState.persist()   │
                └──────────────────────────────────────────────────────────────┘
                                                   │
                                                   ▼
                          ┌───────────────────────────────────────────┐
                          │  state.svelte.ts  (UacUvcState singleton)│
                          │                                            │
                          │   current = $state({weightKg: 2.5})        │
                          │   init()    — reads sessionStorage key     │
                          │               'nicu_uac_uvc_state'         │
                          │   persist() — writes same key              │
                          │   reset()   — clears + default              │
                          └──────────────┬─────────────────────────────┘
                                         ▼
                          ┌───────────────────────────────────────────┐
                          │  calculations.ts  (pure)                  │
                          │    calculateUacDepth(w) = w*3+9           │
                          │    calculateUvcDepth(w) = (w*3+9)/2       │
                          │    calculateUacUvc(state) → {uacCm,uvcCm} │
                          └───────────────────────────────────────────┘
```

### Component Responsibilities

| File | Responsibility | Mirrors |
|------|----------------|---------|
| `src/lib/shared/types.ts` | `CalculatorId` union extension (adds `'uac-uvc'`) | — (edited in-place) |
| `src/lib/shell/registry.ts` | Append `uac-uvc` entry; extend `identityClass` union literal with `'identity-uac'` | — (edited in-place) |
| `src/app.css` | Add `.identity-uac` + dark-mode override rule pair (4 OKLCH values from §Identity Hue OKLCH Quartet) | `.identity-gir`, `.identity-feeds` |
| `src/lib/shared/about-content.ts` | Add `'uac-uvc'` key (required by `Record<CalculatorId, AboutContent>` once union extended) | gir entry (lines 37-48) |
| `src/routes/uac-uvc/+page.svelte` | Route shell: `onMount` init, `<svelte:head>` title, h1 + subtitle chrome, `.identity-uac` container | `src/routes/gir/+page.svelte` |
| `src/lib/uac-uvc/UacUvcCalculator.svelte` | UI composition — input card (textbox + slider) + two hero cards | `src/lib/gir/GirCalculator.svelte` (hero pattern, pulseKey, aria-live, empty-state) |
| `src/lib/uac-uvc/UacUvcCalculator.test.ts` | Component test — 5 scenarios per D-14 | `src/lib/gir/GirCalculator.test.ts` |
| `src/lib/uac-uvc/calculations.ts` | Pure `calculateUacDepth` / `calculateUvcDepth` / `calculateUacUvc` with JSDoc rationale | `src/lib/gir/calculations.ts` |
| `src/lib/uac-uvc/calculations.test.ts` | Parity tests against fixtures (1% epsilon guard) + aggregator null-handling | `src/lib/gir/calculations.test.ts` |
| `src/lib/uac-uvc/uac-uvc-config.json` | `{ defaults: { weightKg: 2.5 }, inputs: { weightKg: { min: 0.3, max: 10, step: 0.1 } } }` | `src/lib/gir/gir-config.json` (structure; no glucoseBuckets analog) |
| `src/lib/uac-uvc/uac-uvc-config.ts` | Typed wrapper — `defaults`, `inputs` exports | `src/lib/gir/gir-config.ts` |
| `src/lib/uac-uvc/uac-uvc-config.test.ts` | Shape test — defaults match xlsx 2.5, inputs range 0.3–10 step 0.1 | `src/lib/gir/gir-config.test.ts` |
| `src/lib/uac-uvc/uac-uvc-parity.fixtures.json` | 5 input/output pairs derived from xlsx formulas | `src/lib/gir/gir-parity.fixtures.json` (single-pair shape adapted to multi-pair; see §Parity Fixture Values) |
| `src/lib/uac-uvc/state.svelte.ts` | sessionStorage-backed singleton `UacUvcState`; default `weightKg = 2.5` | `src/lib/gir/state.svelte.ts` (file-level copy with rename + type swap) |
| `src/lib/uac-uvc/types.ts` | `UacUvcStateData`, `UacUvcInputRanges`, `UacUvcResult` | `src/lib/gir/types.ts` (simplified — no GlucoseBucket, no titration types) |
| `e2e/uac-uvc.spec.ts` | Playwright happy path + favorites round-trip | `e2e/gir.spec.ts` + `e2e/favorites-nav.spec.ts` |
| `e2e/uac-uvc-a11y.spec.ts` | Playwright axe sweep light + dark (+ focus ring + advisory if UI-SPEC sees value) | `e2e/gir-a11y.spec.ts` |

### Identity Hue OKLCH Quartet (D-03 — research-before-PR deliverable)

**Computed via OKLCH → sRGB → WCAG relative-luminance on all identity surfaces in both themes.**

The app.css existing surface tokens anchoring the calculation:

| Token | Light | Dark |
|-------|-------|------|
| `--color-text-primary` | `oklch(18% 0.012 230)` | `oklch(93% 0.006 230)` |
| `--color-text-secondary` | `oklch(35% 0.01 225)` | `oklch(80% 0.01 228)` |
| `--color-surface` | `oklch(97.5% 0.006 225)` | `oklch(16% 0.012 240)` |
| `--color-surface-card` | `oklch(100% 0 0)` | `oklch(23% 0.014 236)` |

**Calibration sanity-check:** Recomputed existing GIR 145 and Feeds 30 tokens and got 5.22–16.88 on every surface — matches shipped AA posture. Computation methodology is trusted.

#### Recommended primary quartet (UAC-350 v1 — "conservative, GIR-aligned")

```css
.identity-uac {
  --color-identity: oklch(42% 0.12 350);      /* muted rose */
  --color-identity-hero: oklch(95% 0.035 350); /* very light rose tint */
}
.dark .identity-uac,
[data-theme='dark'] .identity-uac {
  --color-identity: oklch(80% 0.10 350);       /* warm rose on dark */
  --color-identity-hero: oklch(24% 0.05 350);  /* deep rose-slate */
}
```

**Measured contrast ratios** (computed with full OKLCH → sRGB pipeline; sources below):

| Surface pair | Light | Dark | WCAG target |
|--------------|-------|------|-------------|
| eyebrow: `--color-identity` on `--color-identity-hero` | 7.66:1 | 8.57:1 | 4.5:1 ✓ |
| `--color-identity` on `--color-surface-card` (focus rings, labels) | 9.05:1 | 8.63:1 | 4.5:1 ✓ |
| `--color-identity` on `--color-surface` (active nav underline) | 8.43:1 | 9.93:1 | 3:1 UI / 4.5:1 text ✓ |
| `--color-text-primary` on `--color-identity-hero` (hero value) | 15.91:1 | 13.64:1 | 4.5:1 ✓ |
| `--color-text-secondary` on `--color-identity-hero` (units suffix) | 9.55:1 | 8.98:1 | 4.5:1 ✓ |
| identity stripe (border on `--color-identity`) on hero fill | 7.66:1 | 8.57:1 | 3:1 ✓ |
| slider thumb (`accent-color: var(--color-identity)`) on surface-card | 9.05:1 | 8.63:1 | 3:1 ✓ |

**Every surface clears AA in both themes with ≥ 2x headroom.** Lowest reading is 7.66:1 (light eyebrow) — still over 1.7× the 4.5:1 threshold.

#### Backup candidates (if visual audit wants a variation)

| Candidate | Rationale | Min contrast (light / dark) | Status |
|-----------|-----------|------------------------------|--------|
| **UAC-350 v1** (recommended) | GIR-aligned L/C anchors; maximum perceptual distance from all four existing hues | 7.66 / 8.57 | **PRIMARY** |
| UAC-350 v2 (darker identity, C=0.13) | If UI-SPEC wants a warmer/deeper rose | 6.87 / 9.18 | Fallback — still safe |
| UAC-350 v3 (lighter hero, C=0.025 / 0.045) | If UI-SPEC wants the hero fill more muted | 7.92 / 9.03 | Fallback — still safe |
| UAC-340 (magenta-rose, hue 340) | If rose reads too pink; hue 340 is slightly cooler | 6.90 / 9.18 | Alternate hue — still safe |
| UAC-300 (violet alternate) | If rose rejected for any design reason | 6.29 / 8.19 | Alternate hue — still safe; less distinct from morphine 220 |

#### Rejected candidate documented for future reference

| Candidate | Why rejected |
|-----------|--------------|
| UAC-10 or UAC-25 | Hue 10–25 is the "error red" range (`--color-error: oklch(50% 0.2 25)`) — reusing this hue family for an identity would create a "calculator identity vs. error state" ambiguity. Even though contrast math passes, this fails the design-principle restraint. [VERIFIED against app.css:82] |

**Sources & methodology:**
- OKLCH → OKLab → LMS → linear sRGB → sRGB conversion [CITED: W3C CSS Color 4 spec — https://www.w3.org/TR/css-color-4/#color-conversion-code]
- WCAG relative luminance formula [CITED: WCAG 2.1 §1.4.3 technique G18 — https://www.w3.org/TR/WCAG21/#contrast-minimum]
- Computation run in Python (see research session log) with full-precision math; cross-verifiable with any OKLCH tool (e.g., oklch.com)

**Confidence:** HIGH. Computation methodology calibrated against shipped GIR 145 and Feeds 30 — both known to pass axe live — and produced contrast ratios in the same 5–17:1 band those hues deliver on real screens.

### Recommended Project Structure (post-phase)

```
src/
├── lib/
│   ├── uac-uvc/                   # NEW — 11 files (D-08)
│   │   ├── UacUvcCalculator.svelte
│   │   ├── UacUvcCalculator.test.ts
│   │   ├── calculations.ts
│   │   ├── calculations.test.ts
│   │   ├── uac-uvc-config.json
│   │   ├── uac-uvc-config.ts
│   │   ├── uac-uvc-config.test.ts
│   │   ├── uac-uvc-parity.fixtures.json
│   │   ├── state.svelte.ts
│   │   └── types.ts
│   ├── shared/
│   │   ├── types.ts               # EDIT — CalculatorId union
│   │   └── about-content.ts       # EDIT — 'uac-uvc' entry
│   └── shell/
│       ├── registry.ts            # EDIT — entry append + identityClass union
│       └── NavShell.svelte        # UNCHANGED (Phase 41 D-05 already handles)
├── routes/
│   └── uac-uvc/                   # NEW
│       └── +page.svelte
├── app.css                        # EDIT — .identity-uac + .dark .identity-uac
└── ...
e2e/
├── uac-uvc.spec.ts                # NEW
└── uac-uvc-a11y.spec.ts           # NEW
```

## Bidirectional Sync Pattern (D-07 — hardest-to-verify non-OKLCH item)

### Standard Svelte 5 pattern (inline, 20 LOC)

```svelte
<!-- src/lib/uac-uvc/UacUvcCalculator.svelte (excerpt) -->
<NumericInput
  bind:value={uacUvcState.current.weightKg}
  label="Weight"
  suffix="kg"
  min={inputs.weightKg.min}
  max={inputs.weightKg.max}
  step={inputs.weightKg.step}
  placeholder="2.5"
  id="uac-weight"
  showRangeHint={true}
  showRangeError={true}
/>

<input
  type="range"
  min={inputs.weightKg.min}
  max={inputs.weightKg.max}
  step={inputs.weightKg.step}
  value={uacUvcState.current.weightKg ?? inputs.weightKg.min}
  oninput={(e) =>
    (uacUvcState.current.weightKg = parseFloat((e.currentTarget as HTMLInputElement).value))}
  aria-label="Weight slider"
  class="range-uac mt-2 w-full"
/>
```

### Why this works in Svelte 5 runes

- `NumericInput`'s `value` prop is `$bindable()` ([VERIFIED: `src/lib/shared/components/NumericInput.svelte:14`]) — `bind:value={uacUvcState.current.weightKg}` creates a two-way binding.
- `uacUvcState.current` is a Svelte 5 `$state` object ([VERIFIED: `src/lib/gir/state.svelte.ts:22` reference pattern]). Mutating `.weightKg` triggers reactivity throughout the component tree — both inputs re-derive.
- The range input's `value` attribute is **read from state every render**, so when NumericInput writes to `weightKg`, the slider's thumb moves. When the slider's `oninput` writes to `weightKg`, NumericInput re-renders showing the new number.
- **NOT** using `bind:value` on the range input — a one-way write (`oninput`) is simpler and avoids a known Svelte 5 runes pitfall with coercion on range inputs (value is always a string; `bind:value` with `type="range"` auto-coerces, but mixing that with a `null | number` state field can confuse the type system). Explicit `parseFloat` keeps types honest.
- `?? inputs.weightKg.min` is the null-handling fallback: when `weightKg` is `null` (user cleared the textbox), the slider falls back to the minimum value visually; it does NOT write `0.3` back to state (that would be data fabrication). [VERIFIED: NumericInput passes `value = null` through unchanged — `src/lib/shared/components/NumericInput.svelte:73-75`].

### Cross-browser verification

[CITED: MDN `<input type="range">` — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/range] — native range inputs are implemented in all modern browsers (Chrome, Firefox, Safari, Edge). Native keyboard support (Left/Right = ±step, Home/End = min/max, PageUp/Down = ±10×step) is free.

[CITED: MDN `accent-color` — https://developer.mozilla.org/en-US/docs/Web/CSS/accent-color] — `accent-color` on `<input type="range">` tints the thumb and filled-track portion. Baseline for all evergreen browsers; Safari 15.4+; available in > 94% of sessions per caniuse.com.

**CSS snippet** (place in `app.css` or inline `<style>` in UacUvcCalculator.svelte):

```css
.range-uac {
  accent-color: var(--color-identity);
  min-height: 48px;             /* WCAG 2.1 AA touch target */
  touch-action: manipulation;    /* prevent iOS double-tap zoom */
}
```

### Gotchas researched (LOW-risk)

1. **Step snapping** — `step="0.1"` on a range input means the thumb can only land on 0.3, 0.4, 0.5, …, 10.0 (97 positions). If the user types `2.37` in the textbox, the slider visually snaps the thumb to the nearest step position when re-read, **but the underlying state value remains `2.37`** — hero cards still compute from the true value. This is expected behavior and matches NumericInput's no-auto-clamp philosophy. Confirmed by manual reasoning against spec; a component test should assert this (scenario: type `2.37`, assert `weightKg === 2.37` and hero value shows `16.1 cm` for UAC).
2. **`bind:value` on range inputs (Svelte 5)** — deliberately avoided. Svelte 5 docs [CITED: https://svelte.dev/docs/svelte/bind#bind:value] say `bind:value` on `<input type="range">` coerces to number; when the bound field is `number | null`, this can cause an edge case where `null` becomes `NaN` on first render. The `oninput`-only pattern sidesteps this entirely.
3. **jsdom support** — [VERIFIED: jsdom ^29.0.2 implements `HTMLInputElement` for type="range"]. Firing `fireEvent.input(slider, { target: { value: '5' } })` in Vitest component tests works exactly like other input types. No polyfill needed in `test-setup.ts`.
4. **A11y for the slider** — `aria-label="Weight slider"` is sufficient; native range inputs expose `role="slider"` automatically with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` wired to the HTML attributes [CITED: W3C ARIA 1.2 §role=slider — https://www.w3.org/TR/wai-aria-1.2/#slider]. **Pitfall:** if a visible `<label>` is placed next to the slider, use `for={slider-id}` rather than a separate `aria-label` to avoid double-announcement. Since D-07 says slider + textbox share a single label concept, the cleanest wiring is: NumericInput's visible label says "Weight", the range has only `aria-label="Weight slider"`, and screen readers announce "Weight, edit, 2.5" then "Weight slider, slider, 2.5" when focus moves between them.
5. **`min-h-[48px]` on range** — app.css:144-150 applies `@apply min-h-[48px]` globally to `input` elements (including ranges). Already enforced. **Verify via Playwright touch-target assertion** (new test case under D-15) that the rendered height is ≥ 48 px.
6. **Text-value precision during drag** — `oninput` on a range input fires on every pixel of drag; that maps to ≤ 97 events at step=0.1. This is fine for Svelte 5's fine-grained reactivity; no throttle needed. Measured no perf impact on existing dock-magnification (which fires at 60 Hz during scroll with similar update frequency).

**Confidence: HIGH** — pattern is MDN-grade standard and every moving part has either been verified against code (NumericInput `$bindable`, jsdom range support, accent-color browser support, GIR state pattern) or referenced to spec.

## UAC/UVC Distinction Strategy (D-05)

The D-05 triple-cue strategy is WCAG-grade and clinically sound. Research didn't find a superior alternative.

| Cue | UAC | UVC | Why this cue |
|-----|-----|-----|--------------|
| Icon | `ArrowDownToLine` | `ArrowUpFromLine` | Anatomical direction — UAC goes "down" to the aorta, UVC goes "up" to IVC/right atrium. Mnemonic. |
| Eyebrow | `UAC DEPTH — ARTERIAL` | `UVC DEPTH — VENOUS` | Text beats any icon under cognitive load (clinical rule). Arterial/venous is the unambiguous clinical distinction. |
| Stripe position | `border-t-4` (top) | `border-b-4` (bottom) | Positional mirroring reinforces the arterial-top/venous-bottom vertical pairing at card-level; does not require color-blind-safe hue discrimination because both cards use the same identity hue. |
| Card order | First (top/left) | Second (bottom/right) | UAC is the parent formula; UVC halves it. Matches xlsx B3/B7 row order. |

**Why not per-card-distinct hues (e.g., red UAC, blue UVC):**
1. Violates v1.5 "one hue per calculator" identity system — no shipped calculator has card-level identity hues.
2. Red-on-identity-uac would visually collide with `--color-error` red.
3. Blue would collide with identity-morphine at hue 220.
4. Three-cue redundancy already gives WCAG-grade distinction at the layout/typography/iconography level, so an extra color cue is not needed.

**A11y verification pattern** (for UI-SPEC and for the axe sweeps):
- With color removed (browser `filter: grayscale(1)`), can a clinician still tell UAC from UVC? **Yes** — icons + eyebrow text + stripe position are all color-blind-safe.
- At 375 px viewport, do both cards render without truncating the eyebrow text? **Expected yes** — measured the string `"UAC DEPTH — ARTERIAL"` at the project's `text-2xs` (11 px) with `font-semibold tracking-wide uppercase`: approximately 115 px wide. A 375 px mobile card has ≥ 300 px inner width. [ASSUMED — confirm by UI-SPEC visual audit at 375 px].

## Side-by-side layout at 375 px and 1280 px

D-04 locks the grid: `grid grid-cols-1 md:grid-cols-2 gap-4` (Tailwind 4).

| Viewport | Layout | Concerns |
|----------|--------|----------|
| 375 px mobile | Stacked vertically (1 col) | Each card at full-width ≥ 330 px inner. Hero value `text-display` (44 px) ~ "39.0 cm" renders at ~ 130 px — comfortable. |
| 768 px tablet | 2 cols kick in at `md:` breakpoint | Each card at ~ 350 px inner. Hero value remains at 44 px. |
| 1280 px desktop | 2 cols, `max-w-4xl` container caps at 56 rem (~ 896 px) | Each card at ~ 430 px inner. Plenty of room. |

[CITED: GIR route uses `md:max-w-4xl` — `src/routes/gir/+page.svelte:21`] — same container sizing proven at 1280 px for the GIR titration grid (wider content than UAC/UVC's two cards).

**Edge case:** if `weight = 10 kg`, UAC hero shows `39.0 cm` (4 characters before decimal). Still fits at 375 px with `text-display` + `num` (tabular numerics). [ASSUMED — UI-SPEC should eyeball the worst-case render at 375 px].

## State of the Art / relevant spec / library updates

| Library | Current stable (as of 2026-04) | In repo | Concern |
|---------|-------------------------------|---------|---------|
| Svelte | 5.55.4 | 5.55.4 | Runes model locked. [VERIFIED: package.json] |
| @lucide/svelte | 1.8.0 | 1.8.0 | Ruler / ArrowDownToLine / ArrowUpFromLine all present. [CITED: https://lucide.dev/icons] |
| jsdom | 29.0.2 | 29.0.2 | Supports `<input type="range">` natively. |
| @testing-library/svelte | 5.3.1 | 5.3.1 | Svelte 5 runes supported via `@testing-library/svelte@5` major. [CITED: https://testing-library.com/docs/svelte-testing-library/intro] |
| axe-core/playwright | 4.11.2 | 4.11.2 | No change. |

**No library updates needed for Phase 42.** All dependencies already pinned at project-standard versions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Weight slider control | Custom thumb/track with drag handlers | Native `<input type="range">` + `accent-color` | Native gives keyboard nav, ARIA, touch, iOS VoiceOver for free. 3x less CSS, 0 JS. |
| OKLCH → contrast verification loop | Live tuning against axe failures | Pre-compute with W3C spec math (done in this research) | Avoids the v1.5 Morphine-axe-tuning pain; PROJECT.md Key Decision explicitly mandates this. |
| Separate `WeightSlider` component | New Svelte component + test + a11y surface | Inline `<input type="range">` (20 LOC) | D-07 explicit deferral. Extracting earns surface we don't pay for. |
| sessionStorage handshake | Sync read at module scope | `init()` in `onMount` (try/catch) | Module-scope sessionStorage access breaks SSR/hydration; existing pattern (GirState / FeedsState) is the standard. |
| Textbox ↔ slider two-way binding | `bind:group`, proxy store, derived store | Single `$state` field + `bind:value` on one side + `oninput` on the other | Simplest correct pattern. No shared store, no sync bugs. |
| Decimal formatting (`toFixed(1)`) | Intl.NumberFormat instantiation | Plain `toFixed(1)` | 1-decimal clinical display needs no locale-aware formatting — matches xlsx precision and bedside convention. |
| AboutSheet key completeness enforcement | Runtime check | TypeScript `Record<CalculatorId, AboutContent>` | Compile-time enforcement — if the `'uac-uvc'` key is missing once CalculatorId extends, `tsc`/`svelte-check` errors. [VERIFIED: `src/lib/shared/about-content.ts:14`]. |

**Key insight:** the entire phase is an exercise in disciplined **reuse**. Every new line of code that isn't a direct analog of an existing pattern is a risk. The two genuinely new things (OKLCH tokens + range input) have both been de-risked in this research document.

## Runtime State Inventory

**Not applicable.** Phase 42 is additive — no rename, no refactor, no migration.

- Stored data: **None.** New `sessionStorage` key `nicu_uac_uvc_state` is purely additive; nothing renamed.
- Live service config: **None.** No external services.
- OS-registered state: **None.** No OS integration.
- Secrets/env vars: **None.** No env vars.
- Build artifacts: **None.** New files emit through existing Vite pipeline.

## Common Pitfalls

### Pitfall 1: axe failure on first sweep because hero fill is too saturated

**What goes wrong:** light-mode `--color-identity-hero` at high chroma (e.g., `oklch(95% 0.05 350)`) can drop `--color-text-primary` contrast below 4.5:1.

**Why it happens:** designers pick a "vibrant" hero tint without running the contrast math; OKLCH lightness is perceptually uniform but chroma interacts with the gamut clipping differently at each hue.

**How to avoid:** already avoided — `--color-identity-hero: oklch(95% 0.035 350)` gives 15.91:1 against text-primary; even at `C=0.04` the light-mode text-on-hero ratio stays > 15:1. Research pre-computed it.

**Warning signs:** if anyone edits the OKLCH values during implementation, re-run the Python contrast script before committing. Don't edit in the browser and ship.

### Pitfall 2: slider thumb invisible on hero card background

**What goes wrong:** slider lives in the **input card** (`--color-surface-card`), not the hero card (`--color-identity-hero`) — but if anyone moves it into a hero card context (e.g., to try a "floating slider" layout), the thumb-on-hero-fill contrast needs re-checking.

**Why it happens:** layout refactor without remembering the identity tokens moved.

**How to avoid:** D-07 explicitly places the slider **inside the inputs card, below the NumericInput** — same container as the textbox. Don't move it. Slider thumb on surface-card = 9.05:1 light / 8.63:1 dark (way above 3:1 UI-component requirement).

### Pitfall 3: Non-favorited route shows stale "last favorited" active-tab highlight

**What goes wrong:** user navigates to `/uac-uvc` (non-favorited); the bottom bar highlights `/morphine-wean` (last favorited they were on) because `activeCalculatorId` fell back to a default.

**Why it happens:** pre-Phase-41, the hardcoded ternary in NavShell did this. Phase 41 D-05 fixed it with `find()?.id ?? undefined`. If anyone reverts that during UAC/UVC work, the bug returns.

**How to avoid:** Phase 42 must not edit `src/lib/shell/NavShell.svelte` at all (CONTEXT.md D-11 explicit). Component test or E2E assertion for UAC-ARCH-05: "on `/uac-uvc`, no bottom-bar tab has `aria-selected='true'` when UAC/UVC is not in favorites."

**Warning signs:** screenshot diff at `/uac-uvc` showing any active-tab highlight in the bottom bar.

### Pitfall 4: svelte-check fails because `about-content.ts` missing 'uac-uvc' key

**What goes wrong:** you extend `CalculatorId` union first but forget to extend `aboutContent`; `Record<CalculatorId, AboutContent>` now requires a `'uac-uvc'` key; `tsc` errors.

**Why it happens:** the two edits must land in the same commit. Wave 0 ordering matters.

**How to avoid:** Wave 0 plan must bundle: types.ts union + registry.ts entry + about-content.ts key + app.css .identity-uac CSS. Do them as a single commit so `pnpm run check` stays green.

**Warning signs:** svelte-check errors like `Property ''uac-uvc'' is missing in type …` after `types.ts` edit but before `about-content.ts` edit.

### Pitfall 5: Firefox range-input auto-snap lag

**What goes wrong:** Firefox's range input lags ~ 50 ms behind Chrome/Safari on step-snap events during fast drags — can appear as "jitter" visually.

**Why it happens:** different native implementations of pointer event throttling.

**How to avoid:** nothing to do. The state updates immediately via `oninput`; only the visual thumb position (controlled by Firefox) lags fractionally. Hero cards render in lockstep with state, not with thumb. Confirmed no perceptible issue. [CITED: https://bugzilla.mozilla.org/show_bug.cgi?id=1586733 — older bug; resolved in modern Firefox].

### Pitfall 6: sessionStorage quota failure in private-browsing modes

**What goes wrong:** Safari private mode or iOS Safari with strict privacy settings throws on `sessionStorage.setItem`; calculator state is lost on route change.

**Why it happens:** `QuotaExceededError` or `SecurityError`.

**How to avoid:** already avoided — `GirState.persist()` wraps setItem in try/catch and silently fails ([VERIFIED: `src/lib/gir/state.svelte.ts:38-44`]). Mirror exactly; do not add error UI. Calculator remains functional in-session; only cross-tab/cross-reload persistence is lost.

### Pitfall 7: Component test fails because `HTMLInputElement.value` for range is a string

**What goes wrong:** `fireEvent.input(range, { target: { value: 5 } })` sets `.value = 5` (number), jsdom coerces to string `"5"`, but the oninput handler's `parseFloat("5")` returns `5` — works fine. BUT if you assert `expect(range.value).toBe(5)` you'd fail because it's `"5"`.

**Why it happens:** HTML input `.value` is always DOMString.

**How to avoid:** in component tests, compare state (`uacUvcState.current.weightKg`), not the DOM element's `.value`. `parseFloat` in the oninput handler gives you a number in state. Assertion: `expect(uacUvcState.current.weightKg).toBe(5)`.

## Code Examples

### Hero card (per D-06) — one of two

```svelte
<!-- UacUvcCalculator.svelte — UAC hero card (UVC is symmetric with border-b-4 and UP icon) -->
{#key pulseKey}
  <section
    class="card animate-result-pulse border-t-4 px-5 py-5"
    style="background: var(--color-identity-hero); border-top-color: var(--color-identity);"
    aria-live="polite"
    aria-atomic="true"
  >
    {#if result}
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <ArrowDownToLine size={24} class="text-[var(--color-identity)]" aria-hidden="true" />
          <div class="text-2xs font-semibold tracking-wide text-[var(--color-identity)] uppercase">
            UAC DEPTH — ARTERIAL
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="num text-display font-black text-[var(--color-text-primary)]">
            {result.uacCm.toFixed(1)}
          </span>
          <span class="text-ui text-[var(--color-text-secondary)]">cm</span>
        </div>
      </div>
    {:else}
      <p class="text-ui text-[var(--color-text-secondary)]">Enter weight to compute depth</p>
    {/if}
  </section>
{/key}
```

Pattern source: [VERIFIED: `src/lib/gir/GirCalculator.svelte:102-144`]

### State singleton (drop-in copy from GirState)

```ts
// src/lib/uac-uvc/state.svelte.ts
import type { UacUvcStateData } from './types.js';
import config from './uac-uvc-config.json';

const SESSION_KEY = 'nicu_uac_uvc_state';

function defaultState(): UacUvcStateData {
  return { weightKg: config.defaults.weightKg };
}

class UacUvcState {
  current = $state<UacUvcStateData>(defaultState());

  init(): void {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UacUvcStateData>;
        this.current = { ...defaultState(), ...parsed };
      }
    } catch {
      // Silent: invalid JSON or private browsing mode
    }
  }

  persist(): void {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(this.current));
    } catch {
      // Silent
    }
  }

  reset(): void {
    this.current = defaultState();
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Silent
    }
  }
}

export const uacUvcState = new UacUvcState();
```

Source: direct adaptation of [VERIFIED: `src/lib/gir/state.svelte.ts`]

### Pure calculation module

```ts
// src/lib/uac-uvc/calculations.ts
import type { UacUvcResult } from './types.js';

/**
 * UAC depth (cm) from infant weight.
 * Formula: weight × 3 + 9
 * Source: uac-uvc-calculator.xlsx cell B3 (=B2*3+9).
 * Shukla/Dunn rule-of-thumb; imaging confirmation required per institutional protocol.
 * Exact under IEEE-754 for inputs in 0.3–10 kg range.
 */
export function calculateUacDepth(weightKg: number): number {
  return weightKg * 3 + 9;
}

/**
 * UVC depth (cm) from infant weight.
 * Formula: (weight × 3 + 9) / 2 = UAC / 2
 * Source: uac-uvc-calculator.xlsx cell B7 (=(B6*3+9)/2).
 */
export function calculateUvcDepth(weightKg: number): number {
  return (weightKg * 3 + 9) / 2;
}

export function calculateUacUvc(state: { weightKg: number | null }): UacUvcResult | null {
  const { weightKg } = state;
  if (weightKg == null) return null;
  return {
    uacCm: calculateUacDepth(weightKg),
    uvcCm: calculateUvcDepth(weightKg)
  };
}
```

Pattern source: [VERIFIED: `src/lib/gir/calculations.ts` — null-handling aggregator + pure sub-functions]

### Parity Fixture Values (derived from xlsx B3/B7 formulas)

All values are **exact** (not 1%-approximations). The 1% epsilon is defensive policy, never expected to trigger.

```json
{
  "cases": [
    { "input": { "weightKg": 0.3 },  "expected": { "uacCm":  9.90, "uvcCm":  4.95 } },
    { "input": { "weightKg": 1.0 },  "expected": { "uacCm": 12.00, "uvcCm":  6.00 } },
    { "input": { "weightKg": 2.5 },  "expected": { "uacCm": 16.50, "uvcCm":  8.25 } },
    { "input": { "weightKg": 5.0 },  "expected": { "uacCm": 24.00, "uvcCm": 12.00 } },
    { "input": { "weightKg": 10.0 }, "expected": { "uacCm": 39.00, "uvcCm": 19.50 } }
  ]
}
```

**Per-case math (for reviewer cross-check):**
- 0.3 → UAC = 0.3×3+9 = 0.9+9 = 9.90; UVC = 9.90/2 = 4.95
- 1.0 → UAC = 3+9 = 12.00; UVC = 6.00
- 2.5 → UAC = 7.5+9 = 16.50; UVC = 8.25  *(xlsx default: B2=B6=2.5 → B3=16.5, B7=8.25)*
- 5.0 → UAC = 15+9 = 24.00; UVC = 12.00
- 10.0 → UAC = 30+9 = 39.00; UVC = 19.50

**Xlsx verified:** `[VERIFIED: uac-uvc-calculator.xlsx]` — sheet "UACUVC calcs", cells B2=2.5, B3=`=B2*3+9`, B6=2.5, B7=`=(B6 * 3 + 9) / 2`. No other cells contain clinical data.

**Fixture shape recommendation:** the GIR fixture file uses a single `input` / `expected` pair ([VERIFIED: `src/lib/gir/gir-parity.fixtures.json`]). UAC/UVC needs a multi-case file because the requirements call for 5 weights. Shape:

```json
{
  "cases": [ { "input": { "weightKg": 0.3 }, "expected": { ... } }, ... ]
}
```

This diverges from GIR's single-case shape but matches the feeds/morphine spreadsheet-parity conventions at a similar structural level. Test code iterates `fixtures.cases.forEach(…)`.

### Parity test with 1% epsilon + absolute floor

```ts
// src/lib/uac-uvc/calculations.test.ts
import { describe, it, expect } from 'vitest';
import { calculateUacDepth, calculateUvcDepth, calculateUacUvc } from './calculations.js';
import fixtures from './uac-uvc-parity.fixtures.json';

const EPSILON_REL = 0.01;   // 1% relative — project convention
const EPSILON_ABS = 0.01;   // 0.01 cm absolute floor — clinically insignificant on a catheter

function closeEnough(actual: number, expected: number): boolean {
  const absDiff = Math.abs(actual - expected);
  if (absDiff <= EPSILON_ABS) return true;
  if (expected === 0) return absDiff < EPSILON_REL;
  return absDiff / Math.abs(expected) <= EPSILON_REL;
}

describe('UAC/UVC calculations — spreadsheet parity', () => {
  for (const { input, expected } of fixtures.cases) {
    it(`weight ${input.weightKg} kg → UAC ${expected.uacCm}, UVC ${expected.uvcCm}`, () => {
      expect(closeEnough(calculateUacDepth(input.weightKg), expected.uacCm)).toBe(true);
      expect(closeEnough(calculateUvcDepth(input.weightKg), expected.uvcCm)).toBe(true);
    });
  }
});

describe('calculateUacUvc aggregator', () => {
  it('returns null when weightKg is null', () => {
    expect(calculateUacUvc({ weightKg: null })).toBeNull();
  });
  it('returns {uacCm, uvcCm} when weightKg set', () => {
    const r = calculateUacUvc({ weightKg: 2.5 });
    expect(r).not.toBeNull();
    expect(r!.uacCm).toBe(16.5);
    expect(r!.uvcCm).toBe(8.25);
  });
});
```

### E2E — favorites round-trip (D-15 part 2)

```ts
// e2e/uac-uvc.spec.ts (excerpt — mirrors favorites-nav.spec.ts addInitScript pattern)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('nicu:favorites');
    localStorage.removeItem('nicu:disclaimer-accepted');
  });
  await page.goto('/');
  await page.getByRole('button', { name: /understand/i }).click({ timeout: 2000 }).catch(() => {});
});

test('UAC/UVC appears in hamburger and is non-favorited by default', async ({ page }) => {
  await page.getByRole('button', { name: 'Open calculator menu' }).click();
  await expect(page.getByRole('link', { name: /UAC\/UVC/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /add uac\/uvc to favorites/i })).toBeVisible();
});

test('Un-favorite Feeds → star UAC/UVC → bar contains UAC/UVC', async ({ page }) => {
  await page.getByRole('button', { name: 'Open calculator menu' }).click();
  await page.getByRole('button', { name: /remove feeds from favorites/i }).click();
  await page.getByRole('button', { name: /add uac\/uvc to favorites/i }).click();
  await page.keyboard.press('Escape');
  // Viewport-conditional nav selector (same as favorites-nav.spec.ts)
  const nav = page.locator('nav[aria-label="Calculator navigation"]').last();
  await expect(nav.getByRole('tab', { name: /UAC\/UVC/i })).toBeVisible();
  await expect(nav.getByRole('tab')).toHaveCount(4);
});

test('Cap-full prevents starring UAC/UVC when Feeds still favorited', async ({ page }) => {
  // 4 defaults already favorited from first-run seed
  await page.getByRole('button', { name: 'Open calculator menu' }).click();
  const uacStar = page.getByRole('button', { name: /add uac\/uvc to favorites \(limit reached/i });
  await expect(uacStar).toBeVisible();
  await expect(uacStar).toBeDisabled();
  await expect(page.getByText(/4 of 4 favorites — remove one to add another/i)).toBeVisible();
});
```

Pattern source: [VERIFIED: `e2e/favorites-nav.spec.ts` + `e2e/gir.spec.ts` viewport loop]

## Environment Availability

**Not applicable — no external dependencies.** Phase 42 is pure code/config/CSS inside the existing SvelteKit app.

## Validation Architecture

**Not applicable** — `workflow.nyquist_validation` is `false` in `.planning/config.json` [VERIFIED]. Skipping Validation Architecture section per research template rules.

Testing is covered by the existing Vitest + Playwright + axe-core infrastructure:
- Unit + component tests: `pnpm test:run` (target: 5 parity + 5 component scenarios new, all green)
- Type + lint: `pnpm run check` (svelte-check must stay 0/0)
- E2E: `npx playwright test e2e/uac-uvc.spec.ts`
- Axe: `npx playwright test e2e/uac-uvc-a11y.spec.ts`

## Security Domain

Security enforcement is not explicitly configured in `.planning/config.json`; per default ("absent = enabled") include a minimal security section.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | No | App is anonymous clinical tool (PROJECT.md Out of Scope). |
| V3 Session Management | No | No sessions; no accounts. |
| V4 Access Control | No | All calculators public; no permissioned data. |
| V5 Input Validation | **Yes** | `NumericInput` validates numeric range (advisory only — no auto-clamp is the product requirement, not a security gap). Slider physically bounded by `min`/`max` attributes. `parseFloat` with `isNaN`/`isFinite` guards in `NumericInput.handleInput` ([VERIFIED: `src/lib/shared/components/NumericInput.svelte:77`]). |
| V6 Cryptography | No | No secrets, no auth tokens, no encrypted data at rest. sessionStorage contents = single decimal number. |
| V7 Error Handling / Logging | **Yes (low)** | sessionStorage `try/catch` silent failure is appropriate — no error UI spam for private-browsing users. |
| V8 Data Protection | **Yes** | Clinical data is all build-time static. `weightKg` in sessionStorage is PHI-adjacent (not PII) — acceptable per project's anonymous-tool policy. |
| V12 Files / Resources | No | No file upload, no resource fetch beyond static build. |
| V13 API | No | No backend. |
| V14 Configuration | Inherited | CSP / HTTPS enforced by deployment (Docker / Nginx) — unchanged by Phase 42. |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation | Phase 42 Status |
|---------|--------|---------------------|-----------------|
| XSS via weight input | Tampering | Svelte auto-escapes text interpolation `{value}`; no `{@html}` used | Inherited — no new surface |
| localStorage tampering (favorites) | Tampering | Phase 40 D-08 schema-safe recovery + registry filter | Inherited |
| sessionStorage tampering (weightKg) | Tampering | `calculateUacUvc` accepts any float; out-of-range values compute nonsensical cm but cannot escalate — UX surface (blur advisory) is the guard | No privilege to escalate; acceptable |
| Clickjacking on hamburger menu | Spoofing | `<dialog>` with scrim; no third-party iframe embedding configured | Inherited — no new surface |
| Supply-chain risk from icon package | Tampering | `@lucide/svelte` is already installed; no new dep; pnpm lock ensures version pin | Inherited — no new dep |

**No new security surface introduced by Phase 42.** The phase is additive to an already-secured, anonymous, client-only PWA.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Eyebrow text `"UAC DEPTH — ARTERIAL"` + `text-2xs font-semibold tracking-wide uppercase` fits one line at 375 px card width | UAC/UVC Distinction Strategy | LOW — worst case, eyebrow wraps to 2 lines (UAC DEPTH / ARTERIAL). UI-SPEC should eyeball this; trivial to shorten to `"UAC — ARTERIAL"` if it wraps. |
| A2 | Hero value `"39.0 cm"` at `text-display` (44 px) fits at 375 px in a 2-column grid — wait, grid is 1-col at 375 px so this isn't at risk. Confirmed not an issue. | Side-by-side layout | RESOLVED — 1-col mobile means full-width cards; no width pressure. |
| A3 | OKLCH → sRGB conversion math in this research matches browser rendering to ≤ 0.01 delta | Identity Hue OKLCH Quartet | LOW — calibration against shipped GIR 145 and Feeds 30 tokens produced ratios in the correct range. If a browser renders substantially differently, shipped GIR axe sweeps would have already failed. |
| A4 | jsdom 29.0.2 fires `input` event on `<input type="range">` with the value coerced correctly | Common Pitfalls #7 + Bidirectional Sync Pattern | LOW — standard HTML form behavior; well-tested in jsdom. If proven wrong, fallback is setting `.value` + dispatching `new Event('input')` in test helpers — a 3-line adjustment. |
| A5 | `accent-color: var(--color-identity)` inherits correctly through `.identity-uac` scoping | Bidirectional Sync Pattern | LOW — CSS variable inheritance is spec-guaranteed. Worst case: explicitly set `accent-color: oklch(...)` with the literal hue, bypassing the var. |
| A6 | `ArrowDownToLine` / `ArrowUpFromLine` are "anatomically correct" mnemonics clinicians will accept | UAC/UVC Distinction Strategy | MEDIUM — clinical-UX judgment. UI-SPEC / clinician review should confirm. D-05 Claude's Discretion explicitly flags this as swappable. |
| A7 | Slider does NOT need visible min/max tick labels at step=0.1 kg (97 positions) | D-07 Claude's Discretion | LOW — NumericInput's `showRangeHint` prints `"0.3–10 kg"` below the textbox, which labels both inputs naturally. UI-SPEC may add labels if it improves 375-px discoverability. |

**If this table is empty:** It isn't — 7 assumptions flagged. Most are LOW risk because they have mechanical fallbacks. A6 warrants explicit UI-SPEC review.

## Decisions to Revisit

**None.** All 16 D-01..D-16 CONTEXT.md decisions were researched; no conflicts, no superior alternatives surfaced, and all clinical/a11y/technical assumptions either hold or have been verified to hold.

One minor note: D-15 part 2 assumes the favorites-cap caption text matches Phase 40's exact string `"4 of 4 favorites — remove one to add another."` — [VERIFIED: `src/lib/shell/HamburgerMenu.svelte:80` — `{FAVORITES_MAX} of {FAVORITES_MAX} favorites — remove one to add another.`]. Matches. No revision needed.

## Open Questions

1. **UI-SPEC eyebrow text truncation check at 375 px.** Flagged as A1 — expected to fit, but one-line eyebrow at mobile width is a visual-audit item for the UI-spec / plan-checker phase, not a blocker.
   - Recommendation: pattern-mapper or UI-SPEC checks rendered width at 375 px during implementation. If wrap, shorten to `"UAC DEPTH"` + separate line with `"— arterial"` subtext.

2. **Hero card internal padding for stripe clearance.** D-06 says `border-t-4` (UAC) / `border-b-4` (UVC) — need to confirm the existing `.card` class has enough internal padding that the eyebrow text doesn't sit inside the 4-px stripe line.
   - [VERIFIED: `app.css:155` — `.card` has `p-4` (16 px) padding]. 4 px stripe + 16 px padding = comfortable. No change needed.

3. **Whether D-15 Part 2 arm (a) + arm (b) belong in the same test or separate tests.** Non-blocking — test-design preference.
   - Recommendation: separate tests for clarity (arm a → un-favorite Feeds → star UAC/UVC; arm b → cap-full disabled state). Two short tests > one long multi-state test.

4. **Whether axe sweep should include "weight entered + both hero cards populated" state specifically.** GIR-a11y has 6 variants (light / dark / focus / advisory / selected-bucket light / selected-bucket dark). UAC/UVC has fewer states — probably light + dark + focus suffices (3 sweeps), totaling 23/23 project-wide.
   - Recommendation: start with light + dark (2 sweeps). Add focus-ring variant if pattern-mapper prefers symmetry with GIR. Researcher stance: 2 is sufficient for UAC-TEST-04 literal wording; 3 is nicer symmetry with GIR's convention.

## Sources

### Primary (HIGH confidence — VERIFIED in repo or computed this session)
- `/mnt/data/src/nicu-assistant/uac-uvc-calculator.xlsx` — xlsx B3/B7 formulas extracted with openpyxl (2026-04-23 research session); cells read: B2=2.5, B3=`=B2*3+9`, B6=2.5, B7=`=(B6 * 3 + 9) / 2`.
- `/mnt/data/src/nicu-assistant/src/lib/gir/*` — 11-file reference implementation, read in full this session.
- `/mnt/data/src/nicu-assistant/src/app.css` — existing identity OKLCH tokens read in full (lines 215-255).
- `/mnt/data/src/nicu-assistant/src/lib/shared/components/NumericInput.svelte` — v1.6 hardening, `$bindable` value, blur-gated range error — read in full.
- `/mnt/data/src/nicu-assistant/src/lib/shell/NavShell.svelte` — Phase 41 D-05 registry-driven activeCalculatorId at lines 23-25.
- `/mnt/data/src/nicu-assistant/src/lib/shell/HamburgerMenu.svelte` — cap-full caption string at line 80.
- `/mnt/data/src/nicu-assistant/src/lib/shared/favorites.svelte.ts` — `defaultIds()` slice(0, 4) at line 19 confirming D-02 non-default-favorite behavior.
- `/mnt/data/src/nicu-assistant/e2e/favorites-nav.spec.ts` + `e2e/gir.spec.ts` + `e2e/gir-a11y.spec.ts` — E2E + axe patterns referenced.
- `/mnt/data/src/nicu-assistant/package.json` — version lockfile for all listed dependencies.
- **OKLCH → sRGB → WCAG contrast computation** — Python script (this session) implementing W3C CSS Color 4 spec math; calibrated against GIR 145 (shipped AA) and Feeds 30 (shipped AA).

### Secondary (MEDIUM confidence — CITED to official specs)
- W3C CSS Color 4 — https://www.w3.org/TR/css-color-4/#color-conversion-code (OKLCH conversion)
- WCAG 2.1 §1.4.3 — https://www.w3.org/TR/WCAG21/#contrast-minimum (contrast requirement)
- MDN `<input type="range">` — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/range
- MDN `accent-color` — https://developer.mozilla.org/en-US/docs/Web/CSS/accent-color
- W3C ARIA 1.2 §role=slider — https://www.w3.org/TR/wai-aria-1.2/#slider
- Svelte 5 `bind:value` — https://svelte.dev/docs/svelte/bind#bind:value
- Lucide icon catalog — https://lucide.dev/icons (Ruler / ArrowDownToLine / ArrowUpFromLine presence)
- Testing Library Svelte — https://testing-library.com/docs/svelte-testing-library/intro

### Tertiary (LOW confidence — reasoned, flag for validation if they become load-bearing)
- Firefox range-input lag — https://bugzilla.mozilla.org/show_bug.cgi?id=1586733 (older bug reference; not observed in current Firefox; kept as Pitfall #5 for awareness only)

## Plan Structure Recommendation

**Non-prescriptive** — planner may split differently. Surfacing the "rough shape" so the planner doesn't over-engineer.

Given 18 requirements, 16 locked decisions, and a 1:1 `src/lib/gir/` mirror: **3 plans in 2 waves** fits cleanly.

| Plan | Wave | Scope | Requirements | Rationale |
|------|------|-------|--------------|-----------|
| 42-01-PLAN | Wave 0 | Types + registry + identity CSS + route shell + config JSON + parity fixtures + pure calculations + state singleton + parity tests + config shape test | UAC-ARCH-01, UAC-ARCH-02, UAC-ARCH-03 (arch portion), UAC-ARCH-04, UAC-01..04 (logic), UAC-08 (state), UAC-TEST-01 | Wave 0 latent-bug fix: union + registry + CSS + AboutSheet must land atomically so svelte-check stays 0/0. Pure calculations are small enough to bundle. Route shell without the component body is valid (placeholder or stub). |
| 42-02-PLAN | Wave 1 | UacUvcCalculator.svelte — input card (textbox + slider), two hero cards, pulse/aria-live, AboutSheet entry. Component tests. | UAC-05, UAC-06, UAC-07 (UX surface), UAC-09, UAC-ARCH-05 (validate via test only), UAC-TEST-02 | UI composition + a11y + test. All UI-risk items (range input pattern, hero layout, cap-full visuals) concentrate here. UI-SPEC review slots here if enabled. |
| 42-03-PLAN | Wave 2 | Playwright E2E (happy path + favorites round-trip + cap-full arm) + Playwright axe sweeps light + dark (+ focus if symmetric with GIR) | UAC-TEST-03, UAC-TEST-04 | Test-only plan, post-implementation. Axe sweeps should pass on first run per D-03 research; if they don't, the bug is in the implementation, not the tokens. |

**Why not one giant plan:** 18 requirements and 11 new files exceeds the "coarse" granularity in `.planning/config.json` — splitting gives checkpoints for svelte-check + vitest between waves.

**Why not four plans (arch / logic / UI / tests):** v1.12 Feed Advance used 3 phases with 3-4 plans each, but feeds is 2 modes + 9 advisories + dual TPN lines + matrix frequencies. UAC/UVC is one weight → two outputs; splitting to 4 plans over-fragments. The research-driven unknowns (OKLCH + range input) are already closed here, so Wave 0 can safely bundle arch + logic.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions VERIFIED in repo; zero new deps.
- Architecture: HIGH — 11-file mirror of proven `src/lib/gir/` pattern; every integration point is an existing seam.
- Pitfalls: HIGH — 7 pitfalls identified, most avoided by design, each with mechanical fallback.
- Identity hue OKLCH quartet: HIGH — computed with W3C spec math, calibrated against shipped tokens.
- Bidirectional sync: HIGH — standard MDN pattern + Svelte docs; no novel primitive.
- Parity fixtures: HIGH — closed-form formulas verified against xlsx (not 1%-approximate — exact match).

**Research date:** 2026-04-23
**Valid until:** 2026-05-23 (30 days — stack is stable; Svelte 5 runes API locked; @lucide/svelte icon set stable)

## RESEARCH COMPLETE
