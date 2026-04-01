# Requirements: NICU Assistant

**Defined:** 2026-03-31
**Core Value:** Clinicians can switch between NICU calculation tools instantly from a single app without losing context.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Design System

- [x] **DS-01**: Unified color tokens (Clinical Blue, BMF Amber, slate neutrals) defined as CSS custom properties in app.css
- [x] **DS-02**: Dark/light theme toggle using Tailwind CSS 4 `@custom-variant` with class-based switching
- [x] **DS-03**: FOUC prevention via inline `<script>` in app.html that reads persisted theme preference
- [x] **DS-04**: Plus Jakarta Sans loaded from Google Fonts with tabular numerics for clinical output
- [x] **DS-05**: Touch targets minimum 48px, WCAG 2.1 AA contrast ratios in both themes

### Navigation & Shell

- [x] **NAV-01**: Bottom tab bar on mobile (<768px) with icon + always-visible text label per calculator
- [x] **NAV-02**: Top horizontal nav bar on desktop (>=768px) with same items
- [x] **NAV-03**: Static calculator registry (TypeScript manifest) enabling new calculator addition with one entry + one route
- [x] **NAV-04**: iOS safe-area-inset handling for bottom nav in standalone PWA mode
- [x] **NAV-05**: Active tab state visually indicated with accessible aria-selected

### Shared Components

- [ ] **SC-01**: Unified SelectPicker using native `<dialog>`, keyboard arrow-key navigation, optional option groups
- [x] **SC-02**: Shared DisclaimerModal with single acceptance persisted in localStorage (new key: nicu_assistant_disclaimer_v1)
- [ ] **SC-03**: Shared NumericInput with decimal keyboard, wheel scroll support, min/max validation
- [ ] **SC-04**: Shared ResultsDisplay with large clinical-grade typography and aria-live announcements
- [ ] **SC-05**: Shared AboutSheet with per-calculator content via calculatorId prop
- [x] **SC-06**: Focus management and ARIA roles/states across all shared components

### PERT Calculator

- [ ] **PERT-01**: Meal mode: fat grams + lipase rate + brand/strength inputs produce capsule count
- [ ] **PERT-02**: Tube-feed mode with independent state from meal mode
- [ ] **PERT-03**: Tab switching between meal and tube-feed preserves both states
- [ ] **PERT-04**: All FDA medication brands and strengths from clinical-config.json
- [ ] **PERT-05**: Feature parity with standalone pert-calculator app

### Formula Calculator

- [ ] **FORM-01**: Modified formula mode: brand + target kcal/oz + volume produce water mL and powder grams
- [ ] **FORM-02**: BMF mode: brand + target kcal/oz + volume + baseline EBM produce EBM mL and powder grams
- [ ] **FORM-03**: Dispensing measures (scoops, packets, tbsp, tsp) displayed when available
- [ ] **FORM-04**: All 40+ formula brands from formula-config.json with manufacturer grouping
- [ ] **FORM-05**: Feature parity with standalone formula-calculator app

### Cross-Calculator

- [ ] **CC-01**: Calculator state preserved when switching between PERT and formula via nav
- [ ] **CC-02**: Each calculator's state isolated — no cross-contamination of inputs/results
- [ ] **CC-03**: Input validation on all numeric fields (prevent empty/invalid submissions)

### PWA & Offline

- [ ] **PWA-01**: Service worker with precaching of all app assets via Workbox
- [ ] **PWA-02**: Web app manifest with icons (192px, 512px, 180px apple-touch), standalone display, portrait orientation
- [ ] **PWA-03**: Active update prompt when new service worker detected (clinical safety: prevent stale formulas)
- [ ] **PWA-04**: App works fully offline after first load

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### History & Convenience

- **HIST-01**: Calculation history log per calculator
- **HIST-02**: Favorites or quick-access for common brand/strength configurations
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
| New calculators beyond PERT and formula | Architecture supports it but v1 ships with two |
| Monorepo / package splitting | Single SvelteKit app, no benefit from workspace packages |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DS-01 | Phase 1 | Complete |
| DS-02 | Phase 1 | Complete |
| DS-03 | Phase 1 | Complete |
| DS-04 | Phase 1 | Complete |
| DS-05 | Phase 1 | Complete |
| NAV-01 | Phase 1 | Complete |
| NAV-02 | Phase 1 | Complete |
| NAV-03 | Phase 1 | Complete |
| NAV-04 | Phase 1 | Complete |
| NAV-05 | Phase 1 | Complete |
| SC-01 | Phase 2 | Pending |
| SC-02 | Phase 2 | Complete |
| SC-03 | Phase 2 | Pending |
| SC-04 | Phase 2 | Pending |
| SC-05 | Phase 2 | Pending |
| SC-06 | Phase 2 | Complete |
| PERT-01 | Phase 3 | Pending |
| PERT-02 | Phase 3 | Pending |
| PERT-03 | Phase 3 | Pending |
| PERT-04 | Phase 3 | Pending |
| PERT-05 | Phase 3 | Pending |
| FORM-01 | Phase 3 | Pending |
| FORM-02 | Phase 3 | Pending |
| FORM-03 | Phase 3 | Pending |
| FORM-04 | Phase 3 | Pending |
| FORM-05 | Phase 3 | Pending |
| CC-01 | Phase 3 | Pending |
| CC-02 | Phase 3 | Pending |
| CC-03 | Phase 3 | Pending |
| PWA-01 | Phase 4 | Pending |
| PWA-02 | Phase 4 | Pending |
| PWA-03 | Phase 4 | Pending |
| PWA-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after roadmap creation*
