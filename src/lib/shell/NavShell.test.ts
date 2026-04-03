import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// NavShell is difficult to render in jsdom (requires SvelteKit routing context).
// These tests verify the component's structural properties via source analysis.
const navShellSource = readFileSync(
  resolve(__dirname, 'NavShell.svelte'),
  'utf-8'
);

describe('NavShell structure (v1.2 restructure)', () => {
  it('has a sticky top header with z-10', () => {
    expect(navShellSource).toContain('sticky top-0');
    expect(navShellSource).toContain('z-10');
  });

  it('top header contains app name "NICU Assist"', () => {
    expect(navShellSource).toContain('NICU Assist');
  });

  it('info and theme buttons are in the header, not the bottom nav', () => {
    // Split source at the bottom nav marker
    const bottomNavStart = navShellSource.indexOf('fixed bottom-0');
    expect(bottomNavStart).toBeGreaterThan(-1);

    const headerSection = navShellSource.slice(0, bottomNavStart);
    const bottomNavSection = navShellSource.slice(bottomNavStart);

    // Info and theme buttons should be in the header section
    expect(headerSection).toContain('About this calculator');
    expect(headerSection).toContain('theme.toggle');

    // Bottom nav should NOT contain info or theme buttons
    expect(bottomNavSection).not.toContain('About this calculator');
    expect(bottomNavSection).not.toContain('theme.toggle');
  });

  it('bottom nav is fixed with z-10 and hidden on md+', () => {
    expect(navShellSource).toContain('fixed bottom-0');
    expect(navShellSource).toMatch(/fixed bottom-0.*md:hidden/s);
  });

  it('bottom nav tabs use flex-1 for full width', () => {
    // The tab links in the bottom nav should have flex-1
    const bottomNavStart = navShellSource.indexOf('fixed bottom-0');
    const bottomNavSection = navShellSource.slice(bottomNavStart);
    expect(bottomNavSection).toContain('flex-1');
  });

  it('bottom nav has z-10 so scaled cards cannot overlap it', () => {
    const bottomNavStart = navShellSource.indexOf('fixed bottom-0');
    // z-10 should be on the same element as fixed bottom-0
    const bottomNavLine = navShellSource.slice(
      navShellSource.lastIndexOf('\n', bottomNavStart),
      navShellSource.indexOf('\n', bottomNavStart + 50)
    );
    expect(bottomNavLine).toContain('z-10');
  });

  it('desktop nav is hidden on mobile (hidden md:flex)', () => {
    expect(navShellSource).toContain('hidden md:flex');
  });
});
