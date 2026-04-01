import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'prompt',
			manifest: {
				name: 'NICU Assistant',
				short_name: 'NICU Assist',
				description:
					'Clinical PERT dosing and infant formula recipe calculator for NICU staff.',
				display: 'standalone',
				orientation: 'portrait',
				start_url: '/',
				scope: '/',
				theme_color: '#0d1117',
				background_color: '#0d1117',
				lang: 'en',
				icons: [
					{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
					{ src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
					{ src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
				]
			},
			workbox: {
				globPatterns: ['client/**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
				cleanupOutdatedCaches: true,
				navigateFallback: 'index.html',
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: { cacheName: 'google-fonts-stylesheets' }
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-webfonts',
							expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 }
						}
					}
				]
			},
			kit: { spa: true }
		})
	],
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		setupFiles: ['src/test-setup.ts']
	},
	server: {
		allowedHosts: ['nicu-assistant-dev.heartsmiles.io']
	},
	resolve: {
		conditions: ['browser']
	}
});
