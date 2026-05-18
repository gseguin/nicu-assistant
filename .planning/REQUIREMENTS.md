# Requirements — v1.17 Remove PERT Calculator

**Milestone:** v1.17 Remove PERT Calculator
**Date opened:** 2026-05-17
**Goal:** Cleanly remove the PERT (Pediatric Enzyme Replacement Therapy) calculator from NICU Assistant. PERT is a pediatric tool, not a neonatal one — it does not belong in this product's clinical scope.

## Scope Boundary

**In scope:** Delete all PERT source code, route, tests, fixtures, registry entry, AboutSheet entry, identity CSS tokens. Audit favorites storage so users with PERT favorited do not encounter a broken state. Update documentation. Release as package v1.17.0.

**Out of scope:** Re-running deferred v1.15.1 SMOKE-01..10 real-iPhone gate (carries forward separately). No new calculator work. No design system changes beyond removing `.identity-pert`. No other tech-debt cleanup.

---

## v1.17 Requirements

### PERT Source Removal (PURGE)

- [ ] **PURGE-01**: `src/lib/pert/` directory deleted in full — `PertCalculator.svelte`, `PertInputs.svelte`, `calculations.ts`, `config.ts`, `state.svelte.ts`, `types.ts`, `calculator.ts`, `pert-config.json`, `pert-parity.fixtures.json`, and all co-located `*.test.ts` files
- [ ] **PURGE-02**: `src/routes/pert/+page.svelte` deleted (route disappears from the app entirely; navigating to `/pert` returns the SvelteKit not-found fallback)
- [ ] **PURGE-03**: `src/lib/shell/registry.ts` no longer imports `pertModule`; the `CALCULATOR_REGISTRY` array contains 5 entries (`feeds`, `formula`, `gir`, `morphine-wean`, `uac-uvc`) in alphabetical order
- [ ] **PURGE-04**: `src/lib/shared/types.ts` `CalculatorId` union no longer includes `'pert'` (`'morphine-wean' | 'formula' | 'gir' | 'feeds' | 'uac-uvc'`)
- [ ] **PURGE-05**: `src/lib/shared/about-content.ts` no longer contains the `pert:` block — the AboutSheet content map covers exactly the 5 remaining calculators
- [ ] **PURGE-06**: `src/app.css` no longer declares `.identity-pert` (both light and dark variants removed) — no orphan CSS rule for a class no element will ever apply

### Test Cleanup (TEST)

- [ ] **TEST-01**: `e2e/pert.spec.ts` and `e2e/pert-a11y.spec.ts` deleted
- [ ] **TEST-02**: `e2e/drawer-no-autofocus.spec.ts` route iteration array updated — `/pert` removed; spec iterates the 5 remaining calculator routes
- [ ] **TEST-03**: `src/lib/shell/__tests__/registry.test.ts` updated — `'PERT calculator as fifth entry'` test deleted; the alphabetical-IDs assertion reads `['feeds', 'formula', 'gir', 'morphine-wean', 'uac-uvc']`; total registry length expected = 5
- [ ] **TEST-04**: `src/lib/shell/HamburgerMenu.test.ts` updated — assertions referencing `/PERT/i` link removed; comment block about pert-workstream registry alphabetization updated to reflect 5 entries; default-favorites comment updated
- [ ] **TEST-05**: `src/lib/shell/CalculatorPage.test.ts` updated — test scaffolding that builds a synthetic `identity-pert` module replaced with a generic identity class that still exists (e.g., `identity-gir` or a neutral test class); no test references `identity-pert`
- [ ] **TEST-06**: `src/lib/shared/favorites.test.ts` updated — comment about post-D-19 alphabetization listing `pert` updated; any test fixture that includes `'pert'` in a stored-favorites array updated or repurposed to assert graceful filtering of unknown IDs (see SAFE-01)
- [ ] **TEST-07**: Vitest `pnpm test` reports 0 failing tests after all PURGE + TEST changes (count drops by however many tests lived in `src/lib/pert/*.test.ts`; remaining suite is fully green)
- [ ] **TEST-08**: Playwright `pnpm exec playwright test` runs both `chromium` and `webkit-iphone` projects with no PERT-specific failures (any pre-existing unrelated failures unchanged)

### Favorites Safety Net (SAFE)

- [ ] **SAFE-01**: A user whose `localStorage` contained `'pert'` in their favorites array (from v1.15+) loads the app cleanly after the upgrade — `favoritesStore` filters the unknown ID out silently; bottom-bar / hamburger menu / desktop nav render with only valid IDs; no crash, no console error, no missing-icon placeholder
- [ ] **SAFE-02**: Unit test covers the upgrade path — load `['morphine-wean', 'formula', 'pert', 'gir']` from `localStorage` and assert the resulting favorites array is `['morphine-wean', 'formula', 'gir']` (PERT silently dropped, order preserved)
- [ ] **SAFE-03**: First-run defaults verified — `favoritesStore` first-run default does not include `'pert'` (it does not currently; this is a regression guard, not a change)

### Documentation Cleanup (DOC)

- [ ] **DOC-01**: `.planning/PROJECT.md` Validated list — the v1.15 PERT entry (line referencing "Pediatric EPI PERT Calculator (sixth clinical calculator) shipped as self-contained workstream") moved to a new `### Invalidated / Removed` subsection under Requirements, with reason `v1.17 — out of clinical scope (pediatric, not neonatal)`
- [ ] **DOC-02**: `.planning/PROJECT.md` Context section — six-calculators description updated to five; PERT bullet removed; calculator count corrected in any sentence that says "all six calculators" or similar
- [ ] **DOC-03**: `.planning/PROJECT.md` Architecture section — the `<CalculatorPage>` shell description listing `/pert` in its route enumeration updated to list the 5 remaining routes
- [ ] **DOC-04**: `.planning/PROJECT.md` Glossary / acronyms — PERT acronym entry removed (or marked historical with note that the calculator was removed in v1.17)
- [ ] **DOC-05**: `.planning/MILESTONES.md` — new entry added for v1.17 at the top following the standard format (phases, plans, key accomplishments, deferred items); the v1.15 PERT entry left as historical record but annotated `[REMOVED in v1.17 — out of clinical scope]`
- [ ] **DOC-06**: `.planning/PROJECT.md` Key Decisions table — the `"Ship PERT as self-contained workstream"` row's `Outcome` column updated from `"⚠️ Revisit — v1.15 PERT later removed in v1.16 (out of clinical scope)"` to a final `"❌ Removed in v1.17 — out of clinical scope (pediatric, not neonatal)"` (the historical decision row stays for traceability)

### Release (REL)

- [ ] **REL-01**: `package.json` version bumped to `1.17.0` (from current `1.16.1`); `pnpm-lock.yaml` regenerated if needed
- [ ] **REL-02**: AboutSheet displays `v1.17.0` (auto via `__APP_VERSION__` build-time constant — verify, no manual edits expected)
- [ ] **REL-03**: Full clinical gate green — `pnpm svelte-check` reports 0/0 errors across all files; `pnpm test` (vitest) all suites green; `pnpm exec playwright test` `chromium` + `webkit-iphone` projects green; extended axe sweeps green in both light + dark themes (count drops by the 4 PERT a11y sweeps, remainder unchanged)
- [ ] **REL-04**: `.planning/PROJECT.md` Last-updated footer reflects the release date; STATE.md frontmatter status flipped to `complete`; v1.17 archived to `.planning/milestones/v1.17-{REQUIREMENTS,ROADMAP,phases}/` via `/gsd:complete-milestone`

---

## Future / Deferred

- **SMOKE-01..10** (real-iPhone smoke gate, deferred from v1.15.1) — carries forward into a future milestone when a clinician is available bedside. Not in v1.17 scope.

## Out of Scope (explicit exclusions)

- **Re-adding PERT under a different banner or to a future product** — this is a removal, not a rename. If pediatric EPI dosing tooling is needed, it will live in a different (pediatric, not NICU) product.
- **Renaming the package or the project** — only the version bump (1.16.1 → 1.17.0) is in scope.
- **Migrating the v1.15 workstream archive (`milestones/ws-pert-2026-04-26/`) out of the repo** — historical record preserved as-is.
- **Adding any new calculator, tweaking any remaining calculator, or design-system changes** beyond removing `.identity-pert`.
- **PWA cache invalidation / service-worker version bump beyond the standard build** — vite-plugin-pwa handles this on package version change.

---

## Traceability

| Phase | Requirement IDs | Status |
|-------|-----------------|--------|
| _(populated by roadmapper)_ | | |
