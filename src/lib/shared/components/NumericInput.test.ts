import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import NumericInput from './NumericInput.svelte';

describe('NumericInput', () => {
	it('renders empty string when value is null', () => {
		render(NumericInput, { props: { value: null, label: 'Weight' } });
		const input = screen.getByLabelText('Weight') as HTMLInputElement;
		expect(input.value).toBe('');
	});

	it('displays numeric value correctly', () => {
		render(NumericInput, { props: { value: 5.5, label: 'Weight' } });
		const input = screen.getByLabelText('Weight') as HTMLInputElement;
		expect(input.value).toBe('5.5');
	});

	it('shows error message and sets aria-invalid when error prop is provided', () => {
		render(NumericInput, {
			props: { value: null, label: 'Weight', error: 'Required', id: 'test-input' }
		});
		const input = screen.getByLabelText('Weight') as HTMLInputElement;
		expect(input.getAttribute('aria-invalid')).toBe('true');
		const errorEl = screen.getByText('Required');
		expect(errorEl).toBeTruthy();
		expect(input.getAttribute('aria-describedby')).toBe('test-input-error');
	});

	it('has aria-invalid false and no error paragraph when error is empty', () => {
		render(NumericInput, {
			props: { value: null, label: 'Weight', error: '' }
		});
		const input = screen.getByLabelText('Weight') as HTMLInputElement;
		expect(input.getAttribute('aria-invalid')).toBe('false');
		expect(screen.queryByText('Required')).toBeNull();
	});

	it('shows inline error when value exceeds max', async () => {
		render(NumericInput, {
			props: { value: 150, label: 'Weight', max: 100 }
		});
		const input = screen.getByLabelText('Weight') as HTMLInputElement;
		await fireEvent.blur(input);
		expect(input.value).toBe('150');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(screen.getByText('Outside expected range — verify')).toBeTruthy();
	});

	it('shows inline error when value is below min', async () => {
		render(NumericInput, {
			props: { value: -5, label: 'Weight', min: 0 }
		});
		const input = screen.getByLabelText('Weight') as HTMLInputElement;
		await fireEvent.blur(input);
		expect(input.value).toBe('-5');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(screen.getByText('Outside expected range — verify')).toBeTruthy();
	});

	it('T-03: renders both-bounds range hint with suffix', () => {
		render(NumericInput, {
			props: { value: null, label: 'Weight', min: 0.1, max: 200, suffix: 'kg' }
		});
		const input = screen.getByLabelText('Weight') as HTMLInputElement;
		expect(screen.getByText('0.1–200 kg')).toBeTruthy();
		expect(input.getAttribute('aria-invalid')).toBe('false');
	});

	it('T-04: renders max-only range hint', () => {
		render(NumericInput, {
			props: { value: null, label: 'Volume', max: 1000, suffix: 'mL' }
		});
		expect(screen.getByText('≤ 1000 mL')).toBeTruthy();
	});

	it('T-05: renders both-bounds hint without suffix', () => {
		render(NumericInput, {
			props: { value: null, label: 'Count', min: 1, max: 10 }
		});
		expect(screen.getByText('1–10')).toBeTruthy();
	});

	it('T-06: no hint when no min/max provided', () => {
		const { container } = render(NumericInput, {
			props: { value: 5, label: 'Weight' }
		});
		const text = container.textContent ?? '';
		expect(text).not.toContain('–');
		expect(text).not.toContain('≥');
		expect(text).not.toContain('≤');
	});

	it('T-07: hint hidden when external error present', () => {
		render(NumericInput, {
			props: {
				value: 5,
				label: 'Weight',
				min: 0.1,
				max: 200,
				suffix: 'kg',
				error: 'Required'
			}
		});
		expect(screen.queryByText('0.1–200 kg')).toBeNull();
		expect(screen.getByText('Required')).toBeTruthy();
	});

	it('T-08: out-of-range pre-blur shows no advisory, hint visible', () => {
		render(NumericInput, {
			props: { value: 500, label: 'Weight', min: 0.1, max: 200 }
		});
		const input = screen.getByLabelText('Weight') as HTMLInputElement;
		expect(screen.queryByText('Outside expected range — verify')).toBeNull();
		expect(input.getAttribute('aria-invalid')).toBe('false');
		expect(screen.getByText('0.1–200')).toBeTruthy();
	});

	it('T-09: blur with value above max shows advisory and hides hint', async () => {
		render(NumericInput, {
			props: { value: 500, label: 'Weight', min: 0.1, max: 200 }
		});
		const input = screen.getByLabelText('Weight') as HTMLInputElement;
		await fireEvent.blur(input);
		expect(screen.getByText('Outside expected range — verify')).toBeTruthy();
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(screen.queryByText('0.1–200')).toBeNull();
	});

	it('T-10: blur with value below min shows advisory', async () => {
		render(NumericInput, {
			props: { value: -5, label: 'Weight', min: 0.1, max: 200 }
		});
		const input = screen.getByLabelText('Weight') as HTMLInputElement;
		await fireEvent.blur(input);
		expect(screen.getByText('Outside expected range — verify')).toBeTruthy();
	});

	it('T-11: returning to range clears advisory immediately on next input', async () => {
		render(NumericInput, {
			props: { value: 500, label: 'Weight', min: 0.1, max: 200 }
		});
		const input = screen.getByLabelText('Weight') as HTMLInputElement;
		await fireEvent.blur(input);
		expect(screen.getByText('Outside expected range — verify')).toBeTruthy();
		await fireEvent.input(input, { target: { value: '50' } });
		expect(screen.queryByText('Outside expected range — verify')).toBeNull();
		expect(input.getAttribute('aria-invalid')).toBe('false');
		expect(screen.getByText('0.1–200')).toBeTruthy();
	});

	it('T-12: out-of-range value is never auto-clamped', async () => {
		render(NumericInput, {
			props: { value: 9999, label: 'Weight', min: 0.1, max: 200 }
		});
		const input = screen.getByLabelText('Weight') as HTMLInputElement;
		await fireEvent.blur(input);
		expect(input.value).toBe('9999');
	});

	it('T-13: typing out-of-range pre-blur shows no advisory until blur', async () => {
		render(NumericInput, {
			props: { value: null, label: 'Weight', min: 0.1, max: 200 }
		});
		const input = screen.getByLabelText('Weight') as HTMLInputElement;
		await fireEvent.input(input, { target: { value: '9999' } });
		expect(screen.queryByText('Outside expected range — verify')).toBeNull();
		await fireEvent.blur(input);
		expect(screen.getByText('Outside expected range — verify')).toBeTruthy();
	});

	it('preserves null when input is cleared', async () => {
		render(NumericInput, {
			props: { value: 5, label: 'Weight' }
		});
		const input = screen.getByLabelText('Weight') as HTMLInputElement;
		// Simulate clearing the input
		await fireEvent.input(input, { target: { value: '' } });
		expect(input.value).toBe('');
	});
});
