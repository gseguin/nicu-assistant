# Phase 52: Code Purge + Test Suite Repair - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 52 removes all PERT (Pediatric Enzyme Replacement Therapy) calculator source code, routes, e2e specs, and integration touchpoints from the NICU Assistant codebase, and repairs the test suite so vitest + Playwright are green at the phase boundary. PERT is out of clinical scope (pediatric, not neonatal) — this phase narrows the app to its 5 remaining calculators (feeds, formula, gir, morphine-wean, uac-uvc).

**In scope:** source deletes (`src/lib/pert/`, `src/routes/pert/`, `e2e/pert*.spec.ts`), CALCULATOR_REGISTRY entry removal, integration edits (shared/types.ts CalculatorId union, shared/about-content.ts, app.css `.identity-pert` light + dark, favoritesStore default array), test surgery in cross-cutting specs (registry.test.ts, HamburgerMenu.test.ts, CalculatorPage.test.ts, favorites.test.ts, desktop-full-nav.spec.ts, drawer-no-autofocus.spec.ts), historical-comment generalization (`src/lib/fortification/calculator.ts:13`).

**Out of scope:** user-facing documentation (README/About/CHANGELOG updates → Phase 53 DOC), `.planning/` artifact archival (→ Phase 54 REL), version bump (→ Phase 54), pre-existing 32 Playwright failures (Phase 47 follow-up backlog).

</domain>

<decisions>
## Implementation Decisions

### Plan Structure & Atomicity
- **D-01:** Split Phase 52 into 3 atomic plans, each leaving vitest + Playwright green at commit boundary.
- **D-02:** Plan **52-01** (source purge) deletes `src/lib/pert/` (all 14 files including .test.ts), `src/routes/pert/+page.svelte`, `e2e/pert.spec.ts`, `e2e/pert-a11y.spec.ts`, **AND** removes the PERT entry from `CALCULATOR_REGISTRY` in `src/lib/shell/registry.ts` in the same commit. The registry edit must land with the deletes so iterator-based tests don't go red mid-phase.
- **D-03:** Plan **52-02** (source-side integration) edits `src/lib/shared/types.ts` (CalculatorId union — drop `'pert'`), `src/lib/shared/about-content.ts` (drop PERT entry), `src/app.css` (remove `.identity-pert` light + dark blocks), and `favoritesStore` default array if PERT was a default (verify against v1.13 D-19 baseline: `['morphine-wean', 'formula', 'gir', 'feeds']` — likely no change needed).
- **D-04:** Plan **52-03** (test-file surgery) edits only test files: `registry.test.ts`, `HamburgerMenu.test.ts`, `CalculatorPage.test.ts`, `favorites.test.ts` (regression test addition), `desktop-full-nav.spec.ts` (line 33 `tabs.nth(4)` assertion), `drawer-no-autofocus.spec.ts` (route iteration array).
- **D-05:** Rationale: matches v1.16 calculator-store refactor pattern (5 atomic green commits); each plan is independently reviewable; SC #4 ("test suite green at phase boundary") is satisfied at *every* commit boundary, not just the phase boundary, which gives clean bisect.

### Test Surgery Posture
- **D-06:** Editing posture is **surgical** — remove PERT-specific assertions/data, keep test shape and structure intact. Do **NOT** refactor to data-driven (deriving expected calculators from `CALCULATOR_REGISTRY.map(c => c.id)`) — that's scope creep beyond "remove PERT".
- **D-07:** `desktop-full-nav.spec.ts:33` (`expect(tabs.nth(4)).toContainText('PERT')`) — change `tabs.nth(4)` to assert on a remaining calculator OR drop the 5th-tab assertion entirely. Implementer's call based on what gives cleanest test intent.
- **D-08:** `drawer-no-autofocus.spec.ts` — remove `'/pert'` from the route iteration array.
- **D-09:** `registry.test.ts`, `HamburgerMenu.test.ts`, `CalculatorPage.test.ts` — drop PERT-specific test cases; remaining shared-shell coverage stays for the 5 remaining calculators.

### Favorites Migration (Upgrade Safety)
- **D-10:** Keep existing `favoritesStore` localStorage filter logic **as-is** — it already gracefully handles unknown IDs (designed for exactly this upgrade scenario).
- **D-11:** Add a regression test in `favorites.test.ts` asserting the filter behavior, but use a **generic** string literal (e.g., `'unknown-calculator-id'`) instead of `'pert'`. This keeps the grep gate clean and makes the test feature-agnostic (future deletions covered by the same regression).
- **D-12:** No explicit one-shot migration code (no console.log breadcrumb, no migration version number). The existing filter is sufficient.

### String Scrubbing
- **D-13:** Scrub **ALL** 'PERT' and 'pert' strings from active test files. Post-52-03, `git grep -niwE 'pert|PERT' -- src/ e2e/ tests/` should return only the intentional historical comments (see D-14).

### Historical Comments
- **D-14:** Rewrite historical comments in src/ code **generically** — drop 'PERT' references. The known case `src/lib/fortification/calculator.ts:13` ("the PERT slice") should become "other calculator slices" or similar. The comment's *intent* (explaining a cross-slice pattern) is preserved; the deleted feature's name is removed.
- **D-15:** Phase 52 scope **only edits source comments**. CHANGELOG, README, About-page content edits are out of scope (deferred to Phase 53 DOC and Phase 54 REL).
- **D-16:** `.planning/` directory is **historical record** — leave PERT references INTACT. Grep gate (D-19) excludes `.planning/`. Archival to `.planning/archive/v1.17-pert-removal/` happens in Phase 54, not Phase 52.

### Commit & PR Messaging
- **D-17:** Commit messages reference PERT **explicitly**: e.g., "remove PERT calculator source + registry (52-01)", "purge PERT integration points from shared + app.css (52-02)", "scrub PERT test references (52-03)". Git log is the canonical removal record — `git log --oneline | grep -i pert` should tell the removal arc forever.

### Verification & Grep Gate
- **D-18:** Grep gate is enforced **once** in `52-VERIFICATION.md` (manual verification, not CI check or pre-commit hook). One-time removal doesn't need ongoing guardrail; subsequent regressions are caught at code-review.
- **D-19:** Grep command is **word-boundary**: `git grep -niwE 'pert|PERT' -- ':(exclude).planning/'`. The `-w` flag matches whole words only, so `property`, `properties`, `expert`, `assertions` etc. don't false-positive. No exclude list beyond `.planning/` needed.
- **D-20:** 52-VERIFICATION.md attests: (1) vitest pass count post-52 vs pre-52 (expect reduction matching deleted test files); (2) grep command returns only allowed historical comments (or zero); (3) `pnpm build` succeeds; (4) `pnpm check` shows 0 errors; (5) `du -sh build/` delta (expected bundle shrinkage from PERT removal).
- **D-21:** 32 pre-existing Playwright failures (28 axe dlitem + 2 disclaimer-banner + 2 calc UI from v1.15.1 era) are **baseline** for Phase 52. Verification asserts Playwright failure count **did not INCREASE** from baseline, not that all pass. Pre-existing red is owned by the Phase 47 follow-up backlog, not Phase 52.

### Claude's Discretion
- D-07 (specifically: replace 5th-tab assertion vs delete it) — implementer chooses based on cleanest test intent at execution time.
- D-03 (favorites default array): verify against current codebase whether 'pert' is in defaults; edit only if present.

### Folded Todos
None — Phase 52 scope is fully derived from ROADMAP.md Phase 52 + REQUIREMENTS.md PURGE-01..06 + TEST-01..08. No external todos folded in.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements
- `.planning/ROADMAP.md` §Phase 52 — 14 requirements (PURGE-01..06 + TEST-01..08), 5 success criteria, no upstream dependencies
- `.planning/REQUIREMENTS.md` — file-by-file purge list, test cleanup list, SAFE/DOC/REL requirements for downstream Phases 53-54
- `.planning/PROJECT.md` — v1.17 milestone scope ("Remove PERT Calculator")

### Implementation Patterns
- `src/lib/shell/registry.ts` — CALCULATOR_REGISTRY array (PERT entry removed in 52-01)
- `src/lib/shared/types.ts` — `CalculatorId` union type (drop `'pert'` in 52-02)
- `src/lib/shared/about-content.ts` — About-page calculator descriptions (drop PERT in 52-02)
- `src/app.css` — `.identity-pert` light + dark identity hue blocks (remove in 52-02)
- `src/lib/favorites/store.ts` (or wherever favoritesStore lives) — localStorage filter handles unknown IDs gracefully (preserve in 52-02)

### Test Surgery Targets
- `src/lib/shell/__tests__/registry.test.ts` — drop 'pert' assertions (52-03)
- `src/lib/shell/HamburgerMenu.test.ts` — drop PERT-specific cases (52-03)
- `src/lib/shell/CalculatorPage.test.ts` — drop PERT-specific cases (52-03)
- `src/lib/favorites/favorites.test.ts` (path TBD) — add regression test using generic literal (52-03)
- `e2e/desktop-full-nav.spec.ts:33` — `tabs.nth(4)` assertion (52-03)
- `e2e/drawer-no-autofocus.spec.ts` — route iteration array (52-03)

### Files to Delete (52-01)
- `src/lib/pert/` (14 files: PertCalculator.svelte, PertInputs.svelte, calculations.ts, config.ts, state.svelte.ts, types.ts, calculator.ts, pert-config.json, pert-parity.fixtures.json + 5 co-located *.test.ts files)
- `src/routes/pert/+page.svelte`
- `e2e/pert.spec.ts`
- `e2e/pert-a11y.spec.ts`

### Historical Comments to Generalize (52-02)
- `src/lib/fortification/calculator.ts:13` — "the PERT slice" → generic phrasing

### Prior Art (Reference Patterns)
- v1.16 calculator-store refactor (5 atomic green commits) — the model for Phase 52's 3-plan structure
- `.planning/archive/v1.15.1-*/` — archival convention for completed milestones (referenced for Phase 54, not Phase 52)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **favoritesStore filter**: Already handles unknown calculator IDs gracefully (designed for exactly this upgrade scenario — v1.16 users with 'pert' favorited get silent migration on next load). Just add a regression test.
- **CALCULATOR_REGISTRY pattern**: Registry-driven nav/routing means removing one entry cascades correctly through the shell — most UI tests only need the registry edit, not per-component edits.
- **CalculatorStore<T> singleton pattern** (from v1.16 refactor): PERT slice was already migrated to this pattern in v1.16, so its state file (`src/lib/pert/state.svelte.ts`) is a thin wrapper — deletion is clean, no orphaned global state.

### Established Patterns
- **Co-located test files** (Svelte standard, not `__tests__/` dirs) — except for the `src/lib/shell/__tests__/` exception. Delete `*.test.ts` files alongside their source in 52-01.
- **Atomic green commits** (v1.16 pattern) — each commit is independently green, enabling clean bisect.
- **Identity hue per calculator** (`.identity-{slug}` in app.css, both light + dark) — PERT has `.identity-pert` in both blocks; both must be removed.

### Integration Points
- `CALCULATOR_REGISTRY` array in `src/lib/shell/registry.ts` — single source of truth for nav, routing, favorites, about-page entries
- `CalculatorId` union type in `src/lib/shared/types.ts` — TypeScript-enforced; removing `'pert'` from the union will surface any missed references via `pnpm check`
- `src/app.css` — identity hues are CSS-only, no JS coupling
- localStorage `favorites` key — unknown IDs filtered on read, no migration code needed

</code_context>

<specifics>
## Specific Ideas

- **Prior-art commitment**: Phase 52 mirrors the v1.16 calculator-store refactor's 5-atomic-commit shape — 3 atomic commits here for a smaller surgical change. The pattern is proven; reuse it.
- **Grep gate paranoia avoided**: Word-boundary grep (`-w`) eliminates the ~400 false hits from `property`/`properties`/`expert`/etc. without maintaining an exclude list.
- **Generic test literal**: Using `'unknown-calculator-id'` instead of `'pert'` in the favorites regression test makes the test reusable for future calculator removals AND keeps the grep gate at zero PERT references in active test code.

</specifics>

<deferred>
## Deferred Ideas

- **User-facing documentation updates** (CHANGELOG mention of "PERT removed, scope narrowed to neonatal", README/About cleanup) → Phase 53 (DOC) per ROADMAP
- **Archival of v1.17 planning docs** to `.planning/archive/v1.17-pert-removal/` → Phase 54 (REL)
- **Version bump** (1.16.1 → 1.17.0) → Phase 54 (REL)
- **CI grep guardrail** (`pnpm verify:no-pert` script in package.json) — considered and rejected as over-engineered for a one-time removal
- **Pre-commit hook** blocking 'pert' substrings — rejected, adds friction without clear value
- **Data-driven test refactor** (derive expected calculators from CALCULATOR_REGISTRY) — rejected as scope creep; possible future improvement after Phase 52 ships
- **Fixing 32 pre-existing Playwright failures** (28 axe dlitem + 2 disclaimer-banner + 2 calc UI) → Phase 47 follow-up backlog (NOT Phase 52 scope)

### Reviewed Todos (not folded)
None — no todos matched Phase 52 (verified via `gsd-sdk query todo.match-phase "52"`, returned 0).

</deferred>

---

*Phase: 52-Code Purge + Test Suite Repair*
*Context gathered: 2026-05-23*
