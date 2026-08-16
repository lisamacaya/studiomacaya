export type AppEnv = 'live' | 'dev' | 'local'

export const appEnv = (import.meta.env.VITE_APP_ENV ?? 'local') as AppEnv

export const isLive = appEnv === 'live'
export const isDev = appEnv === 'dev'
