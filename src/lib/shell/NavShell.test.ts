import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

  it('info and theme buttons are in the header, not the bottom nav', () => {
    const bottomNavMatch = BOTTOM_NAV_ATTR.exec(navShellSource);
    expect(bottomNavMatch).not.toBeNull();

    const headerSection = navShellSource.slice(0, bottomNavMatch!.index);
    const bottomNavSection = navShellSource.slice(bottomNavMatch!.index);

    expect(headerSection).toContain('About this calculator');
    expect(headerSection).toContain('theme.toggle');

    expect(bottomNavSection).not.toContain('About this calculator');
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
