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
		// Value stays as entered; inline error is shown instead of clamping
		expect(input.value).toBe('150');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(screen.getByText('Maximum is 100')).toBeTruthy();
	});

	it('shows inline error when value is below min', async () => {
		render(NumericInput, {
			props: { value: -5, label: 'Weight', min: 0 }
		});
		const input = screen.getByLabelText('Weight') as HTMLInputElement;
		// Value stays as entered; inline error is shown instead of clamping
		expect(input.value).toBe('-5');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(screen.getByText('Minimum is 0')).toBeTruthy();
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
