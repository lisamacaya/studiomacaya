/* Placeholder projects until real photography is available. */
export const projects = [
  {
    src: '/portfolio/living-room.jpg',
    alt: 'Living room with a linen sofa, travertine table, and a moss velvet armchair',
    name: 'Casa Almendra',
    room: 'Living room',
    orientation: 'landscape',
  },
  {
    src: '/portfolio/kitchen.jpg',
    alt: 'Kitchen with moss green cabinetry, terracotta floor, and an arched window',
    name: 'Apartamento Roble',
    room: 'Kitchen',
    orientation: 'portrait',
  },
  {
    src: '/portfolio/bedroom.jpg',
    alt: 'Bedroom with a low oak bed, sage linen, and lime-washed green walls',
    name: 'Villa Musgo',
    room: 'Bedroom',
    orientation: 'landscape',
  },
  {
    src: '/portfolio/reading-corner.jpg',
    alt: 'Reading corner with a boucle armchair, olive tree, and herringbone oak floor',
    name: 'Estudio Norte',
    room: 'Reading corner',
    orientation: 'portrait',
  },
  {
    src: '/portfolio/bathroom.jpg',
    alt: 'Bathroom in warm plaster with a freestanding travertine bath',
    name: 'Casa Piedra',
    room: 'Bathroom',
    orientation: 'landscape',
  },
  {
    src: '/portfolio/dining.jpg',
    alt: 'Dining room with clay plaster walls, an oak table, and mismatched wooden chairs',
    name: 'Loft Arcilla',
    room: 'Dining',
    orientation: 'portrait',
  },
] as const

export const pad2 = (n: number) => String(n).padStart(2, '0')
