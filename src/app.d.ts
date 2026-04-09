/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Note: ambient declarations for the `virtual:pwa-info` and `virtual:pwa-register`
// modules live in `src/virtual-pwa.d.ts` (svelte-check does not follow
// vite-plugin-pwa's subpath-only `./info` type export through triple-slash
// references).

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
