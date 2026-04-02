# Requirements: NICU Assistant

**Defined:** 2026-04-02
**Core Value:** Clinicians can switch between NICU calculation tools instantly from a single app without losing context.

## v1.2 Requirements

Requirements for UI polish milestone. Each maps to roadmap phases.

### Navigation Layout

- [ ] **NAV-06**: Info (about) button and theme toggle are in the top title/header bar, not in the bottom tab bar
- [ ] **NAV-07**: Calculator tab buttons (Morphine Wean, Formula) fill the full width of the bottom navigation on mobile
- [ ] **NAV-08**: Top title bar displays app name alongside info and theme toggle buttons on both mobile and desktop
- [ ] **NAV-09**: Desktop layout remains functional — info and theme toggle accessible in the top nav bar

### UI Critique & Polish

- [ ] **UX-01**: Run Impeccable /critique skill against the live dev server using Playwright MCP to assess visual hierarchy, layout, and overall UX quality
- [ ] **UX-02**: Implement all recommendations from the Impeccable critique
- [ ] **UX-03**: Run all suggested follow-up Impeccable commands (e.g., /polish, /typeset, /arrange) and implement their recommendations

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### History & Convenience

- **HIST-01**: Calculation history log per calculator
- **HIST-02**: Favorites or quick-access for common configurations
- **CONV-01**: Search/filter across tools (relevant only when tool count exceeds 5)

### Native

- **NAT-01**: Capacitor iOS build
- **NAT-02**: Capacitor Android build

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Anonymous clinical tool, no user data stored |
| Backend API | All clinical data embedded at build time |
| Analytics / telemetry | Clinical privacy concerns |
| New calculators | v1.2 is polish only, no new features |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-06 | Phase 7 | Pending |
| NAV-07 | Phase 7 | Pending |
| NAV-08 | Phase 7 | Pending |
| NAV-09 | Phase 7 | Pending |
| UX-01 | Phase 8 | Pending |
| UX-02 | Phase 8 | Pending |
| UX-03 | Phase 8 | Pending |

**Coverage:**
- v1.2 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after roadmap creation*
