/// <reference types="astro/client" />

declare module '*.css';

interface ImportMetaEnv {
  readonly PAYLOAD_API_URL: string;
  readonly PUBLIC_PAYLOAD_URL: string;
  readonly PUBLIC_SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
