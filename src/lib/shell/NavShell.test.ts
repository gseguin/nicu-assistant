import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import NavShell from './NavShell.svelte';
import { favorites } from '$lib/shared/favorites.svelte.js';

// Mutable page mock — tests override pathname per-test
const mockPage = { url: { pathname: '/morphine-wean' } };
vi.mock('$app/state', () => ({ get page() { return mockPage; } }));

beforeEach(() => {
  localStorage.clear();
  mockPage.url.pathname = '/morphine-wean';
  // D-20 (pert workstream Phase 1): defaults are alphabetical first 4 registry entries.
  favorites.init(); // seeds defaults: ['feeds','formula','gir','morphine-wean']
});

// NavShell is difficult to render in jsdom (requires SvelteKit routing context).
// These tests verify the component's structural properties via source analysis.
const navShellSource = readFileSync(
  resolve(process.cwd(), 'src/lib/shell/NavShell.svelte'),
  'utf-8'
);

// Tailwind class ordering is governed by prettier-plugin-tailwindcss and can
// shift on format. These assertions check token presence, not source order.
function classAttrContainsAll(source: string, required: readonly string[]): boolean {
  const attrRegex = /class="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(source)) !== null) {
    const tokens = new Set(match[1].split(/\s+/));
    if (required.every((t) => tokens.has(t))) return true;
  }
  return false;
}

const BOTTOM_NAV_ATTR = /class="[^"]*\bfixed\b[^"]*\bbottom-0\b[^"]*"/;

describe('NavShell structure (v1.2 restructure)', () => {
  it('has a sticky top header with z-10', () => {
    expect(classAttrContainsAll(navShellSource, ['sticky', 'top-0', 'z-10'])).toBe(true);
  });

  it('top header contains app name "NICU Assist"', () => {
    expect(navShellSource).toContain('NICU Assist');
  });

  it('hamburger and theme buttons are in the header, not the bottom nav', () => {
    const bottomNavMatch = BOTTOM_NAV_ATTR.exec(navShellSource);
    expect(bottomNavMatch).not.toBeNull();

    const headerSection = navShellSource.slice(0, bottomNavMatch!.index);
    const bottomNavSection = navShellSource.slice(bottomNavMatch!.index);

    expect(headerSection).toContain('Open calculator menu');
    expect(headerSection).toContain('theme.toggle');

    expect(bottomNavSection).not.toContain('Open calculator menu');
    expect(bottomNavSection).not.toContain('theme.toggle');
  });

  it('bottom nav is fixed, has z-10, and is hidden on md+', () => {
    expect(classAttrContainsAll(navShellSource, ['fixed', 'bottom-0', 'z-10', 'md:hidden'])).toBe(
      true
    );
  });

  it('bottom nav tabs use flex-1 for full width', () => {
    const bottomNavMatch = BOTTOM_NAV_ATTR.exec(navShellSource);
    expect(bottomNavMatch).not.toBeNull();

    const bottomNavSection = navShellSource.slice(bottomNavMatch!.index);
    expect(bottomNavSection).toContain('flex-1');
  });

  it('desktop nav is hidden on mobile (hidden md:flex)', () => {
    expect(classAttrContainsAll(navShellSource, ['hidden', 'md:flex'])).toBe(true);
  });
});

describe('NavShell — favorites-driven rendering (Phase 41)', () => {

  it('T-01 default favorites (4): bottom nav renders 4 tabs in alphabetical default order', async () => {
    const { container } = render(NavShell);
    await tick();
    // Phase 45: desktop nav now renders the full registry while mobile renders favorites.
    // `:last-of-type` is unreliable across parents (desktop is in <header>, mobile at body) —
    // switch to index-based selection: navs[0] = desktop (in header), navs[1] = mobile bottom bar.
    const navs = container.querySelectorAll('nav[aria-label="Calculator navigation"]');
    const bottomNav = navs[navs.length - 1]!;
    const tabs = bottomNav.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(4);
    // D-20: alphabetical first 4 registry entries.
    expect(tabs[0].textContent).toMatch(/Feeds/i);
    expect(tabs[1].textContent).toMatch(/Formula/i);
    expect(tabs[2].textContent).toMatch(/GIR/i);
    expect(tabs[3].textContent).toMatch(/Morphine/i);
  });

  it('T-02 reduced favorites (morphine-wean + formula): bottom nav renders 2 tabs', async () => {
    localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula'] }));
    favorites.init();
    const { container } = render(NavShell);
    await tick();
    // Phase 45: desktop nav now renders the full registry while mobile renders favorites.
    // `:last-of-type` is unreliable across parents (desktop is in <header>, mobile at body) —
    // switch to index-based selection: navs[0] = desktop (in header), navs[1] = mobile bottom bar.
    const navs = container.querySelectorAll('nav[aria-label="Calculator navigation"]');
    const bottomNav = navs[navs.length - 1]!;
    const tabs = bottomNav.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(2);
    expect(tabs[0].textContent).toMatch(/Morphine/i);
    expect(tabs[1].textContent).toMatch(/Formula/i);
  });

  it('T-03 zero favorites: bottom nav renders no tabs and throws no error', async () => {
    // Phase 45: desktop nav is registry-driven (always 5) — only the bottom (mobile)
    // nav is favorites-driven, so the zero-tabs assertion is scoped to it.
    favorites.toggle('morphine-wean');
    favorites.toggle('formula');
    favorites.toggle('gir');
    favorites.toggle('feeds');
    const { container } = render(NavShell);
    await tick();
    const navs = container.querySelectorAll('nav[aria-label="Calculator navigation"]');
    const bottomNav = navs[navs.length - 1]!;
    const bottomTabs = bottomNav.querySelectorAll('[role="tab"]');
    expect(bottomTabs).toHaveLength(0);
  });

  it('T-04 active route matches favorited tab: that tab has aria-selected=true', async () => {
    mockPage.url.pathname = '/gir';
    const { container } = render(NavShell);
    await tick();
    const allTabs = container.querySelectorAll('[role="tab"]');
    const selectedTabs = Array.from(allTabs).filter((t) => t.getAttribute('aria-selected') === 'true');
    expect(selectedTabs.length).toBeGreaterThanOrEqual(1);
    expect(selectedTabs.some((t) => t.textContent?.match(/GIR/i))).toBe(true);
  });

  it('T-05 non-favorited active route: no tab has aria-selected=true (NAV-FAV-03)', async () => {
    localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula', 'gir'] }));
    favorites.init();
    mockPage.url.pathname = '/feeds';
    const { container } = render(NavShell);
    await tick();
    // Both nav bars (desktop + mobile) render tabs; check each renders 3 (feeds excluded)
    // Phase 45: desktop nav now renders the full registry while mobile renders favorites.
    // `:last-of-type` is unreliable across parents (desktop is in <header>, mobile at body) —
    // switch to index-based selection: navs[0] = desktop (in header), navs[1] = mobile bottom bar.
    const navs = container.querySelectorAll('nav[aria-label="Calculator navigation"]');
    const bottomNav = navs[navs.length - 1]!;
    const bottomTabs = bottomNav.querySelectorAll('[role="tab"]');
    expect(bottomTabs).toHaveLength(3); // feeds is not rendered in bottom bar
    const selected = Array.from(bottomTabs).filter((t) => t.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(0);
  });

  it('T-06 stored order preserved verbatim: tabs render in the order the user stored (D-21)', async () => {
    // D-21 (pert workstream Phase 1): recover() no longer re-sorts by registry order.
    // The stored order — including any non-alphabetical user-chosen order — is honored as-is.
    localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['feeds', 'gir', 'formula', 'morphine-wean'] }));
    favorites.init();
    const { container } = render(NavShell);
    await tick();
    // Phase 45: desktop nav now renders the full registry while mobile renders favorites.
    // `:last-of-type` is unreliable across parents (desktop is in <header>, mobile at body) —
    // switch to index-based selection: navs[0] = desktop (in header), navs[1] = mobile bottom bar.
    const navs = container.querySelectorAll('nav[aria-label="Calculator navigation"]');
    const bottomNav = navs[navs.length - 1]!;
    const tabs = bottomNav.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(4);
    expect(tabs[0].textContent).toMatch(/Feeds/i);
    expect(tabs[1].textContent).toMatch(/GIR/i);
    expect(tabs[2].textContent).toMatch(/Formula/i);
    expect(tabs[3].textContent).toMatch(/Morphine/i);
  });

});

describe('NavShell — desktop full-nav divergence (Phase 45)', () => {

  it('T-07 default favorites (4): desktop nav still renders all 5 calculators', async () => {
    const { container } = render(NavShell);
    await tick();
    // Desktop nav is the FIRST nav[aria-label="Calculator navigation"]
    const desktopNav = container.querySelector('nav[aria-label="Calculator navigation"]')!;
    const tabs = desktopNav.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(5);
    expect(tabs[0].textContent).toMatch(/Morphine/i);
    expect(tabs[1].textContent).toMatch(/Formula/i);
    expect(tabs[2].textContent).toMatch(/GIR/i);
    expect(tabs[3].textContent).toMatch(/Feeds/i);
    expect(tabs[4].textContent).toMatch(/UAC/i);
  });

  it('T-08 reduced favorites (2): desktop nav unchanged, mobile nav reflects favorites', async () => {
    localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula'] }));
    favorites.init();
    const { container } = render(NavShell);
    await tick();
    const navs = container.querySelectorAll('nav[aria-label="Calculator navigation"]');
    expect(navs).toHaveLength(2);
    const desktopTabs = navs[0].querySelectorAll('[role="tab"]');
    const mobileTabs = navs[1].querySelectorAll('[role="tab"]');
    expect(desktopTabs).toHaveLength(5); // NAV-ALL-01: registry-driven, immune to favorites
    expect(mobileTabs).toHaveLength(2);  // NAV-ALL-02: favorites-driven, Phase 41 contract
  });

  it('T-09 zero favorites: desktop nav still renders all 5; mobile renders none', async () => {
    favorites.toggle('morphine-wean');
    favorites.toggle('formula');
    favorites.toggle('gir');
    favorites.toggle('feeds');
    const { container } = render(NavShell);
    await tick();
    const navs = container.querySelectorAll('nav[aria-label="Calculator navigation"]');
    const desktopTabs = navs[0].querySelectorAll('[role="tab"]');
    const mobileTabs = navs[1].querySelectorAll('[role="tab"]');
    expect(desktopTabs).toHaveLength(5); // edge case: favorites empty, desktop still full
    expect(mobileTabs).toHaveLength(0);
  });

  it('T-10 active route on desktop: tab always lit (D-03)', async () => {
    // Even if the active route is non-favorited on mobile, the desktop tab is always
    // present and aria-selected="true" because all 5 are rendered.
    localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula', 'gir'] }));
    favorites.init();
    mockPage.url.pathname = '/uac-uvc';
    const { container } = render(NavShell);
    await tick();
    const desktopNav = container.querySelector('nav[aria-label="Calculator navigation"]')!;
    const desktopSelected = desktopNav.querySelectorAll('[aria-selected="true"]');
    expect(desktopSelected).toHaveLength(1);
    expect(desktopSelected[0].textContent).toMatch(/UAC/i);
  });

  it('T-11 desktop tablist has overflow-x-auto via .tablist-scroll class', () => {
    // Source-string assertion — the .tablist-scroll class is applied to the inner
    // <div role="tablist"> so overflow-x lives there and not on the outer <nav>.
    expect(navShellSource).toContain('class="tablist-scroll flex gap-2"');
    // The CSS rule itself is in the <style> block.
    expect(navShellSource).toMatch(/\.tablist-scroll\s*\{[^}]*overflow-x:\s*auto/);
  });

  it('T-12 mask-image fade is gated on .is-overflowing class', () => {
    // Source-string assertion — fade only applies under .is-overflowing
    expect(navShellSource).toMatch(/\.tablist-scroll\.is-overflowing\s*\{[^}]*mask-image:\s*linear-gradient/);
    // The class is bound conditionally in markup
    expect(navShellSource).toContain('class:is-overflowing={isOverflowing}');
  });
});
