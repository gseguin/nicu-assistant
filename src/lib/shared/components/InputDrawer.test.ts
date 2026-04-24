// src/lib/shared/components/InputDrawer.test.ts
// Co-located component test per project memory (feedback_test_colocation.md).
// Covers Plan 42.1-05 D-08 InputDrawer: collapsed handle, expanded sheet, close,
// reduced-motion gate (style block presence), bind:value.
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import InputDrawer from './InputDrawer.svelte';
import InputDrawerHarness from './InputDrawerHarness.svelte';

beforeEach(() => {
	// Some test environments warn on missing matchMedia; provide a stub.
	if (!('matchMedia' in window)) {
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: (query: string) => ({
				matches: false,
				media: query,
				onchange: null,
				addEventListener: () => {},
				removeEventListener: () => {},
				addListener: () => {},
				removeListener: () => {},
				dispatchEvent: () => false
			})
		});
	}
});

describe('InputDrawer', () => {
	it('T-01 collapsed: no pinned handle, no children mounted, expanded=false', () => {
		// The pinned collapsed handle was retired once InputsRecap became the tap target.
		// Drawer is controlled purely via the `expanded` prop now.
		render(InputDrawerHarness, { props: { initialExpanded: false } });
		expect(screen.queryByRole('button', { name: /Open inputs drawer/i })).toBeNull();
		expect(screen.queryByTestId('drawer-input')).toBeNull();
		expect(screen.getByTestId('expanded-state').textContent).toBe('closed');
	});

	it('T-02 children NOT rendered when collapsed (gated by {#if expanded})', () => {
		render(InputDrawerHarness, { props: { initialExpanded: false } });
		expect(screen.queryByTestId('drawer-input')).toBeNull();
		expect(screen.getByTestId('expanded-state').textContent).toBe('closed');
	});

	it('T-03 expanded renders dialog with title in header and children inside', async () => {
		render(InputDrawerHarness, { props: { initialExpanded: true } });
		await tick();
		// Children inside the dialog are now mounted.
		expect(screen.getByTestId('drawer-input')).toBeTruthy();
		// Title now lives inside the header close-button (entire header row is the
		// collapse affordance); the dialog carries it as aria-label at the root.
		expect(screen.getByRole('button', { name: /Close inputs/i })).toBeTruthy();
	});

	it('T-04 header close button collapses the drawer (writes back via bind)', async () => {
		render(InputDrawerHarness, { props: { initialExpanded: true } });
		await tick();
		// The entire header row is the close button (larger tap target than an
		// icon-only button); its accessible name is "Close {title.toLowerCase()}".
		const closeBtn = screen.getByRole('button', { name: /Close inputs/i });
		await fireEvent.click(closeBtn);
		await tick();
		expect(screen.getByTestId('expanded-state').textContent).toBe('closed');
		// Children unmounted
		expect(screen.queryByTestId('drawer-input')).toBeNull();
	});

	it('T-05 dialog programmatic close (simulating Esc) writes false back through bind', async () => {
		const { container } = render(InputDrawerHarness, { props: { initialExpanded: true } });
		await tick();
		const dialog = container.querySelector('dialog') as HTMLDialogElement;
		expect(dialog).toBeTruthy();
		// Native <dialog> emits a 'close' event when .close() is called or Esc is pressed.
		dialog.close();
		await tick();
		expect(screen.getByTestId('expanded-state').textContent).toBe('closed');
	});

	it('T-06 styles block contains prefers-reduced-motion gate for slide animation', () => {
		// The slide-up animation is gated on (prefers-reduced-motion: no-preference) so users
		// with reduced-motion get no animation. Vite scopes Svelte component <style> blocks via
		// CSS-in-JS that jsdom doesn't surface, so assert against the source file directly
		// (mirrors the Identity-Inside conformance pattern in 42.1-PATTERNS.md).
		const src = readFileSync(
			resolve(__dirname, 'InputDrawer.svelte'),
			'utf8'
		);
		expect(src).toMatch(/@media \(prefers-reduced-motion: no-preference\)/);
		expect(src).toMatch(/@keyframes slide-up/);
	});

	// Reference InputDrawer to keep the static import (used by future test scenarios that
	// render the bare component with a typed Snippet via its own harness).
	void InputDrawer;
});
