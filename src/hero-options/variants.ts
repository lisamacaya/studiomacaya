/*
 * `hero` picks the opening; `gallery` optionally swaps the Selected Work
 * section for an alternative treatment.
 */
export const heroOptions = [
  { id: 1, name: 'Room', hero: 'room', theme: 'dark', gallery: null },
  { id: 2, name: 'Threshold', hero: 'threshold', theme: 'light', gallery: null },
  { id: 3, name: 'Threshold, widening', hero: 'portal', theme: 'light', gallery: null },
  { id: 4, name: 'Threshold, widening + arch gallery', hero: 'portal', theme: 'light', gallery: 'arch' },
] as const

export type HeroVariant = (typeof heroOptions)[number]['id']
export type HeroKind = (typeof heroOptions)[number]['hero']
export type GalleryKind = (typeof heroOptions)[number]['gallery']

const option = (variant: HeroVariant) => heroOptions.find((o) => o.id === variant)

/* Reads `?hero=N`; anything else means the current hero. */
export function getHeroVariant(): HeroVariant | null {
  const raw = new URLSearchParams(window.location.search).get('hero')
  const n = Number(raw)
  return heroOptions.some((o) => o.id === n) ? (n as HeroVariant) : null
}

export function heroTheme(variant: HeroVariant) {
  return option(variant)?.theme ?? 'light'
}

export function heroKind(variant: HeroVariant): HeroKind {
  return option(variant)?.hero ?? 'threshold'
}

export function heroGallery(variant: HeroVariant): GalleryKind {
  return option(variant)?.gallery ?? null
}
