<!--
  42.1-04 D-19: Static meta-refresh redirect from `/` to `/morphine-wean`.
  Replaces the prior JS `goto()` so bots, slow connections, and no-JS clients
  see the redirect immediately.

  Architecture note: with `ssr = false` (set in +layout.ts) SvelteKit cannot
  inject <svelte:head> markup into the prerendered HTML before hydration, and
  adapter-static overrides build/index.html with its SPA fallback shell. The
  load-bearing redirect therefore lives in src/app.html so the meta tag is
  in the byte-stream of every served page. This +page.svelte mirrors the
  same pattern (meta + canonical + pathname gate + noscript) so the contract
  is documented at the route level too — both copies converge on the same
  /morphine-wean target with the same pathname gate.

  Pathname gate per RESEARCH finding 3: adapter-static fallback: 'index.html'
  also serves this shell for deep links (e.g. /uac-uvc), so the inline script
  removes the meta-refresh tag synchronously when pathname !== '/' to avoid
  yanking deep-link visits to /morphine-wean before SvelteKit hydrates.
-->
<svelte:head>
	<meta http-equiv="refresh" content="0; url=/morphine-wean" />
	<link rel="canonical" href="/morphine-wean" />
	<title>NICU Assistant</title>
	<script>
		// Pathname gate (D-19): only let the meta-refresh fire when we are AT '/'.
		// Runs synchronously before the browser acts on the meta tag.
		if (typeof window !== 'undefined' && window.location.pathname !== '/') {
			var meta = document.querySelector('meta[http-equiv="refresh"]');
			if (meta && meta.parentNode) meta.parentNode.removeChild(meta);
		}
	</script>
</svelte:head>

<noscript>
	<p>Redirecting to <a href="/morphine-wean">Morphine Wean</a>.</p>
</noscript>
