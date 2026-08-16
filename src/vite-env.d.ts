/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: 'live' | 'dev' | 'local'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
