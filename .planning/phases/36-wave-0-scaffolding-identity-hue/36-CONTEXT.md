# Phase 36: Wave 0 — Scaffolding + Identity Hue - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the app shell to compile with a visible 4th "Feeds" calculator tab, a placeholder `/feeds` route, and a pre-audited OKLCH identity hue — unblocking all downstream phases (37–39). No calculator logic, no state, no real UI.

</domain>

<decisions>
## Implementation Decisions

### Icon Choice
- **D-01:** Use `Baby` from `@lucide/svelte` for the Feeds nav tab icon. Distinct from Syringe (Morphine), Milk (Formula), Droplet (GIR). Verified present in installed `@lucide/svelte` package.

### Identity Hue
- **D-02:** Use OKLCH hue ~30 (Warm Terracotta / Nutrition Orange) for `.identity-feeds`. Maximal hue separation from existing hues (145/195/220, Δ≥115° from nearest). Avoids error-red zone (0–25).
- **D-03:** Starting OKLCH values (subject to axe-sweep tuning):
  - Light: `--color-identity: oklch(50% 0.13 30)`, `--color-identity-hero: oklch(94% 0.04 30)`
  - Dark: `--color-identity: oklch(80% 0.10 30)`, `--color-identity-hero: oklch(24% 0.05 30)`
- **D-04:** Axe-core sweep on all 4 identity surfaces (hero bg, focus ring, eyebrow, active nav indicator) in both themes is a HARD GATE before this phase is considered complete. If any surface fails 4.5:1, retune lightness ±2–3% (per v1.5 Phase 20 Morphine precedent).

### Tab Label
- **D-05:** Nav tab label is "Feeds" — short, fits mobile nav width at 4 tabs, matches `/feeds` route, consistent with existing naming convention.

### Placeholder Content
- **D-06:** `/feeds` placeholder page shows centered text "Feed Advance Calculator — coming soon" with identity hue styling applied. Matches GIR v1.8 Wave 0 pattern.

### Type + Registry Extension
- **D-07:** Extend `CalculatorId` union in `src/lib/shared/types.ts` with `| 'feeds'`.
- **D-08:** Extend `identityClass` union in `src/lib/shell/registry.ts` with `| 'identity-feeds'`.
- **D-09:** Extend `activeCalculatorId` ternary in `src/lib/shell/NavShell.svelte` with `page.url.pathname.startsWith('/feeds') ? 'feeds'` branch.
- **D-10:** Add `feeds` stub entry to `aboutContent` Record in `src/lib/shared/about-content.ts` (required for `Record<CalculatorId, ...>` exhaustiveness). Stub copy, real copy in Phase 38/39.

### Claude's Discretion
- Exact placeholder page layout (typography size, spacing, whether to include an icon on the placeholder) — keep it minimal and consistent with existing patterns.
- Whether to add the `Baby` import to `registry.ts` on the same import line as existing icons or a separate line — follow existing code style.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Shell + Registry
- `src/lib/shell/registry.ts` — Calculator registry pattern; `CalculatorEntry` interface with `identityClass` union to extend
- `src/lib/shell/NavShell.svelte` — `activeCalculatorId` ternary chain (lines 11–15) to extend
- `src/lib/shared/types.ts` — `CalculatorId` union type (line 7) to extend
- `src/lib/shared/about-content.ts` — `aboutContent: Record<CalculatorId, AboutContent>` to extend

### Identity Tokens
- `src/app.css` — `.identity-morphine`, `.identity-formula`, `.identity-gir` blocks (lines 189–216) as pattern for `.identity-feeds`

### Reference Calculators (GIR = most recent Wave 0)
- `src/routes/gir/+page.svelte` — Route pattern to follow
- `src/lib/gir/` — Module structure reference

### Source of Truth
- `nutrition-calculator.xlsx` — Sheet1 (TPN full nutrition) + Sheet2 (bedside feeding advancement) — not needed for Phase 36 but context for what the placeholder route will become

### Research
- `.planning/research/ARCHITECTURE.md` — Wave-0 latent bug summary, file-by-file change list, identity hue proposal
- `.planning/research/PITFALLS.md` — P4 (Wave 0 compile gate), P5 (identity hue axe sweep)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@lucide/svelte` already installed — `Baby` icon available for import
- `SegmentedToggle`, `NumericInput`, `SelectPicker` — not needed in Phase 36 (placeholder only) but will be used in Phase 38
- `AboutSheet` component auto-propagates from `aboutContent` Record — just add the stub entry

### Established Patterns
- Registry entry: `{ id, label, href, icon, description, identityClass }` — append to `CALCULATOR_REGISTRY` array
- Identity CSS: `.identity-{name}` block with `--color-identity` + `--color-identity-hero` in light, then dark overrides via `.dark .identity-{name}, [data-theme="dark"] .identity-{name}`
- NavShell ternary: `page.url.pathname.startsWith('/feeds') ? 'feeds'` — add before the fallback default
- Route: `src/routes/feeds/+page.svelte` — thin wrapper (matches `src/routes/gir/+page.svelte` pattern)

### Integration Points
- `src/lib/shell/registry.ts` line 3: add `Baby` to lucide import
- `src/lib/shell/registry.ts` — append 4th entry after GIR
- `src/lib/shared/types.ts` line 7: extend union
- `src/lib/shell/NavShell.svelte` line 11–13: extend ternary
- `src/lib/shared/about-content.ts` line 14: add `feeds` key
- `src/app.css` after line 216: add `.identity-feeds` block

</code_context>

<specifics>
## Specific Ideas

- Identity hue ~30 is a "warm terracotta" — evokes nutrition/food semantics without being too close to BMF amber (~60) or error red (~0).
- ARCHITECTURE.md recommends verifying with hand-computed OKLCH contrast math before even coding, then confirming with axe-core sweep. Follow the GIR v1.8 discipline (hue 145 passed on first attempt using this process).
- The GIR wave 0 (v1.8 Phase 26) is the closest precedent — use it as the structural template for this phase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 36-wave-0-scaffolding-identity-hue*
*Context gathered: 2026-04-09*
