// Local ambient declarations for vite-plugin-pwa virtual modules.
// The package's subpath exports (`./info`) are not followed by TS triple-slash
// `types` references, so we declare the shapes we use here.

declare module 'virtual:pwa-info' {
  export interface PwaInfo {
    pwaInDevEnvironment: boolean;
    webManifest: {
      href: string;
      useCredentials: boolean;
      linkTag: string;
    };
  }
  export const pwaInfo: PwaInfo | undefined;
}

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  }
  export function registerSW(
    options?: RegisterSWOptions,
  ): (reloadPage?: boolean) => Promise<void>;
}
