# Technology Stack — v1.12 Feed Advance Calculator

**Project:** NICU Assistant
**Milestone:** v1.12 Feed Advance Calculator
**Researched:** 2026-04-09
**Scope:** Additions only. Base stack (SvelteKit 2.57 / Svelte 5.55 / Tailwind 4 / Vite 8 / TS 6 / pnpm 10.33 / @vite-pwa/sveltekit / adapter-static / Vitest 4 / Playwright 1.58 / axe-core / @lucide/svelte 1.8 / bits-ui 2.17) is frozen and NOT re-evaluated.

## TL;DR

**Zero new runtime dependencies. Zero new devDependencies.** The Feed Advance Calculator is a pure application of existing patterns — a fourth entry in `CALCULATOR_REGISTRY`, a new `src/lib/feeds/` module, a JSON config, spreadsheet-parity tests against `nutrition-calculator.xlsx`, and one new `--color-identity` OKLCH token pair. No new lib is justified.

## Recommended Stack Additions

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| — | — | — | None. SvelteKit + Svelte 5 runes already carry the calculator pattern proven across Morphine, Formula, and GIR. |

### Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| — | — | — | N/A. Clinical parameters embedded at build time in `src/lib/feeds/feeds-config.json` (same pattern as `morphine-config.json`, `fortification-config.json`, `gir-config.json`). No runtime DB. |

### Infrastructure
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| — | — | — | adapter-static SPA output unchanged. PWA precache extends automatically to the new `/feeds` route. |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| — | — | — | See per-question justifications below. |

## Answers to Specific Questions

### 1. xlsx parsing / test helpers for Sheet1 + Sheet2 parity?

**Verdict: NO addition. Continue hand-written fixtures.**

**Rationale:**
- Existing parity tests (`morphine-wean.test.ts`, `gir.test.ts`, `fortification.test.ts`) all use hand-transcribed row-by-row fixtures from the authoritative xlsx with an `~1%` epsilon. This pattern is documented in PROJECT.md Key Decisions and has shipped 3 calculators with zero drift.
- Adding a runtime xlsx parser (`xlsx`/`sheetjs`, `exceljs`) would be overkill and wrong: the spreadsheet is the *source of truth at authoring time*, not a runtime input. The whole point of transcribing to fixtures is to pin the contract in the repo and survive xlsx file renames/moves.
- A devDep parser used only in tests would add weight and indirection: humans would still need to read the xlsx to validate transcriptions, so the parser adds work, not saves it.
- Sheet1 (full TPN + enteral) and Sheet2 (bedside advancement) are both small tables — Sheet2 in particular is a handful of rows that transcribe in minutes.
- Hand transcription has already caught a truncated-constant class of issue on Morphine that automated xlsx parsing would have silently propagated.

**Action:** In `src/lib/feeds/__tests__/feeds.test.ts`, create two locked fixture blocks: `SHEET1_CASES` (TPN + enteral full-nutrition) and `SHEET2_CASES` (bedside advancement per trophic divisor and advance cadence). Mirror the `morphine-wean.test.ts` shape.

### 2. New lucide icon for the Feed Advance nav tab?

**Verdict: YES — `Baby` from `@lucide/svelte` (already installed). Zero new package.**

**Candidates considered (all in `@lucide/svelte` 1.8.0):**
| Icon | Fit | Verdict |
|------|-----|---------|
| `Baby` | Clearest "infant feeding" signal; complements Milk (Formula) and Syringe (Morphine) without colliding | **Recommended** |
| `Utensils` | Reads "adult dining," wrong register for NICU enteral feeding | Reject |
| `CookingPot` | Too literal/kitchen | Reject |
| `Soup` | Reads as "meal," not "advancing enteral feeds" | Reject |
| `TrendingUp` | Captures "advance" but loses "feeding" context | Reject |
| `Bottle` | Does not exist in lucide | N/A |
| `Milk` | Already used by Formula tab — collision | Reject |

`Baby` is visually distinct from `Syringe`, `Milk`, `Droplet` and reads unambiguously as "infant," which is the defining subject of a feeding-advancement calculator. The semantic gap ("baby" ≠ "feeds") is acceptable because the label text is always visible (NAV-01/NAV-02), so the icon carries recognition, not meaning.

**Action:** In `src/lib/shell/registry.ts`, add `Baby` to the existing `@lucide/svelte` import and use it on the `feeds` entry. Extend the `identityClass` union to include `'identity-feeds'`. No `package.json` change.

**Confidence:** HIGH — `Baby` is a long-standing lucide icon, present in every recent release including the currently-installed 1.8.0.

### 3. Numeric formatting library for ml/feed display?

**Verdict: NO addition. Keep inline `.toFixed(1)` pattern.**

**Rationale:**
- Morphine (mg), Formula (g/packets/scoops), and GIR (mg/kg/min and ml/hr) all format inline at the render site. There is no shared `formatNumber` helper, and introducing one for a single new calculator would require a codemod across three existing calculators to justify itself.
- `ml/feed` is a single-decimal clinical value — `.toFixed(1)` is trivially correct for the range involved (0.1–50 ml).
- Libs like `numeral`, `d3-format`, or `Intl.NumberFormat` wrappers offer no benefit here: no locale-specific grouping, no currency, no unit conversion. Pure decimal truncation.
- The project has a zero-runtime-deps posture for calculator math (DEBT-03 decision, v1.9). Adding one for display formatting would violate that trajectory.

**Action:** Use `value.toFixed(1)` at the render site in `FeedAdvanceCalculator.svelte`. If the same formatting repeats 3+ times within the module, extract a local `formatMlPerFeed(n: number)` helper in `src/lib/feeds/feeds.ts` — local to the module, not shared.

### 4. Additional Tailwind plugin for the 4th identity hue?

**Verdict: NO plugin. Add one OKLCH token pair to `src/app.css`.**

**Rationale:**
- v1.5 introduced the `--color-identity` pattern wired to exactly 4 surfaces (result hero, focus rings, eyebrows, active nav indicator). It is implemented purely with CSS custom properties declared under `.identity-morphine`, `.identity-formula`, `.identity-gir` selectors in `src/app.css`.
- No Tailwind plugin is involved; Tailwind 4's `@theme` + arbitrary-value utilities consume the tokens directly. Adding a plugin would add an indirection for zero expressive gain.
- The Morphine v1.5 Phase 20 retune and the GIR v1.8 first-pass-green both confirm the flow: pick an OKLCH triple → declare it → run 4 axe sweeps (light/dark, focus, hero, nav) → adjust L only if contrast fails.

**Action:** In `src/app.css`, add a new `.identity-feeds` selector block mirroring `.identity-gir`. Pick a hue that clears WCAG 4.5:1 in both themes against existing result-hero text tokens. Hue-space already in use: 220 (Morphine blue), 60 (Formula amber), 145 (GIR green). **Recommended: hue ~25 (warm terracotta/clay) or hue ~285 (violet)** — both clearly separated from the existing three on the hue wheel and neither collides with the red reserved for errors. Final L/C tuning is a Phase task, not a research task.

**Axe-core upfront audit** (per v1.8 Key Decision): do the OKLCH contrast math in the discussion phase, not after the first axe failure. Cost of one audit < cost of one retune cycle.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| xlsx parity | Hand-written fixtures | `xlsx` / `exceljs` devDep | Adds weight, silently propagates truncation errors, provides nothing hand-transcription doesn't already guarantee. |
| Nav icon | `Baby` (existing `@lucide/svelte`) | `Utensils`, `Soup`, `CookingPot` | Wrong clinical register — these read "adult dining." |
| Nav icon | `Baby` | Custom SVG | No benefit; lucide maintains parity with Svelte 5 via `@lucide/svelte`. |
| Number formatting | Inline `.toFixed(1)` | `numeral`, `d3-format`, `Intl.NumberFormat` | Single-decimal clinical value. Zero locale/grouping needs. Violates zero-dep posture. |
| Identity hue | New OKLCH token in `app.css` | Tailwind plugin | Plugin adds indirection for a ~6-line CSS change. Pattern is proven through 3 calculators. |
| Identity hue | New OKLCH token | Reuse existing hue | Per-tab identity is the entire point of `--color-identity`; reuse would collapse the signal. |

## Installation

```bash
# No runtime installs.
# No devDependency installs.
# No package.json changes beyond the v1.12.0 version bump at release.
```

## Sources

- PROJECT.md Validated list (v1.5 `--color-identity` introduction, v1.8 GIR first-pass axe green, v1.9 DEBT-03 zero-dep posture, v1.11 Morphine xlsx Sheet1 parity) — HIGH confidence, in-repo authority.
- `src/lib/shell/registry.ts` — current icon imports and `identityClass` union — HIGH confidence, read directly.
- `@lucide/svelte` 1.8.0 icon inventory (`Baby` long-standing export) — HIGH confidence, present in currently-installed version.
- Tailwind CSS v4 `@theme` + CSS custom property docs: https://tailwindcss.com/docs/theme — MEDIUM confidence, consistent with existing `src/app.css` usage.
- Key Decisions: "Research before PR for new identity hues" (v1.8) and "Drop ESLint in favor of svelte-check + Prettier only" (v1.9, Phase 30-02) — HIGH confidence, establish the zero-dep guardrail.
