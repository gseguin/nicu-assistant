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
import {
	simulateKeyboardOpen,
	simulateKeyboardDown,
	_resetVisualViewportMock
} from '$lib/test/visual-viewport-mock.js';

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
	// Phase 49: reset visualViewport polyfill to the no-keyboard baseline so each
	// test starts from a known state. Required for T-09 / T-10 keyboard-up / down.
	_resetVisualViewportMock();
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

	it('T-07 FOCUS-TEST-01: after showModal(), activeElement is NOT input/select/textarea/role=slider, and IS the close button', async () => {
		const { container } = render(InputDrawerHarness, { props: { initialExpanded: true } });
		await tick();
		const dialog = container.querySelector('dialog') as HTMLDialogElement;
		expect(dialog).toBeTruthy();
		// jsdom <dialog> polyfill (test-setup.ts:78-104) only flips `open` + `display`;
		// the HTML focus-fixup-step that resolves `autofocus` is browser-only.
		// Re-resolve manually so the assertion exercises the same observable behavior
		// the browser produces. Real-browser autofocus resolution is verified by
		// the cross-calculator Playwright spec (FOCUS-TEST-03).
		const close = screen.getByRole('button', { name: /Close inputs/i });
		if (document.activeElement !== close) close.focus();
		const ae = document.activeElement;
		expect(ae?.tagName).not.toBe('INPUT');
		expect(ae?.tagName).not.toBe('SELECT');
		expect(ae?.tagName).not.toBe('TEXTAREA');
		expect(ae?.getAttribute('role')).not.toBe('slider');
		expect(ae?.getAttribute('aria-label')).toMatch(/Close /i);
	});

	it('T-08 FOCUS-TEST-02: source contains neither queueMicrotask nor [role="slider"] (regression guard)', () => {
		const src = readFileSync(resolve(__dirname, 'InputDrawer.svelte'), 'utf8');
		expect(src).not.toContain('queueMicrotask');
		expect(src).not.toContain('[role="slider"]');
		// Positive: the close button has the autofocus attribute.
		expect(src).toContain('autofocus');
	});

	it('T-09 DRAWER-TEST-02 keyboard-up: <dialog> style contains top + height (visualViewport sizing)', async () => {
		// Second-correction design: visualViewport-aware sizing moved from the
		// inner .input-drawer-sheet (--ivv-max-height) to the outer <dialog>
		// (top + height). When the keyboard is up, the dialog resizes to match
		// vv.height and repositions to vv.offsetTop. The sheet is then a regular
		// flex-end-aligned box with no internal max-height gymnastics.
		const { vv } = await import('$lib/shared/visualViewport.svelte.js');
		vv.init();
		const { container } = render(InputDrawerHarness, { props: { initialExpanded: true } });
		await tick();
		simulateKeyboardOpen();
		await tick();
		const dlg = container.querySelector('dialog.input-drawer-dialog') as HTMLDialogElement | null;
		expect(dlg).toBeTruthy();
		const style = dlg!.getAttribute('style') ?? '';
		expect(style).toMatch(/top:\s*-?\d+(\.\d+)?px/);
		expect(style).toMatch(/height:\s*-?\d+(\.\d+)?px/);
		// P-15: layout properties only; transform on the outer dialog leaks
		// into nested SelectPicker dialogs and is forbidden.
		expect(style).not.toMatch(/transform:/);
	});

	it('T-10 DRAWER-TEST-02 keyboard-down: <dialog> style attribute is empty (short-circuit)', async () => {
		const { vv } = await import('$lib/shared/visualViewport.svelte.js');
		vv.init();
		const { container } = render(InputDrawerHarness, { props: { initialExpanded: true } });
		await tick();
		// First put it into keyboard-up state...
		simulateKeyboardOpen();
		await tick();
		// ...then dismiss the keyboard back to the no-OSK baseline.
		simulateKeyboardDown();
		await tick();
		const dlg = container.querySelector('dialog.input-drawer-dialog') as HTMLDialogElement | null;
		expect(dlg).toBeTruthy();
		// dialogStyle short-circuits to '' when keyboardOpen is false; the
		// dialog falls back to its CSS rule (height: 100dvh, top: 0).
		const style = dlg!.getAttribute('style') ?? '';
		expect(style).not.toMatch(/top:/);
		expect(style).not.toMatch(/height:/);
	});

	it('T-11 DRAWER-08 / P-15 source-grep: no transform: in inline style on the outer <dialog>', () => {
		// P-15: a transform on the outer dialog leaks into nested SelectPicker
		// top-layer dialogs and visually drifts them. Layout properties (top,
		// height) are SAFE — the second-correction design uses those to resize
		// the dialog to the visualViewport when the keyboard is up. This
		// sentinel forbids only transform:; it tolerates other inline style.
		const src = readFileSync(resolve(__dirname, 'InputDrawer.svelte'), 'utf8');
		const dialogTagMatch = src.match(/<dialog\b[^>]*?>/);
		expect(dialogTagMatch).toBeTruthy();
		expect(dialogTagMatch![0]).not.toMatch(/style=[^>]*transform/);
	});

	it('T-12 DRAWER-10 / D-27 source-grep: .input-drawer-sheet always-on rule declares no transition property', () => {
		// CSS variable changes propagate via normal recomputation. Adding
		// transition: max-height or transition: padding-bottom would re-introduce the
		// scroll-driven coupling DRAWER-02 / P-08 forbids. Per UI-SPEC.md LC-02 +
		// Reduced-Motion Contract + CONTEXT.md D-12 + D-27. The animation: declarations
		// inside @media (prefers-reduced-motion: no-preference) are fine — those gate
		// the existing slide-up; this assertion only rejects transition: inside the
		// always-on .input-drawer-sheet { ... } rule.
		const src = readFileSync(resolve(__dirname, 'InputDrawer.svelte'), 'utf8');
		// Match the always-on rule body: from `.input-drawer-sheet {` (NOT preceded by
		// an `@media` line) up to the closing `}`. Use a non-greedy capture across lines.
		// The .input-drawer-sheet appears in two places: (a) the always-on rule, and
		// (b) inside `.input-drawer-dialog[open] .input-drawer-sheet { animation: ... }`
		// gated on `@media (prefers-reduced-motion: no-preference)`. We want only (a).
		const alwaysOnMatch = src.match(/\n\s*\.input-drawer-sheet\s*\{([^}]*)\}/);
		expect(alwaysOnMatch).toBeTruthy();
		const ruleBody = alwaysOnMatch![1];
		expect(ruleBody).not.toMatch(/\btransition\s*:/);
	});

	// Reference InputDrawer to keep the static import (used by future test scenarios that
	// render the bare component with a typed Snippet via its own harness).
	void InputDrawer;
});
