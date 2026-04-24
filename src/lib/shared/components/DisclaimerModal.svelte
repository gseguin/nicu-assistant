<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { disclaimer } from '$lib/shared/disclaimer.svelte.js';
</script>

<Dialog.Root open={disclaimer.initialized && !disclaimer.acknowledged} onOpenChange={() => {}}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm" />
		<Dialog.Content
			escapeKeydownBehavior="ignore"
			interactOutsideBehavior="ignore"
			aria-labelledby="disclaimer-title"
			aria-describedby="disclaimer-body"
			class="fixed bottom-0 left-1/2 z-50 w-[min(32rem,calc(100vw-1rem))] -translate-x-1/2 rounded-t-2xl bg-[var(--color-surface-card)] px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:rounded-2xl sm:pb-6"
		>
			<Dialog.Title
				id="disclaimer-title"
				class="text-xl leading-tight font-semibold text-[var(--color-text-primary)]"
			>
				Clinical Use Disclaimer
			</Dialog.Title>

			<div
				id="disclaimer-body"
				class="mt-4 space-y-3 text-base leading-6 text-[var(--color-text-secondary)]"
			>
				<p>
					This app provides dosing and recipe calculations as decision support tools for licensed
					clinical professionals. Results are intended to assist, not replace, clinical judgment.
					All outputs must be reviewed by qualified NICU staff before administration.
				</p>
				<p>
					Morphine weaning schedules are derived from institutional weaning protocols and should be
					validated against your unit's clinical guidelines. Formula preparation calculations use
					manufacturer-provided caloric density and displacement values. Data is embedded at build
					time and may not reflect the latest formulary updates.
				</p>
				<p>
					Do not use this app as the sole basis for patient care decisions. If you are not a
					licensed clinician, please close this application.
				</p>
			</div>

			<div class="mt-5 w-full">
				<button
					type="button"
					class="min-h-[3.25rem] w-full rounded-[0.625rem] bg-[var(--color-accent-result)] px-4 py-3 text-base font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-light)]"
					onclick={() => disclaimer.acknowledge()}
				>
					I Understand
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
