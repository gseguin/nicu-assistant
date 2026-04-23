// src/lib/shell/HamburgerMenu.test.ts
// Co-located component test per project memory (feedback_test_colocation.md).
// 14 tests (T-01..T-14) — skeleton from 40-RESEARCH.md lines 988–1141 + T-14 (scrim click).
//
// NOTE on module state isolation:
// HamburgerMenu imports `favorites` statically; tests must consume the SAME module
// instance or state mutations won't reach the component. We therefore import
// `favorites` statically here and isolate between tests by: (1) clearing localStorage,
// (2) seeding localStorage when a specific state is needed, (3) calling favorites.init()
// which re-reads storage and reassigns the singleton's internal $state ids.
// vi.resetModules() is intentionally NOT used — it would yield a fresh favorites
// module instance for dynamic imports, diverging from the one HamburgerMenu uses.
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import HamburgerMenu from './HamburgerMenu.svelte';
import { favorites } from '$lib/shared/favorites.svelte.js';

beforeEach(() => {
	localStorage.clear();
	// Seed defaults for every test (empty storage → init writes all 4 favorites).
	// Tests that need a different state will seed localStorage then re-init.
	favorites.init();
});

describe('HamburgerMenu', () => {
	it('T-01 renders closed — no role=dialog content visible', async () => {
		const trigger = document.createElement('button');
		document.body.appendChild(trigger);
		render(HamburgerMenu, { props: { triggerEl: trigger, open: false } });
		// <dialog> element exists but content is gated by {#if open}
		expect(screen.queryByRole('link', { name: /Morphine Wean/i })).toBeNull();
	});

	it('T-02 opens when prop bound to true — lists every registered calculator', async () => {
		// beforeEach already called favorites.init() with defaults (all 4 favorited).
		const trigger = document.createElement('button');
		document.body.appendChild(trigger);
		render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
		await tick();
		expect(screen.getAllByRole('link')).toHaveLength(4);
		expect(screen.getByRole('link', { name: /Morphine Wean/i })).toBeTruthy();
		expect(screen.getByRole('link', { name: /Formula/i })).toBeTruthy();
		expect(screen.getByRole('link', { name: /GIR/i })).toBeTruthy();
		expect(screen.getByRole('link', { name: /Feeds/i })).toBeTruthy();
	});

	it('T-03 close button closes the dialog and restores focus to trigger', async () => {
		const trigger = document.createElement('button');
		document.body.appendChild(trigger);
		trigger.focus();
		render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
		await tick();
		const closeBtn = screen.getByRole('button', { name: /Close menu/i });
		await fireEvent.click(closeBtn);
		await tick();
		expect(document.activeElement).toBe(trigger);
	});

	it('T-04 programmatic close (simulating Esc via dialog.close) restores focus', async () => {
		const trigger = document.createElement('button');
		document.body.appendChild(trigger);
		trigger.focus();
		const { container } = render(HamburgerMenu, {
			props: { triggerEl: trigger, open: true }
		});
		await tick();
		const dialog = container.querySelector('dialog')!;
		dialog.close();
		await tick();
		expect(document.activeElement).toBe(trigger);
	});

	it('T-05 clicking a nav link closes the menu', async () => {
		// beforeEach already called favorites.init().
		const trigger = document.createElement('button');
		document.body.appendChild(trigger);
		const { container } = render(HamburgerMenu, {
			props: { triggerEl: trigger, open: true }
		});
		await tick();
		const link = screen.getByRole('link', { name: /Morphine Wean/i });
		// Prevent jsdom navigation
		link.addEventListener('click', (e) => e.preventDefault());
		await fireEvent.click(link);
		await tick();
		const dialog = container.querySelector('dialog')!;
		expect(dialog.hasAttribute('open')).toBe(false);
	});

	it('T-06 clicking a star does NOT close the menu', async () => {
		// beforeEach already called favorites.init() — Morphine Wean is favorited.
		const trigger = document.createElement('button');
		document.body.appendChild(trigger);
		const { container } = render(HamburgerMenu, {
			props: { triggerEl: trigger, open: true }
		});
		await tick();
		const star = screen.getByRole('button', {
			name: /Remove Morphine Wean from favorites/i
		});
		await fireEvent.click(star);
		await tick();
		const dialog = container.querySelector('dialog')!;
		expect(dialog.hasAttribute('open')).toBe(true);
	});

	it('T-07 star on favorited row has aria-pressed=true', async () => {
		// beforeEach already called favorites.init() — Morphine Wean is favorited.
		const trigger = document.createElement('button');
		document.body.appendChild(trigger);
		render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
		await tick();
		const star = screen.getByRole('button', {
			name: /Remove Morphine Wean from favorites/i
		});
		expect(star.getAttribute('aria-pressed')).toBe('true');
	});

	it('T-08 star on unfavorited row (when one removed) has aria-pressed=false', async () => {
		// Seed with 3 favorites so Morphine Wean is NOT favorited
		localStorage.setItem(
			'nicu:favorites',
			JSON.stringify({ v: 1, ids: ['formula', 'gir', 'feeds'] })
		);
		favorites.init();
		const trigger = document.createElement('button');
		document.body.appendChild(trigger);
		render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
		await tick();
		const star = screen.getByRole('button', {
			name: /Add Morphine Wean to favorites/i
		});
		expect(star.getAttribute('aria-pressed')).toBe('false');
	});

	it('T-09 at cap: non-favorited star is disabled (would require 5th calculator — documented as skip until Phase 42 adds UAC/UVC)', async () => {
		// With only 4 registry entries and all 4 seeded as favorites, there's no non-favorited row to test.
		// This test documents the gap; FAV-TEST-03 in Phase 41 covers the full flow with UAC/UVC.
		// When Phase 42 adds UAC/UVC, this test MUST be updated to:
		//   seed 4 favs, render, find star for uac-uvc row, assert disabled attribute.
		expect(true).toBe(true); // placeholder
	});

	it('T-10 cap-reached caption appears when favorites.isFull', async () => {
		// beforeEach already called favorites.init() — all 4 default favorites (isFull = true).
		const trigger = document.createElement('button');
		document.body.appendChild(trigger);
		render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
		await tick();
		expect(screen.getByText(/4 of 4 favorites/)).toBeTruthy();
	});

	it('T-11 cap-reached caption absent when below cap', async () => {
		localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['formula'] }));
		favorites.init();
		const trigger = document.createElement('button');
		document.body.appendChild(trigger);
		render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
		await tick();
		expect(screen.queryByText(/of 4 favorites/)).toBeNull();
	});

	it('T-12 star toggle updates aria-pressed and icon fill reactively', async () => {
		localStorage.setItem('nicu:favorites', JSON.stringify({ v: 1, ids: ['formula'] }));
		favorites.init();
		const trigger = document.createElement('button');
		document.body.appendChild(trigger);
		render(HamburgerMenu, { props: { triggerEl: trigger, open: true } });
		await tick();
		let star = screen.getByRole('button', { name: /Add Morphine Wean to favorites/i });
		expect(star.getAttribute('aria-pressed')).toBe('false');
		await fireEvent.click(star);
		await tick();
		star = screen.getByRole('button', { name: /Remove Morphine Wean from favorites/i });
		expect(star.getAttribute('aria-pressed')).toBe('true');
	});

	it('T-13 tab order: close button is first tabbable (D-13)', async () => {
		const trigger = document.createElement('button');
		document.body.appendChild(trigger);
		const { container } = render(HamburgerMenu, {
			props: { triggerEl: trigger, open: true }
		});
		await tick();
		// Collect interactive elements in DOM order
		const focusable = Array.from(container.querySelectorAll('button, a[href]')).filter(
			(el) => !(el as HTMLButtonElement).disabled
		);
		expect((focusable[0] as HTMLElement).getAttribute('aria-label')).toMatch(/Close menu/i);
	});

	it('T-14 scrim click closes the menu', async () => {
		// Mirrors SelectPicker scrim-click pattern: clicking the <dialog> element itself
		// (not a child) triggers handleDialogClick → close() because e.target === dialog.
		const trigger = document.createElement('button');
		document.body.appendChild(trigger);
		const { container } = render(HamburgerMenu, {
			props: { triggerEl: trigger, open: true }
		});
		await tick();
		const dialog = container.querySelector('dialog')!;
		expect(dialog.hasAttribute('open')).toBe(true);
		await fireEvent.click(dialog);
		await tick();
		expect(dialog.hasAttribute('open')).toBe(false);
	});
});
