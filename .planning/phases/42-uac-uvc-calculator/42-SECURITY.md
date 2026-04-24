---
phase: 42
slug: uac-uvc-calculator
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-23
---

# Phase 42 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| None within Phase 42 scope | Phase 42 adds client-side calculator logic (pure math), identity CSS tokens, a route shell, and Playwright/axe test specs. No network calls, no authentication, no server, no user-originated data beyond a single `weightKg` number consumed by closed-form math. The SvelteKit app is an offline-first static SPA (adapter-static). sessionStorage key `nicu_uac_uvc_state` is same-origin, ephemeral, and holds only `{ weightKg: number \| null }` — no PII, no identifier. Playwright E2E drives a local browser against `pnpm dev` (same-origin). | `weightKg` (non-identifying scalar) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-42-N/A-01 | — | Plan 42-01: calculator module + registry + identity tokens + route shell | accept | Client-side calculator; no PII, no network, no authentication surface. STRIDE categories S/T/R/I/D/E all map to network/auth surfaces that do not exist. Inherits Phase 40/41 stance. | closed |
| T-42-N/A-02 | — | Plan 42-02: UacUvcCalculator.svelte UI composition | accept | Only new runtime surface is `<input type="range">` bound to `number` — no `{@html}` (no XSS vector), `parseFloat` as the only input-parsing surface, no new PII storage. | closed |
| T-42-N/A-03 | — | Plan 42-03: E2E + axe Playwright test specs | accept | Test specs write to localStorage (same-origin, ephemeral per worker) and drive native HTML form controls. axe-core inspects DOM (no security implications). No secrets in test fixtures. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-42-01 | T-42-N/A-01, T-42-N/A-02, T-42-N/A-03 | Phase 42 introduces no trust boundary, no network endpoint, no auth path, no secret handling, no PII collection. The project is an offline-first PWA (adapter-static SPA) running clinical calculators that consume weight numbers and produce derived numbers. The threat model is **Not Applicable** for all STRIDE categories at ASVS L1, mirroring the shipped Phase 40/41 stance. | Ghislain Séguin | 2026-04-23 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-23 | 3 | 3 | 0 | /gsd-secure-phase (inline verification — threats_open: 0 at discovery) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-23
