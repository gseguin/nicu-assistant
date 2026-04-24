# Requirements: NICU Assistant — Milestone v1.14

**Defined:** 2026-04-25
**Core Value:** Clinicians can switch between NICU calculation tools instantly from a single app without losing context.

## v1.14 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Kendamil Formula Family

- [ ] **KEND-01**: User can select **Kendamil Organic** from the formula picker — entry added to `src/lib/fortification/fortification-config.json` with manufacturer `"Kendamil"`, calorie_concentration ≈ 5.12 kcal/g (22 kcal ÷ 4.3 g per scoop), displacement_factor ≈ 0.77 mL/g (3.3 mL ÷ 4.3 g per scoop), grams_per_scoop 4.3 (sourced from hcp.kendamil.com Organic mixing chart)
- [ ] **KEND-02**: User can select **Kendamil Classic** from the formula picker — entry added with manufacturer `"Kendamil"` and spec sourced from hcp.kendamil.com Classic mixing chart (calorie_concentration, displacement_factor, grams_per_scoop computed and documented in the plan, exact values verified against the manufacturer HCP page before commit)
- [ ] **KEND-03**: User can select **Kendamil Goat** from the formula picker — entry added with manufacturer `"Kendamil"` and spec sourced from hcp.kendamil.com Goat mixing chart (calorie_concentration, displacement_factor, grams_per_scoop computed and documented in the plan, exact values verified against the manufacturer HCP page before commit)
- [ ] **KEND-04**: All three Kendamil entries are grouped under a "Kendamil" manufacturer heading in the SelectPicker grouped view (consistent with existing Abbott / Mead Johnson / Nestlé / Nutricia grouping)
- [ ] **KEND-05**: Each Kendamil entry uses the documented `packetsSupported` field correctly — set to `false` for non-HMF infant formulas (per v1.3 SelectPicker behavior that hides the Packets unit on non-HMF selection)

### Kendamil Testing & Documentation

- [ ] **KEND-TEST-01**: Spreadsheet-parity unit tests added for the three Kendamil entries — at minimum one canonical fortification calculation per variant (e.g., Target Calorie 24 kcal/oz from a known starting volume) verified against a hand-computed expected value within the 1% epsilon used by other formulas in `fortification.test.ts`
- [ ] **KEND-TEST-02**: SelectPicker grouping test extended to assert the "Kendamil" manufacturer group renders with all three variants in alphabetical-or-registry order
- [ ] **KEND-TEST-03**: Existing Playwright fortification axe sweeps re-run with a Kendamil variant selected (light + dark) to verify no contrast regressions from the new manufacturer label

### Desktop Full-Nav Divergence

- [ ] **NAV-ALL-01**: Desktop top toolbar (md+ breakpoint) renders **every registered calculator** from the registry, regardless of favorites state — split `visibleCalculators` in `NavShell.svelte` into `mobileVisibleCalculators` (favorites-driven, 4-cap) and `desktopVisibleCalculators` (registry-driven, all)
- [ ] **NAV-ALL-02**: Mobile bottom bar behavior is **unchanged** from v1.13 — still favorites-driven, still 4-cap, still hamburger-managed (no regressions to Phase 41 NAV-FAV-01..04)
- [ ] **NAV-ALL-03**: Desktop top toolbar preserves all v1.13 visual contracts — identity color indicators (`identityClass`, border-b-2 on active), focus-visible outlines, `aria-current="page"` on the active route, 48px touch targets
- [ ] **NAV-ALL-04**: Hamburger menu button remains visible on desktop (md+) so users can re-read the disclaimer / open AboutSheet via the existing v1.13 NAV-FAV-04 routing
- [ ] **NAV-ALL-05**: Desktop layout reflows gracefully at common widths (768px / 1024px / 1280px) — no horizontal overflow, no truncated labels, no layout shift on hydration; tested at all 5 currently-registered calculators

### Desktop Full-Nav Testing

- [ ] **NAV-ALL-TEST-01**: Playwright E2E spec at desktop 1280 verifies all 5 registered calculators are visible in the top toolbar regardless of favorites state (toggle a non-favorite calculator off via hamburger, assert it remains in the desktop top bar but disappears from mobile bottom bar at 375)
- [ ] **NAV-ALL-TEST-02**: Component / Vitest spec for `NavShell` covers the new `desktopVisibleCalculators` derived computation — asserts it equals the full registry order regardless of `favorites.current` state (including 0 favorites edge case)
- [ ] **NAV-ALL-TEST-03**: Playwright axe sweep extended to cover the desktop top toolbar with all 5 calculators rendered (light + dark) — no contrast regressions from added calculator labels

### Release v1.14.0

- [ ] **REL-01**: `package.json` version bumped to `1.14.0`; AboutSheet automatically reflects v1.14.0 via the `__APP_VERSION__` build-time constant
- [ ] **REL-02**: PROJECT.md Validated list updated with v1.14 entries (KEND-*, NAV-ALL-*, REL-*) at milestone completion
- [ ] **REL-03**: REQUIREMENTS.md traceability table flipped to ✓ Validated for all v1.14 IDs; ROADMAP.md Progress markers complete; full clinical gate green (svelte-check 0/0, vitest green, `pnpm build` ✓, Playwright E2E + extended axe suite green in both themes)

## Future Requirements

Deferred to later milestones:

- Raise mobile favorites cap from 4 to N (only if a 6th+ calculator is added that doesn't fit the 4-cap default)
- Hide hamburger button on desktop (would require relocating the AboutSheet trigger)
- Additional non-Kendamil formula brands (no current request)
- Kendamil HMF / fortifier variants (current request is infant formulas only)

## Out of Scope

Explicit exclusions for v1.14:

- **Mobile bottom bar visual change** — explicitly unchanged per user direction, mobile stays favorites-driven
- **About-link relocation off the hamburger menu** — out of scope; v1.13 NAV-FAV-04 routing is preserved
- **DESIGN.md / DESIGN.json contract changes** — no new tokens, no rule additions; the v1.13 design contract holds
- **New identity hue** — no new calculators added (only formula entries), so no new `--color-identity-*` tokens
- **Kendamil-specific UI treatment** — Kendamil entries use the existing fortification UI, no special branding or layout
- **Native app builds** — PWA only (project-level constraint)

## Traceability

| Requirement ID | Phase | Status |
|---|---|---|
| KEND-01 | TBD | Pending |
| KEND-02 | TBD | Pending |
| KEND-03 | TBD | Pending |
| KEND-04 | TBD | Pending |
| KEND-05 | TBD | Pending |
| KEND-TEST-01 | TBD | Pending |
| KEND-TEST-02 | TBD | Pending |
| KEND-TEST-03 | TBD | Pending |
| NAV-ALL-01 | TBD | Pending |
| NAV-ALL-02 | TBD | Pending |
| NAV-ALL-03 | TBD | Pending |
| NAV-ALL-04 | TBD | Pending |
| NAV-ALL-05 | TBD | Pending |
| NAV-ALL-TEST-01 | TBD | Pending |
| NAV-ALL-TEST-02 | TBD | Pending |
| NAV-ALL-TEST-03 | TBD | Pending |
| REL-01 | TBD | Pending |
| REL-02 | TBD | Pending |
| REL-03 | TBD | Pending |

**Coverage:**
- v1.14 requirements: 19 total
- Mapped to phases: 0 (filled by roadmapper)

---
*Requirements defined: 2026-04-25*
