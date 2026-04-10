# Phase 39: Release v1.12.0 - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** auto (all decisions are recommended defaults — review before planning if needed)

<domain>
## Phase Boundary

Version bump to 1.12.0, PROJECT.md validated list update with all v1.12 entries, favicon generation at all standard sizes, and final gate verification (svelte-check, vitest, Playwright, axe-core, pnpm build).

**Not in scope:** New features, UI changes, or calculation modifications — those were Phases 36-38.

</domain>

<decisions>
## Implementation Decisions

### Version Bump
- **D-01:** Update `package.json` version from `1.11.0` to `1.12.0`. AboutSheet reflects this automatically via the `__APP_VERSION__` build-time constant — no manual update needed.

### PROJECT.md Validated List
- **D-02:** Move all v1.12 requirements to the Validated section with phase references:
  - Phase 36: ARCH-01 through ARCH-07, HUE-01 through HUE-03 (scaffolding + identity hue)
  - Phase 37: CORE-09, FREQ-04, FULL-04 through FULL-07, SAFE-06, TEST-01 through TEST-04 (pure logic + config + parity tests)
  - Phase 38: CORE-01 through CORE-08, FREQ-01/02/03/05, IV-01/02/03, FULL-01/02/03, SAFE-01 through SAFE-05, TEST-05/06/07 (UI + state + tests)
  - Phase 39: REL-01 through REL-04 (this release phase)
- **D-03:** Update PROJECT.md Current State section to reflect v1.12.0 shipped status with summary of what was delivered.

### Favicon
- **D-04:** Generate a distinct, recognizable favicon. Design approach: a simple, clean icon that conveys "clinical tool" or "NICU" — consider a stylized baby icon or medical cross rendered at high resolution, then exported at all required sizes.
- **D-05:** Replace all existing favicon files in `static/`:
  - `favicon.png` — 32×32 (browser tab)
  - `apple-touch-icon.png` — 180×180 (iOS home screen)
  - `pwa-192x192.png` — 192×192 (PWA manifest)
  - `pwa-512x512.png` — 512×512 (PWA manifest + maskable)
- **D-06:** Favicon must render correctly at small sizes (16×16 in browser tab) — keep the design simple with high contrast. Use the app's clinical blue (`oklch(50% 0.13 220)`) as the primary color.

### Final Gates
- **D-07:** All gates must pass before release is considered complete:
  - `pnpm exec svelte-check` — 0 errors, 0 warnings
  - `pnpm test --run` — all tests green (currently 228)
  - `pnpm exec playwright test` — all tests green
  - `pnpm build` — succeeds without errors
- **D-08:** If any Playwright tests fail (E2E or axe-core), fix them before marking release complete. The 20/20 axe-core target must be confirmed.

### Claude's Discretion
- Exact favicon design within the "clinical tool" theme
- Whether to use a programmatic SVG-to-PNG pipeline or manually created PNGs
- Exact wording for PROJECT.md Current State update
- Order of validated entries in PROJECT.md

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Version + Build
- `package.json` — version field to update
- `vite.config.ts` — PWA manifest icons configuration (confirms required sizes)
- `src/app.html` — favicon link tag

### Existing Favicon Files
- `static/favicon.png` — current 32×32 (blank/white-square, to replace)
- `static/apple-touch-icon.png` — current 180×180
- `static/pwa-192x192.png` — current 192×192
- `static/pwa-512x512.png` — current 512×512

### Documentation
- `.planning/PROJECT.md` — Validated section + Current State to update
- `.planning/REQUIREMENTS.md` — Source of v1.12 requirement IDs and descriptions

### Prior Release Patterns
- Phase 31 (v1.9), Phase 34 (v1.10), Phase 35 (v1.11) — release phase patterns in git history

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `__APP_VERSION__` build-time constant — automatically reads from `package.json`, no manual AboutSheet update needed
- Existing favicon infrastructure in `static/` and `src/app.html` — just replace the files

### Integration Points
- `package.json` version field
- `static/` directory for favicon files
- `.planning/PROJECT.md` for validated list

</code_context>

<specifics>
## Specific Ideas

- The existing favicon files are blank/white-square placeholders — REL-03 specifically calls for replacing them with a "distinct, recognizable" icon.
- Prior releases (v1.9, v1.10, v1.11) all followed the same pattern: version bump → PROJECT.md update → final gates → commit. This phase follows that exact pattern plus the favicon addition.
- The 20/20 axe-core target in success criterion 4 needs to be confirmed by running the full Playwright suite including all axe sweeps.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 39-release-v1.12.0*
*Context gathered: 2026-04-10*
