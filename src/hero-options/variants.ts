import { isLive } from '../env'

export const heroOptions = [
  { id: 1, name: 'Room', theme: 'dark' },
  { id: 2, name: 'Threshold', theme: 'light' },
  { id: 3, name: 'Threshold, widening', theme: 'light' },
] as const

export type HeroVariant = (typeof heroOptions)[number]['id']

/* Reads `?hero=N`. Never active on the live site, whatever the URL says. */
export function getHeroVariant(): HeroVariant | null {
  if (isLive) return null
  const raw = new URLSearchParams(window.location.search).get('hero')
  const n = Number(raw)
  return heroOptions.some((o) => o.id === n) ? (n as HeroVariant) : null
}

export function heroTheme(variant: HeroVariant) {
  return heroOptions.find((o) => o.id === variant)?.theme ?? 'light'
}
