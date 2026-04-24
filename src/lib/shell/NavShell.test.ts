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
  favorites.init(); // seeds defaults: ['morphine-wean','formula','gir','feeds']
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

  it('T-01 default favorites (4): bottom nav renders 4 tabs', async () => {
    const { container } = render(NavShell);
    await tick();
    const bottomNav = container.querySelector('nav[aria-label="Calculator navigation"]:last-of-type')!;
    const tabs = bottomNav.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(4);
    expect(tabs[0].textContent).toMatch(/Morphine/i);
    expect(tabs[1].textContent).toMatch(/Formula/i);
    expect(tabs[2].textContent).toMatch(/GIR/i);
    expect(tabs[3].textContent).toMatch(/Feeds/i);
  });

  it('T-02 reduced favorites (morphine-wean + formula): bottom nav renders 2 tabs', async () => {
    localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['morphine-wean', 'formula'] }));
    favorites.init();
    const { container } = render(NavShell);
    await tick();
    const bottomNav = container.querySelector('nav[aria-label="Calculator navigation"]:last-of-type')!;
    const tabs = bottomNav.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(2);
    expect(tabs[0].textContent).toMatch(/Morphine/i);
    expect(tabs[1].textContent).toMatch(/Formula/i);
  });

  it('T-03 zero favorites: both bars render no tabs and throw no error', async () => {
    favorites.toggle('morphine-wean');
    favorites.toggle('formula');
    favorites.toggle('gir');
    favorites.toggle('feeds');
    const { container } = render(NavShell);
    await tick();
    const allTabs = container.querySelectorAll('[role="tab"]');
    expect(allTabs).toHaveLength(0);
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
    const bottomNav = container.querySelector('nav[aria-label="Calculator navigation"]:last-of-type')!;
    const bottomTabs = bottomNav.querySelectorAll('[role="tab"]');
    expect(bottomTabs).toHaveLength(3); // feeds is not rendered in bottom bar
    const selected = Array.from(bottomTabs).filter((t) => t.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(0);
  });

  it('T-06 registry order preserved: tabs render morphine-wean→formula→gir→feeds regardless of insertion order', async () => {
    localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['feeds', 'gir', 'formula', 'morphine-wean'] }));
    favorites.init();
    const { container } = render(NavShell);
    await tick();
    const bottomNav = container.querySelector('nav[aria-label="Calculator navigation"]:last-of-type')!;
    const tabs = bottomNav.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(4);
    expect(tabs[0].textContent).toMatch(/Morphine/i);
    expect(tabs[1].textContent).toMatch(/Formula/i);
    expect(tabs[2].textContent).toMatch(/GIR/i);
    expect(tabs[3].textContent).toMatch(/Feeds/i);
  });

});
