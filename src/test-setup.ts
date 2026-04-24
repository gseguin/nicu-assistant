import '@testing-library/jest-dom/vitest';

// jsdom does not implement ResizeObserver — bits-ui Slider uses it internally to
// size its thumb track. Provide a no-op shim so component tests can render sliders.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// jsdom does not implement matchMedia; stub to report prefers-reduced-motion
// so Svelte slide transitions collapse to duration 0 in tests.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    })
  });
}

// jsdom does not implement Element.animate — Svelte's slide transition calls it.
if (typeof Element !== 'undefined' && !Element.prototype.animate) {
  Element.prototype.animate = function () {
    const anim: Record<string, unknown> = {
      cancel() {
        const fn = anim.oncancel as ((e: unknown) => void) | null;
        if (fn) fn({});
      },
      finish() {
        const fn = anim.onfinish as ((e: unknown) => void) | null;
        if (fn) fn({});
      },
      play: () => {},
      pause: () => {},
      reverse: () => {},
      addEventListener: (type: string, cb: () => void) => {
        if (type === 'finish') queueMicrotask(cb);
      },
      removeEventListener: () => {},
      onfinish: null,
      oncancel: null,
      currentTime: 0,
      playState: 'finished',
      finished: Promise.resolve(),
      ready: Promise.resolve()
    };
    // Immediately invoke onfinish once assigned
    queueMicrotask(() => {
      const fn = anim.onfinish as ((e: unknown) => void) | null;
      if (fn) fn({});
    });
    return anim as unknown as Animation;
  };
}

// jsdom (^29) does not implement HTMLDialogElement.showModal/close,
// and it does not apply UA stylesheets — so closed <dialog>s would
// still be considered "visible" by @testing-library. Default closed
// state must hide the element; open methods must unhide it; close()
// must re-hide AND fire a synchronous 'close' Event.
if (typeof HTMLDialogElement !== 'undefined') {
  const ensureHidden = (el: HTMLDialogElement) => {
    if (!el.hasAttribute('open')) el.style.display = 'none';
  };

  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
      (this as unknown as { open: boolean }).open = true;
      this.style.display = '';
    };
  }
  if (!HTMLDialogElement.prototype.show) {
    HTMLDialogElement.prototype.show = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
      (this as unknown as { open: boolean }).open = true;
      this.style.display = '';
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      (this as unknown as { open: boolean }).open = false;
      this.style.display = 'none';
      this.dispatchEvent(new Event('close'));
    };
  }

  // Catch dynamically mounted <dialog> elements and default them to hidden.
  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (n instanceof HTMLDialogElement) ensureHidden(n);
          if (n instanceof HTMLElement) {
            n.querySelectorAll('dialog').forEach((d) => ensureHidden(d as HTMLDialogElement));
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  // Self-test: catches regressions at suite startup.
  try {
    const probe = document.createElement('dialog') as HTMLDialogElement;
    document.body.appendChild(probe);
    ensureHidden(probe);
    if (probe.style.display !== 'none') {
      throw new Error('dialog polyfill: default closed state is not display:none');
    }
    probe.showModal();
    if (probe.style.display === 'none') {
      throw new Error('dialog polyfill: showModal did not unset display');
    }
    let closed = false;
    probe.addEventListener('close', () => {
      closed = true;
    });
    probe.close();
    if (!closed) {
      throw new Error('dialog polyfill: close() did not dispatch close event synchronously');
    }
    if (probe.style.display !== 'none') {
      throw new Error('dialog polyfill: close() did not re-hide dialog');
    }
    probe.remove();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[test-setup] HTMLDialogElement polyfill self-test failed:', err);
    throw err;
  }
}
