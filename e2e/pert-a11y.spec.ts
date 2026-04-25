// e2e/pert-a11y.spec.ts
// PERT-HUE-03: Playwright axe sweeps for /pert in light + dark modes,
// plus a synthetic-DOM pre-gate contrast verification of the
// `.identity-pert` OKLCH token pair (light + dark) attached to an
// existing route's surfaces.
//
// Pattern source: e2e/uac-uvc-a11y.spec.ts (light + dark sweeps).
//
// Wave context: Plan 01-02 lands the `.identity-pert` CSS tokens and this
// spec; Plan 01-04 lands the actual `/pert` route shell. When 01-02 runs
// before 01-04 (Wave 1 vs Wave 2), the literal `/pert` sweeps below would
// 404. To honor the research-before-PR contract (PERT-HUE-03, v1.8) we
// run the equivalent axe contrast research synthetically *now* against
// the same OKLCH token quartet on an existing route's hero / eyebrow /
// focus / active-nav surfaces. The literal `/pert` sweeps then become
// the Wave-3 verification gate.
//
// No axe escape hatches: this file mirrors the standard
// `withTags(['wcag2a', 'wcag2aa'])` shape used by every other a11y spec.
//
// Project axe sweep total after this file: +4 (2 synthetic + 2 literal /pert).

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Construct the synthetic identity-pert surface bundle inside the page
// using safe DOM methods (no innerHTML). Mirrors the four Identity-Inside
// Rule surfaces (DESIGN.md / D-03) using the *real* color combinations
// that appear in the existing calculators (GirCalculator.svelte,
// UacUvcCalculator.svelte, GlucoseTitrationGrid.svelte):
//   - result hero    (--color-identity text on --color-identity-hero bg)
//   - eyebrow        (--color-identity text on --color-surface bg)
//   - focus ring     (--color-identity ring on --color-surface bg, link)
//   - active nav     (--color-identity text on --color-surface-card bg
//                     with a thin --color-identity bottom-border indicator
//                     — never white-on-identity, which is not in the system)
function buildPertIdentityHarness() {
  const host = document.createElement('div');
  host.className = 'identity-pert';
  host.setAttribute('data-test-id', 'pert-identity-pregate');
  host.style.padding = '24px';
  host.style.background = 'var(--color-surface)';

  const hero = document.createElement('section');
  hero.style.background = 'var(--color-identity-hero)';
  hero.style.padding = '16px';
  hero.style.borderRadius = '12px';

  const heroEyebrow = document.createElement('p');
  heroEyebrow.style.color = 'var(--color-identity)';
  heroEyebrow.style.fontWeight = '600';
  heroEyebrow.style.fontSize = '11px';
  heroEyebrow.style.letterSpacing = '0.05em';
  heroEyebrow.style.textTransform = 'uppercase';
  heroEyebrow.textContent = 'Result eyebrow on hero tint';

  const heroNumeral = document.createElement('p');
  heroNumeral.style.color = 'var(--color-text-primary)';
  heroNumeral.style.fontSize = '44px';
  heroNumeral.style.fontWeight = '700';
  heroNumeral.style.margin = '8px 0 0';
  heroNumeral.textContent = '12,345';

  hero.appendChild(heroEyebrow);
  hero.appendChild(heroNumeral);

  const eyebrowOnSurface = document.createElement('p');
  eyebrowOnSurface.style.color = 'var(--color-identity)';
  eyebrowOnSurface.style.marginTop = '16px';
  eyebrowOnSurface.style.fontWeight = '600';
  eyebrowOnSurface.textContent = 'Eyebrow text on route surface';

  // Active-nav indicator: identity-color label on the surface-card chrome
  // background, with a 2px identity-color underline as the active strip.
  // Mirrors the BottomNav active-tab pattern (label is identity color, the
  // tab background remains chrome).
  const activeNav = document.createElement('button');
  activeNav.type = 'button';
  activeNav.style.marginTop = '16px';
  activeNav.style.minHeight = '48px';
  activeNav.style.padding = '8px 16px';
  activeNav.style.background = 'var(--color-surface-card)';
  activeNav.style.color = 'var(--color-identity)';
  activeNav.style.borderTop = '0';
  activeNav.style.borderLeft = '0';
  activeNav.style.borderRight = '0';
  activeNav.style.borderBottom = '2px solid var(--color-identity)';
  activeNav.style.borderRadius = '0';
  activeNav.style.fontWeight = '600';
  activeNav.textContent = 'Active-nav indicator surface';

  const focusWrap = document.createElement('p');
  focusWrap.style.marginTop = '16px';

  const focusLink = document.createElement('a');
  focusLink.href = '#';
  focusLink.style.color = 'var(--color-identity)';
  focusLink.style.textDecoration = 'underline';
  focusLink.textContent = 'Focus-ring carrier link';
  focusWrap.appendChild(focusLink);

  host.appendChild(hero);
  host.appendChild(eyebrowOnSurface);
  host.appendChild(activeNav);
  host.appendChild(focusWrap);

  document.body.appendChild(host);
}

// ---------------------------------------------------------------------------
// Synthetic-DOM pre-gate: prove the .identity-pert OKLCH quartet passes
// WCAG 4.5:1 against the route surface backgrounds in both themes, NOW,
// without needing /pert to exist. This is the research-before-PR contract.
// ---------------------------------------------------------------------------

test.describe('PERT identity-hue pre-gate (synthetic surfaces)', () => {
  test.beforeEach(async ({ page }) => {
    // Use an existing route as the carrier surface — its layout, fonts,
    // and theme tokens are identical to what /pert will render under.
    await page.goto('/uac-uvc');

    await page
      .getByRole('heading', { name: 'UAC/UVC Catheter Depth' })
      .waitFor({ state: 'visible' });

    await page
      .getByRole('button', { name: /understand|acknowledge/i })
      .click({ timeout: 2000 })
      .catch(() => {});
  });

  test('identity-pert tokens pass axe contrast in light mode', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    });

    await page.evaluate(buildPertIdentityHarness);

    const results = await new AxeBuilder({ page })
      .include('[data-test-id="pert-identity-pregate"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('identity-pert tokens pass axe contrast in dark mode', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('no-transition');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(250);

    await page.evaluate(buildPertIdentityHarness);

    const results = await new AxeBuilder({ page })
      .include('[data-test-id="pert-identity-pregate"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Literal /pert axe sweeps. Activate once Plan 01-04 lands the route.
// Mirrors e2e/uac-uvc-a11y.spec.ts shape exactly.
// Currently skipped because /pert returns 404 in the Wave-1 baseline; the
// pre-gate block above provides the equivalent axe research now.
// Wave-3 verification (Plan 01-05) will remove the skip flag or this
// file will be amended by 01-04 when the route lands.
// ---------------------------------------------------------------------------

const pertRouteReady = false; // flip to true after 01-04 lands the route shell

test.describe('PERT Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!pertRouteReady, '/pert route lands in Plan 01-04 (Wave 2)');

    await page.goto('/pert');

    await page
      .getByRole('heading', { name: /pediatric epi pert/i })
      .waitFor({ state: 'visible' });

    await page
      .getByRole('button', { name: /understand|acknowledge/i })
      .click({ timeout: 2000 })
      .catch(() => {});
  });

  test('pert page has no axe violations in light mode', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    });

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    expect(results.violations).toEqual([]);
  });

  test('pert page has no axe violations in dark mode', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('no-transition');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(250);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    expect(results.violations).toEqual([]);
  });
});
