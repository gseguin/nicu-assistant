// src/lib/shared/components/InputsRecap.test.ts
// Co-located component test per project memory (feedback_test_colocation.md).
// Covers the InputsRecap metadata strip that sits below the calculator title
// and drives drawer open on mobile.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';

import InputsRecap from './InputsRecap.svelte';

describe('InputsRecap', () => {
	it('T-01 renders label, value, and unit for each item', () => {
		render(InputsRecap, {
			props: {
				items: [
					{ label: 'Weight', value: '2.4', unit: 'kg' },
					{ label: 'Step', value: '10', unit: '%' }
				],
				onOpen: () => {}
			}
		});
		// Labels render in uppercase via CSS; assert on source text (DOM preserves case of the string).
		expect(screen.getAllByText('Weight').length).toBeGreaterThan(0);
		expect(screen.getAllByText('Step').length).toBeGreaterThan(0);
		expect(screen.getAllByText('2.4').length).toBeGreaterThan(0);
		expect(screen.getAllByText('10').length).toBeGreaterThan(0);
		expect(screen.getAllByText('kg').length).toBeGreaterThan(0);
		expect(screen.getAllByText('%').length).toBeGreaterThan(0);
	});

	it('T-02 renders middle-dot placeholder when value is null (em-dash ban)', () => {
		render(InputsRecap, {
			props: {
				items: [{ label: 'Weight', value: null, unit: 'kg' }],
				onOpen: () => {}
			}
		});
		expect(screen.getAllByText('·').length).toBeGreaterThan(0);
		// Unit is suppressed when value is null so the placeholder reads cleanly.
		expect(screen.queryByText('kg')).toBeNull();
	});

	it('T-03 mobile button calls onOpen when clicked', async () => {
		const onOpen = vi.fn();
		render(InputsRecap, {
			props: {
				items: [{ label: 'Weight', value: '2.4', unit: 'kg' }],
				onOpen
			}
		});
		// The mobile variant is the <button>; the desktop variant is the <div role="group">.
		const btn = screen.getByRole('button');
		await fireEvent.click(btn);
		expect(onOpen).toHaveBeenCalledOnce();
	});

	it('T-04 aria-label composes label/value/unit sequence + open affordance', () => {
		render(InputsRecap, {
			props: {
				items: [
					{ label: 'Weight', value: '2.4', unit: 'kg' },
					{ label: 'Dextrose', value: '12.5', unit: '%' }
				],
				onOpen: () => {}
			}
		});
		const btn = screen.getByRole('button');
		expect(btn.getAttribute('aria-label')).toBe(
			'Weight 2.4 kg, Dextrose 12.5 %. Tap to edit inputs.'
		);
	});

	it('T-05 aria-expanded tracks expanded prop', () => {
		const { rerender } = render(InputsRecap, {
			props: {
				items: [{ label: 'Weight', value: '2.4', unit: 'kg' }],
				onOpen: () => {},
				expanded: false
			}
		});
		const btn = screen.getByRole('button');
		expect(btn.getAttribute('aria-expanded')).toBe('false');
		rerender({
			items: [{ label: 'Weight', value: '2.4', unit: 'kg' }],
			onOpen: () => {},
			expanded: true
		});
		expect(btn.getAttribute('aria-expanded')).toBe('true');
	});

	it('T-06 desktop variant is not rendered (recap is mobile-only — md+ uses sticky sidebar inputs)', () => {
		render(InputsRecap, {
			props: {
				items: [{ label: 'Weight', value: '2.4', unit: 'kg' }],
				onOpen: () => {}
			}
		});
		// Only the mobile <button> renders. Desktop wide viewports surface the
		// inputs directly in the sticky right column — the recap would duplicate
		// information without adding a drawer affordance that doesn't exist.
		expect(screen.queryByRole('group', { name: /Current inputs/i })).toBeNull();
		// Value appears once (mobile button's dl), not twice.
		expect(screen.getAllByText('2.4').length).toBe(1);
	});
});
