// src/lib/shared/disclaimer.svelte.ts
// .svelte.ts extension required — $state rune must compile through Svelte preprocessor

import { createPersistentValue, rawStringCodec } from './persistent-value.js';

const DISCLAIMER_KEY_V1 = 'nicu_assistant_disclaimer_v1';
const DISCLAIMER_KEY_V2 = 'nicu_assistant_disclaimer_v2';

// Two seam instances (MIG-02 / D-04): each key gets its own guarded I/O instance.
// rawStringCodec stores literal 'true' (not JSON boolean) — preserves existing stored shape.
// pvV1 is READ-ONLY — never call .write() or .remove() on it (audit trail, ROADMAP SC-2).
const pvV1 = createPersistentValue<string>({
  key: DISCLAIMER_KEY_V1,
  defaultValue: '',
  codec: rawStringCodec
});
const pvV2 = createPersistentValue<string>({
  key: DISCLAIMER_KEY_V2,
  defaultValue: '',
  codec: rawStringCodec
});

let _acknowledged = $state(false);
let _initialized = $state(false);

export const disclaimer = {
  get acknowledged(): boolean {
    return _acknowledged;
  },
  get initialized(): boolean {
    return _initialized;
  },
  init(): void {
    const v1 = pvV1.read(); // '' when not stored; 'true' when stored — seam handles getItem throw
    const v2 = pvV2.read(); // '' when not stored; 'true' when stored
    _acknowledged = v2 === 'true' || v1 === 'true'; // OR logic UNCHANGED
    if (v1 === 'true' && v2 !== 'true') {
      pvV2.write('true'); // replaces: try { localStorage.setItem(KEY_V2, 'true') } catch {}
      // Do NOT call pvV1.write() or pvV1.remove() — v1 is read-only (audit trail, ROADMAP SC-2)
    }
    _initialized = true;
  },
  acknowledge(): void {
    _acknowledged = true;
    pvV2.write('true'); // replaces: try { localStorage.setItem(KEY_V2, 'true') } catch {}
  }
};
