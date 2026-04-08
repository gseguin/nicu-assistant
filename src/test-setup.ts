import '@testing-library/jest-dom/vitest';

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
            n.querySelectorAll('dialog').forEach((d) =>
              ensureHidden(d as HTMLDialogElement)
            );
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
