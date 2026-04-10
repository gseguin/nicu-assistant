# Phase 36: Wave 0 — Scaffolding + Identity Hue - Research

**Researched:** 2026-04-09
**Domain:** SvelteKit app shell extension (registry, types, routing, OKLCH identity tokens)
**Confidence:** HIGH

## Summary

Phase 36 extends the existing 3-calculator app shell to compile with a 4th "Feeds" tab. The work is entirely mechanical: extend a TypeScript union, add a registry entry, add a NavShell ternary branch, add a CSS identity block, add an about-content stub, and create a placeholder route. The GIR Wave 0 (v1.8 Phase 26) is the direct structural precedent.

The only non-trivial concern is the OKLCH identity hue contrast audit. The proposed light-mode `--color-identity: oklch(50% 0.13 30)` is slightly lighter than all three existing identity tokens (L=46%–49%), which puts it at the edge of 4.5:1 against white backgrounds. The planner should budget an axe-core verification step and be prepared to retune lightness down to L=48% if it fails.

**Primary recommendation:** Follow the GIR wave-0 pattern exactly — extend 5 files, add 1 route, add 1 CSS block, verify compilation, then run axe. No creativity needed; this is pattern replication.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use `Baby` from `@lucide/svelte` for the Feeds nav tab icon
- **D-02:** OKLCH hue ~30 (Warm Terracotta) for `.identity-feeds`
- **D-03:** Starting OKLCH values: Light `oklch(50% 0.13 30)` / `oklch(94% 0.04 30)`, Dark `oklch(80% 0.10 30)` / `oklch(24% 0.05 30)` (subject to axe tuning)
- **D-04:** Axe-core sweep on all 4 identity surfaces in both themes is a HARD GATE
- **D-05:** Nav tab label is "Feeds"
- **D-06:** Placeholder shows "Feed Advance Calculator -- coming soon" with identity hue styling
- **D-07:** Extend `CalculatorId` union with `| 'feeds'`
- **D-08:** Extend `identityClass` union with `| 'identity-feeds'`
- **D-09:** Extend `activeCalculatorId` ternary with `/feeds` branch
- **D-10:** Add `feeds` stub to `aboutContent` Record

### Claude's Discretion
- Exact placeholder page layout (typography, spacing, optional icon)
- Import formatting for `Baby` in registry.ts

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-01 | `CalculatorId` union extended with `'feeds'` | Exact file + line identified: `src/lib/shared/types.ts` line 7 |
| ARCH-02 | NavShell ternary extended with `/feeds` branch | Exact file + lines: `src/lib/shell/NavShell.svelte` lines 11-15 |
| ARCH-03 | Registry entry with `identityClass: 'identity-feeds'` + Baby icon | Exact file: `src/lib/shell/registry.ts`, Baby icon verified in node_modules |
| ARCH-04 | `about-content.ts` gets `feeds` stub entry | Exact file + line: `src/lib/shared/about-content.ts` line 14 |
| ARCH-05 | New `src/lib/feeds/` module directory | Placeholder only in Wave 0; full module in Phase 37-38 |
| ARCH-06 | New `/feeds` route | `src/routes/feeds/+page.svelte` following GIR pattern |
| ARCH-07 | Zero new dependencies | Verified: `Baby` already in `@lucide/svelte`, no other additions needed |
| HUE-01 | `.identity-feeds` OKLCH token pair in app.css | Pattern: lines 191-217 of app.css; append after `.identity-gir` dark block |
| HUE-02 | OKLCH hand-computed for 4.5:1 contrast | Contrast analysis in this research (see Common Pitfalls) |
| HUE-03 | Axe-core sweep passes on all identity surfaces | Hard gate; planner must include as verification step |
</phase_requirements>

## Standard Stack

No new dependencies. Phase 36 uses only what is already installed. [VERIFIED: codebase inspection]

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `@lucide/svelte` | installed | `Baby` icon for Feeds tab | `Baby` component verified at `node_modules/@lucide/svelte/dist/icons/baby.svelte` |
| SvelteKit 2 | ^2.55.0 | Routing (`src/routes/feeds/+page.svelte`) | Already in use |
| Tailwind CSS 4 | ^4.2.2 | Identity token CSS custom properties | Already in use |

**Zero new runtime or dev dependencies required (ARCH-07).** [VERIFIED: CONTEXT.md D-07, CLAUDE.md stack constraints]

## Architecture Patterns

### File Changes Map (Exact)

All changes are single-point edits to existing files plus two new files.

#### Files to MODIFY (5 edits)

| File | Line(s) | Change | Pattern Source |
|------|---------|--------|---------------|
| `src/lib/shared/types.ts` | 7 | `'morphine-wean' \| 'formula' \| 'gir'` becomes `'morphine-wean' \| 'formula' \| 'gir' \| 'feeds'` | [VERIFIED: codebase] |
| `src/lib/shell/registry.ts` | 3 | Add `Baby` to lucide import | [VERIFIED: codebase] |
| `src/lib/shell/registry.ts` | 11 | Extend `identityClass` union: `\| 'identity-feeds'` | [VERIFIED: codebase] |
| `src/lib/shell/registry.ts` | 14-39 | Append 4th entry after GIR | [VERIFIED: codebase] |
| `src/lib/shell/NavShell.svelte` | 11-15 | Add `page.url.pathname.startsWith('/feeds') ? 'feeds'` BEFORE the fallback `'morphine-wean'` | [VERIFIED: codebase] |
| `src/lib/shared/about-content.ts` | after line 48 | Add `feeds: { title, version, description, notes }` stub | [VERIFIED: codebase] |
| `src/app.css` | after line 217 | Add `.identity-feeds` light + dark blocks | [VERIFIED: codebase pattern at lines 191-217] |

#### Files to CREATE (1-2 new files)

| File | Purpose |
|------|---------|
| `src/routes/feeds/+page.svelte` | Placeholder route — thin wrapper matching GIR pattern |
| `src/lib/feeds/` (directory) | Empty module directory for ARCH-05 (or defer directory creation to Phase 37 if no files go in it yet) |

### Registry Entry Pattern

Follow the exact `CalculatorEntry` shape from registry.ts:

```typescript
// Source: src/lib/shell/registry.ts (verified codebase pattern)
{
  id: 'feeds',
  label: 'Feeds',
  href: '/feeds',
  icon: Baby,
  description: 'Feed advance calculator',
  identityClass: 'identity-feeds',
}
```

[VERIFIED: matches existing entries for morphine-wean, formula, gir]

### NavShell Ternary Extension

Current (lines 11-15):
```typescript
const activeCalculatorId = $derived<CalculatorId>(
  page.url.pathname.startsWith('/formula') ? 'formula'
  : page.url.pathname.startsWith('/gir') ? 'gir'
  : 'morphine-wean'
);
```

Must become:
```typescript
const activeCalculatorId = $derived<CalculatorId>(
  page.url.pathname.startsWith('/formula') ? 'formula'
  : page.url.pathname.startsWith('/gir') ? 'gir'
  : page.url.pathname.startsWith('/feeds') ? 'feeds'
  : 'morphine-wean'
);
```

[VERIFIED: codebase, CONTEXT.md D-09]

### Placeholder Route Pattern

Follow `src/routes/gir/+page.svelte` structure but simplified (no calculator component, no state init):

```svelte
<script lang="ts">
  import { setCalculatorContext } from '$lib/shared/context.js';
  import { Baby } from '@lucide/svelte';
  import { onMount } from 'svelte';

  onMount(() => {
    setCalculatorContext({
      id: 'feeds',
      accentColor: 'var(--color-identity)'
    });
  });
</script>

<svelte:head>
  <title>Feeds | NICU Assistant</title>
</svelte:head>

<div class="identity-feeds max-w-lg md:max-w-4xl mx-auto px-4 py-6 space-y-4">
  <header class="flex items-center gap-3">
    <Baby size={28} class="text-[var(--color-identity)]" aria-hidden="true" />
    <div class="flex flex-col">
      <h1 class="text-title font-bold text-[var(--color-text-primary)]">Feed Advance Calculator</h1>
      <span class="text-ui text-[var(--color-text-secondary)]">coming soon</span>
    </div>
  </header>
</div>
```

[VERIFIED: mirrors GIR route pattern exactly, CONTEXT.md D-06]

### Identity CSS Token Pattern

Follow lines 191-217 of `src/app.css`:

```css
/* After .identity-gir dark block (line 217) */
.identity-feeds {
  --color-identity:      oklch(50% 0.13 30);
  --color-identity-hero: oklch(94% 0.04 30);
}
.dark .identity-feeds,
[data-theme="dark"] .identity-feeds {
  --color-identity:      oklch(80% 0.10 30);
  --color-identity-hero: oklch(24% 0.05 30);
}
```

[VERIFIED: exact pattern from existing identity blocks, values from CONTEXT.md D-03]

### About Content Stub

```typescript
feeds: {
  title: 'Feed Advance Calculator',
  version: appVersion,
  description:
    'Calculates bedside feeding advancement volumes and full TPN nutrition totals for NICU patients.',
  notes: [
    'Source: nutrition-calculator.xlsx Sheet1 (TPN full nutrition) + Sheet2 (bedside advancement).',
    'Coming soon.',
  ],
},
```

[ASSUMED: stub copy is Claude's discretion per CONTEXT.md; real copy comes in Phase 38/39]

### Anti-Patterns to Avoid

- **Do NOT create `src/lib/feeds/` module files in Wave 0.** ARCH-05 says the directory exists, but calculations, config, state, and component files belong to Phase 37-38. Wave 0 is shell-only.
- **Do NOT touch `+layout.svelte` idle detection.** The feeds state does not exist yet; adding it to the idle check would break compilation.
- **Do NOT change the registry `id` field type.** It is currently `string`, not `CalculatorId`. Tightening is tech debt, out of scope (per ARCHITECTURE.md section 7).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OKLCH contrast checking | Manual pixel-sampling or eyeball estimation | axe-core via Playwright (`@axe-core/playwright`) | Already integrated in E2E suite; produces machine-verifiable pass/fail |
| Tab navigation rendering | Custom nav component for feeds | Existing `NavShell.svelte` + `CALCULATOR_REGISTRY` | Registry-driven rendering means adding the entry is sufficient |
| About dialog | Custom modal for feeds | Existing `AboutSheet.svelte` auto-propagates from `aboutContent` Record | Just add the Record key |

## Common Pitfalls

### Pitfall 1: Identity Lightness at the 4.5:1 Edge (P5 repeat risk)

**What goes wrong:** The proposed light-mode `--color-identity: oklch(50% 0.13 30)` is used for text and icons rendered on white (`oklch(100% 0 0)`) and near-white card surfaces. Existing identity tokens that pass axe use L=46% (GIR), L=49% (formula, morphine). At L=50%, hue 30 (terracotta) may land at or just below 4.5:1 because warm hues at the same OKLCH lightness produce slightly higher relative luminance than cool hues (the Helmholtz-Kohlrausch effect). [ASSUMED: HK effect magnitude at these chroma levels]

**Why it happens:** OKLCH lightness is perceptually uniform but WCAG contrast uses relative luminance, which diverges from OKLCH L especially for saturated warm colors.

**How to avoid:**
1. Run `pnpm exec playwright test` with axe on the feeds placeholder immediately after adding the CSS tokens.
2. If 4.5:1 fails, decrease L by 2-3%: `oklch(48% 0.13 30)` or `oklch(47% 0.13 30)`.
3. The dark-mode values (L=80% identity on L=16-23% surfaces) have generous headroom and are unlikely to fail.

**Warning signs:** Any axe violation on `color-contrast` for elements inside `.identity-feeds`.

### Pitfall 2: NavShell Ternary Ordering

**What goes wrong:** If the `/feeds` branch is placed AFTER the `'morphine-wean'` fallback, it will never match. The fallback must remain last.

**How to avoid:** Add `/feeds` check before the final `: 'morphine-wean'` fallback. This is the same pattern used when GIR was added in v1.8.

### Pitfall 3: TypeScript Exhaustiveness Error in about-content.ts

**What goes wrong:** Extending `CalculatorId` to include `'feeds'` immediately causes a TypeScript error in `aboutContent: Record<CalculatorId, AboutContent>` because the `feeds` key is missing. This means the type extension and the about-content stub MUST be done in the same commit (or at least the same compilation unit).

**How to avoid:** Edit `types.ts` and `about-content.ts` together, then run `pnpm check` to verify.

### Pitfall 4: Registry identityClass Union Not Extended

**What goes wrong:** The `identityClass` property on `CalculatorEntry` is a string literal union (line 11 of registry.ts). Adding a registry entry with `identityClass: 'identity-feeds'` without extending the union causes a TypeScript error.

**How to avoid:** Extend the union on line 11 before or alongside adding the new entry.

## Code Examples

All code examples are in the Architecture Patterns section above, drawn directly from the verified codebase.

## State of the Art

No changes since v1.8 GIR Wave 0. The pattern is stable:

| Aspect | Approach | Since |
|--------|----------|-------|
| Calculator registration | Static `CALCULATOR_REGISTRY` array | v1.3 |
| Identity theming | CSS custom properties via `.identity-*` classes | v1.5 |
| NavShell routing | Derived ternary chain on `page.url.pathname` | v1.3 |
| About content | `Record<CalculatorId, AboutContent>` exhaustive map | v1.3 |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | About-content stub copy is adequate for Wave 0 | Architecture Patterns | LOW -- stub is explicitly permitted by D-10; real copy in Phase 38/39 |
| A2 | Helmholtz-Kohlrausch effect may push L=50% hue 30 below 4.5:1 on white | Pitfall 1 | MEDIUM -- axe sweep is the hard gate regardless; if contrast passes at L=50%, no action needed |
| A3 | `src/lib/feeds/` directory creation can be deferred to Phase 37 | Architecture Patterns | LOW -- ARCH-05 just says the module exists, Phase 37 creates the actual files |

## Open Questions

None. All decisions are locked in CONTEXT.md. The axe-core contrast result is the only unknown, and the mitigation (retune L by 2-3%) is well-established.

## Sources

### Primary (HIGH confidence)
- `src/lib/shared/types.ts` line 7 -- CalculatorId union definition [VERIFIED: codebase]
- `src/lib/shell/registry.ts` lines 1-39 -- CalculatorEntry interface + CALCULATOR_REGISTRY [VERIFIED: codebase]
- `src/lib/shell/NavShell.svelte` lines 11-15 -- activeCalculatorId ternary [VERIFIED: codebase]
- `src/lib/shared/about-content.ts` lines 14-49 -- Record<CalculatorId, AboutContent> [VERIFIED: codebase]
- `src/app.css` lines 186-218 -- identity token blocks [VERIFIED: codebase]
- `src/routes/gir/+page.svelte` -- route pattern reference [VERIFIED: codebase]
- `node_modules/@lucide/svelte/dist/icons/baby.svelte` -- Baby icon exists [VERIFIED: filesystem]

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` -- Wave 0 latent bug summary, build order [VERIFIED: project docs]
- `.planning/research/PITFALLS.md` -- P4 (compile gate), P5 (axe sweep) [VERIFIED: project docs]
- `36-CONTEXT.md` -- all 10 locked decisions [VERIFIED: user decisions]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all verified in codebase
- Architecture: HIGH -- exact line numbers verified, pattern replicated 3 times before
- Pitfalls: HIGH -- based on documented v1.5/v1.8 project history

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable patterns, no external dependencies)
