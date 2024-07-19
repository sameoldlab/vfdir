/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ARENA_KEY: string
  readonly VITE_RAINDROP_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
