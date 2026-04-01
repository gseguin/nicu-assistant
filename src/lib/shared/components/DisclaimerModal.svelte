<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { disclaimer } from '$lib/shared/disclaimer.svelte.js';
</script>

<Dialog.Root open={!disclaimer.acknowledged} onOpenChange={() => {}}>
  <Dialog.Portal>
    <Dialog.Overlay
      class="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm"
    />
    <Dialog.Content
      escapeKeydownBehavior="ignore"
      interactOutsideBehavior="ignore"
      aria-labelledby="disclaimer-title"
      aria-describedby="disclaimer-body"
      class="fixed left-1/2 -translate-x-1/2 bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 w-[min(32rem,calc(100vw-1rem))] rounded-t-2xl sm:rounded-2xl bg-[var(--color-surface-card)] px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 shadow-2xl z-50"
    >
      <Dialog.Title
        id="disclaimer-title"
        class="text-xl font-semibold text-[var(--color-text-primary)] leading-tight"
      >
        Clinical Use Disclaimer
      </Dialog.Title>

      <div id="disclaimer-body" class="mt-4 space-y-3 text-base leading-6 text-[var(--color-text-secondary)]">
        <p>
          This app provides dosing and recipe calculations as decision support tools for licensed clinical
          professionals. Results are intended to assist — not replace — clinical judgment. All outputs must
          be reviewed by qualified NICU staff before administration.
        </p>
        <p>
          PERT dosing calculations are based on current enzyme activity data and FDA-approved brands. Formula
          preparation calculations use manufacturer-provided caloric density and displacement values. Data
          is embedded at build time and may not reflect the latest formulary updates.
        </p>
        <p>
          Do not use this app as the sole basis for patient care decisions. If you are not a licensed
          clinician, please close this application.
        </p>
      </div>

      <div class="mt-5 w-full">
        <button
          type="button"
          class="min-h-[3.25rem] w-full rounded-[0.625rem] bg-[var(--color-accent)] px-4 py-3 text-base font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-light)]"
          onclick={() => disclaimer.acknowledge()}
        >
          I Understand — Continue
        </button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
