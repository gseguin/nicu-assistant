# Feature Landscape

**Domain:** Unified multi-calculator clinical PWA (NICU point-of-care tool)
**Researched:** 2026-03-31
**Confidence:** HIGH for table stakes; MEDIUM for differentiators (validated against MDCalc, NicuApp, CliniCalc, and clinical UX research)

---

## Table Stakes

Features users expect. Missing = product feels broken or unsafe.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Responsive navigation: bottom tab bar on mobile, top/side on desktop | Standard PWA pattern; 75% of users operate phones one-handed — bottom bar puts tools in thumb zone. Clinical apps without this pattern feel like websites, not tools. | Medium | Break at ~768px. Bottom bar on mobile, horizontal top nav on desktop. Always show labels alongside icons — research shows labeled tabs drive 75% higher engagement than icon-only. |
| Single shared medical disclaimer, accepted once | Legal minimum for clinical decision-support tools. MDCalc, CliniCalc, every major clinical calculator uses a one-time disclaimer gate. Per-calculator disclaimers create friction with no added safety value. | Low | Persist acceptance in `localStorage`. Re-show only on app update that changes clinical logic (version-gated). A missed disclaimer is a legal exposure; a repeated one is abandoned. |
| Full offline operation with no degradation | NICU has basement isolation rooms, thick walls, ICU pods with zero connectivity. A calculator that fails offline is clinically useless at exactly the wrong moment. | Medium | App shell + cache-first service worker via `@vite-pwa/sveltekit`. Since there is no backend and all clinical data is JSON-embedded at build time, offline is the natural state — just needs correct Workbox config. |
| PWA installability (add to home screen) | Clinical staff install tools they trust to the home screen so they are one tap away during rounds. Non-installable tools get bookmarked at best, abandoned at worst. | Low | Requires `manifest.json` with correct `display: standalone`, icon set, and `beforeinstallprompt` capture. Show a contextual install prompt after first successful calculation — not on first load. |
| Dark and light theme toggle with persistence | PERT users already have dark mode. NICU rooms use dim lighting to protect premature infants — dark mode is a clinical environment requirement, not a cosmetic preference. Light mode is needed for bright workstation contexts. | Low | Use `prefers-color-scheme` as default, allow manual override, persist in `localStorage`. Pattern: check stored preference first, then system, then default to dark. |
| Input validation with physiologic range enforcement | 91% of clinical calculator apps lack numeric input validation (PMC4433091). Missing this means apps accept negative weights, impossible gestational ages, etc. This is the single most studied failure mode in clinical calculator safety literature. | Low | Enforce min/max on every numeric field. Show inline errors (not alerts) immediately. Block calculation when required fields are empty — do not silently treat empty as zero. |
| Real-time output synchronization | 37% of clinical calculator apps fail to update outputs when inputs change (PMC4433091). In a clinical context, stale output causes dosing errors. | Low | Already handled by Svelte 5 `$derived` runes in existing calculators — must be preserved in unified app shell. |
| Shared design system (tokens, typography, spacing) | Inconsistent visual language between calculators makes the app feel like two tools glued together. Clinicians lose trust in tools that feel cobbled together. | Medium | Unify Tailwind CSS 4 `@theme` custom properties. Single color token set covering Clinical Blue + BMF Amber palettes. Single font (Plus Jakarta Sans). 48px minimum touch targets everywhere. |
| WCAG 2.1 AA accessibility | Point-of-care use in gloves, under stress, in dim environments is already an accessibility edge case. Screen reader support is a regulatory baseline; keyboard nav is a clinical workstation requirement. | Medium | ARIA live regions for calculation results, focus management on modal open/close, 48px touch targets, visible focus rings. Existing apps already have this — must not regress. |
| Service worker update notification | Stale cached apps silently serve old clinical logic after a formula update. Clinicians must know when the app has updated. | Low | Show a non-intrusive banner: "A new version is available — tap to reload." Don't auto-reload during active use. |

---

## Differentiators

Features that set this product apart. Not expected, but valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Plugin-like calculator registry | Adding a new calculator (fluid balance, growth chart, TPN dosing) requires defining one config object and a component — no changes to nav, shell, or routing code. This is what makes NICU Assistant a platform, not a two-tool app. | Medium | A `calculators` array drives navigation, routing, and the tab bar. Each entry declares: `id`, `label`, `icon`, `route`, `component`. Roadmap item, not a user-facing feature, but a strategic differentiator. |
| Calculator context preservation on tab switch | Switching from PERT to Formula and back restores the previous inputs. Clinical workflow involves looking up a formula dose while mid-way through a PERT calculation — losing state forces re-entry and increases error risk. | Medium | Svelte stores or URL-encoded state. Component `keep-alive` equivalent via conditional rendering with `display: none` rather than unmounting. |
| Contextual install prompt after first use | Prompting installation after a successful calculation — not on first page load — converts users who already trust the tool. Clinical staff respond to "install this to get faster access" at the point of demonstrated value. | Low | Defer `beforeinstallprompt` event, show custom prompt after the first calculation result is displayed. |
| Network status indicator | Visible but non-disruptive indicator showing "offline" state. Clinicians need to know the app is running from cache, not because the underlying data is stale (it isn't — data is build-time embedded) but to build trust in offline operation. | Low | Small pill indicator in nav bar. Only visible when actually offline. No persistent "you're online" noise. |
| Standalone display mode with safe-area insets | Installed PWA in standalone mode removes browser chrome. Without correct safe-area handling on iOS, the bottom nav bar collides with the home indicator. This is a polish signal — apps that handle it correctly feel native. | Low | `env(safe-area-inset-bottom)` padding on the bottom nav. Already needed; notable because many PWAs ship without it and look broken. |
| About / version info sheet | Clinical tools are used in regulated environments. Staff need to know which version of the app they are using, which formulas are implemented, and where to report issues. | Low | "About" bottom sheet accessible from nav or settings. Include: app version, formula sources/references, disclaimer text, contact/feedback link. Already exists as `AboutSheet` in both source apps — needs unification. |

---

## Anti-Features

Features to explicitly NOT build. These would harm the product.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Per-calculator disclaimers | Creates friction on every tool switch. Clinicians abandon tools that nag them. The single shared disclaimer already provides legal cover. | One shared disclaimer accepted once, persisted across sessions. |
| Search / discovery UI for calculators | With 2 calculators (v1), a search box is engineering theater. MDCalc needs search because it has 900+ tools. A search bar for 2 tools signals the team doesn't know what they're building. | Direct tab navigation. Add search only when calculator count exceeds ~7-10. |
| Favorites / recently used lists | Same reason as search — premature optimization for a 2-calculator app. The bottom tab bar IS the recently used list when there are only 2 items. | Tab-based navigation. Revisit at 5+ calculators. |
| User accounts or authentication | This is an anonymous bedside tool. Login adds latency, requires backend infrastructure, creates HIPAA surface area, and solves no problem the tool currently has. | Stay anonymous. Persist only: disclaimer acceptance, theme preference, last-used tab. All in `localStorage`. |
| Analytics / telemetry / crash reporting | Clinical privacy concerns outweigh operational visibility. Even anonymized usage data requires consent flows in clinical environments. | Structured error boundaries with visible fallback UI. Rely on direct user feedback. |
| Patient data input or storage | Calculators take clinical parameters (weight, gestational age, formula type) — not patient identifiers. Storing any patient-associated data creates HIPAA obligations with no benefit. | Never prompt for patient name, MRN, or identifying fields. Inputs are ephemeral — cleared on session end is fine. |
| Push notifications | No server, no persistent state, no events to notify about. Push notification infra on a static tool is complexity with zero payoff. | If a "formula updated" event is needed, the service worker update notification banner is sufficient. |
| Onboarding tour or walkthroughs | Clinical users are trained staff under time pressure. Tutorials that gate access to tools cause abandonment. Trust is earned by the tool working correctly, not by explaining it. | Invest in clarity of the UI itself. Use tooltips or inline help text for genuinely ambiguous fields. |
| App store submission (Capacitor / native) | Out of scope for v1 per PROJECT.md. Cross-platform native adds build complexity, signing overhead, and App Store review latency that PWA bypasses. | PWA install via browser is sufficient. Native wrapper is a future milestone, not v1 scope. |
| Feature flags or A/B testing | No analytics (see above), no user accounts, no backend. Feature flags have nowhere to live and nothing to measure. | Deliberate feature selection before shipping. |

---

## Feature Dependencies

```
Plugin calculator registry
  └── Tab-bar navigation (registry drives nav items)
  └── Route structure (registry drives SvelteKit routes)
  └── Shared design system (calculators consume shared components)

Shared design system (tokens, typography)
  └── Dark/light theme toggle (theme tokens must be unified before toggle works correctly)
  └── WCAG accessibility (focus rings, contrast ratios defined in token layer)

Single shared disclaimer
  └── localStorage persistence (acceptance stored there)
  └── Service worker update notification (new version clears acceptance flag if clinical logic changed)

Offline operation (service worker)
  └── Service worker update notification (both use the SW lifecycle)
  └── PWA installability (requires SW registration)

Input validation
  └── Real-time output sync (validation gates whether $derived recalculates)
```

---

## MVP Recommendation

**Ship in v1:**

1. Responsive navigation (bottom mobile / top desktop) with plugin registry powering the tab bar — this is the core of the unified app
2. Shared design system — theme toggle, unified tokens, Plus Jakarta Sans — prerequisite for everything else looking coherent
3. Single shared disclaimer with `localStorage` persistence — non-negotiable legal/safety baseline
4. Full offline operation — cache-first service worker, no degradation without network
5. PWA installability with deferred install prompt after first calculation
6. Input validation with range enforcement — the most critical safety gap in the clinical calculator literature
7. Service worker update notification — trust signal for clinical staff
8. Network status indicator — low cost, high trust value
9. Calculator context preservation on tab switch — the key UX differentiator over two separate apps

**Defer to post-v1:**

- Search and discovery UI — add at 7+ calculators
- Favorites and recently used — add at 5+ calculators
- Native app builds (Capacitor) — explicit out-of-scope
- Explore/personalized suggestions (MDCalc-style) — not relevant at this scale

---

## Sources

- MDCalc feature set: https://www.mdcalc.com and https://play.google.com/store/apps/details?id=com.mdaware.mdcalc
- Clinical calculator safety gaps (insulin app systematic review): https://pmc.ncbi.nlm.nih.gov/articles/PMC4433091/
- Bottom navigation UX research: https://www.smashingmagazine.com/2019/08/bottom-navigation-pattern-mobile-web-pages/
- Healthcare PWA offline patterns: https://dev.to/crisiscoresystems/building-a-healthcare-pwa-that-actually-works-when-it-matters-md4
- Medical software UX design principles: https://www.devicelab.com/blog/medical-software-ux-design-a-complete-guide/
- PWA sticky elements and navigation: https://www.smashingmagazine.com/2020/01/mobile-pwa-sticky-bars-elements/
- PWA app design (web.dev): https://web.dev/learn/pwa/app-design
- PWA install prompt: https://web.dev/articles/customize-install
- NICU clinical tools and point-of-care apps: https://iap-kpj.org/apps-in-neonatology/ and http://www.ubqo.com/nicuapp
- MDCalc disclaimer reference: https://www.mdcalc.com/disclaimer
- FDA clinical decision support guidance (2026): https://www.aha.org/news/headline/2026-01-06-fda-issues-guidance-wellness-products-clinical-decision-support-software
