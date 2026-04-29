// Stable random ID for ARIA wiring. crypto.randomUUID requires a secure
// context (HTTPS or localhost); falls back to Math.random for plain-HTTP
// LAN-IP previews (e.g. http://192.168.x.x:4173 to a phone) where the API
// is undefined and would otherwise crash hydration.
export function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
