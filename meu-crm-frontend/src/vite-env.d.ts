/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_USE_MOCK_API: string
  readonly VITE_DEV_MODE: string
  readonly VITE_ENABLE_LOGGING: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  // Adicione outras variáveis de ambiente aqui, se tiver
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
