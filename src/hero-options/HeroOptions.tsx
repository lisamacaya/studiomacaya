/*
 * Hero explorations. Alternative openings for the landing page, chosen with
 * `?hero=N` in the URL. The switcher is shown on local and dev builds only,
 * and the options never activate on the live site (see variants.ts), so the
 * current hero stays exactly as it is until one is promoted.
 */
import { useEffect, useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react'
import { LOGO_MACAYA, LOGO_RULE, LOGO_STUDIO, LOGO_VIEWBOX } from './logo-paths'
import { heroKind, heroOptions, type HeroVariant } from './variants'
import './hero-options.css'

type LogoRef = RefObject<HTMLElement | null>

interface Props {
  variant: HeroVariant
  logoRef: LogoRef
}

export function HeroOption({ variant, logoRef }: Props) {
  switch (heroKind(variant)) {
    case 'room':
      return <Room logoRef={logoRef} />
    case 'threshold':
      return <Threshold logoRef={logoRef} />
    case 'portal':
      return <Portal logoRef={logoRef} />
  }
}

/* Small floating chooser so the options can be flipped through in place.
   `current` is null when the page is showing the existing hero. */
export function HeroSwitcher({ current }: { current: HeroVariant | null }) {
  return (
    <nav className="ho-switcher" aria-label="Hero options">
      {heroOptions.map((o) => (
        <a
          key={o.id}
          href={`?hero=${o.id}`}
          aria-current={o.id === current ? 'true' : undefined}
          title={o.name}
        >
          {o.id}
        </a>
      ))}
      <a href="/" aria-current={current === null ? 'true' : undefined} title="Current hero">
        ×
      </a>
    </nav>
  )
}

/* ------------------------------------------------------------------------ */

/* The logo as inline SVG so it can be tinted and faded as one piece. */
function InlineLogo({ tone = 'moss' }: { tone?: 'moss' | 'cream' }) {
  return (
    <svg className={`ho-logo ho-logo--${tone}`} viewBox={LOGO_VIEWBOX} role="img" aria-label="Studio Macaya">
      <g>
        {LOGO_STUDIO.map((d) => (
          <path key={d.slice(0, 12)} d={d} />
        ))}
      </g>
      <rect {...LOGO_RULE} />
      <g>
        {LOGO_MACAYA.map((d) => (
          <path key={d.slice(0, 12)} d={d} />
        ))}
      </g>
    </svg>
  )
}

/* Headline split into words so each can rise out of its own mask. */
function Headline({ id, words }: { id: string; words: string[] }) {
  return (
    <h1 id={id} className="ho-headline">
      {words.map((w, i) => (
        <span key={w} className="ho-word" style={{ '--i': i } as CSSProperties}>
          {/* Real spaces keep the accessible name "Spaces that feel." */}
          {i > 0 && ' '}
          <span>{w}</span>
        </span>
      ))}
    </h1>
  )
}

function ScrollCue({ tone = 'moss' }: { tone?: 'moss' | 'cream' }) {
  return (
    <a href="#approach" className={`ho-cue ho-cue--${tone}`} aria-label="Scroll to the approach">
      <span>Scroll</span>
      <i aria-hidden="true" />
    </a>
  )
}

/*
 * Drives `--p` (0 → 1) from the page scroll on browsers without CSS
 * scroll-driven animations. Where they are supported the CSS does this on
 * the compositor and this hook does nothing.
 */
function useScrollProgress(ref: RefObject<HTMLElement | null>, distanceVh: number) {
  useEffect(() => {
    const el = ref.current
    if (!el || CSS.supports('animation-timeline: scroll()')) return
    if (!document.documentElement.classList.contains('do-anim')) return

    let frame = 0
    const update = () => {
      frame = 0
      const distance = (window.innerHeight * distanceVh) / 100
      const p = Math.min(1, Math.max(0, window.scrollY / distance))
      el.style.setProperty('--p', p.toFixed(4))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [ref, distanceVh])
}

/* ------------------------------------------------------------------------ */
/* 1 · Room                                                                  */

function Room({ logoRef }: { logoRef: LogoRef }) {
  return (
    <section className="hero ho ho-room" aria-labelledby="hero-title">
      <div className="ho-room-media" aria-hidden="true">
        <img src="/portfolio/living-room.jpg" alt="" decoding="async" fetchPriority="high" />
      </div>
      <div className="ho-room-logo" ref={(el) => { logoRef.current = el }}>
        <InlineLogo tone="cream" />
      </div>
      <div className="ho-room-copy">
        <p className="eyebrow ho-eyebrow">Interior design</p>
        <Headline id="hero-title" words={['Spaces', 'that', 'feel.']} />
        <p className="lede ho-lede">Material. Vision. Intention.</p>
      </div>
      <p className="ho-room-caption">
        Casa Almendra <span>Living room</span>
      </p>
      <ScrollCue tone="cream" />
    </section>
  )
}

/* ------------------------------------------------------------------------ */
/* 2 · Threshold                                                             */

function Threshold({ logoRef }: { logoRef: LogoRef }) {
  return (
    <section className="hero ho ho-threshold" aria-labelledby="hero-title">
      <div className="ho-logo-wrap" ref={(el) => { logoRef.current = el }}>
        <InlineLogo />
      </div>
      <figure className="ho-arch" aria-hidden="true">
        <img src="/portfolio/kitchen.jpg" alt="" decoding="async" fetchPriority="high" />
      </figure>
      <p className="eyebrow ho-eyebrow">Interior design</p>
      <Headline id="hero-title" words={['Spaces', 'that', 'feel.']} />
      <p className="lede ho-lede">Material. Vision. Intention.</p>
    </section>
  )
}

/* ------------------------------------------------------------------------ */
/* 3 · Threshold, widening                                                   */
/* Same opening as 2. Then, as the page scrolls, the arch keeps widening    */
/* until the room fills the viewport; the logo steps aside and the headline */
/* turns cream over the photograph.                                          */

const PORTAL_DISTANCE_VH = 90

function Portal({ logoRef }: { logoRef: LogoRef }) {
  const ref = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  useScrollProgress(ref, PORTAL_DISTANCE_VH)

  // The arch at rest is an invisible placeholder laid out like option 2's
  // figure. Its position inside the stage becomes the clip's starting insets.
  useLayoutEffect(() => {
    const section = ref.current
    const stage = stageRef.current
    const win = windowRef.current
    if (!section || !stage || !win) return

    const measure = () => {
      const s = stage.getBoundingClientRect()
      const w = win.getBoundingClientRect()
      section.style.setProperty('--top0', `${w.top - s.top}px`)
      section.style.setProperty('--bottom0', `${s.bottom - w.bottom}px`)
      section.style.setProperty('--side0', `${w.left - s.left}px`)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    ro.observe(win)
    return () => ro.disconnect()
  }, [])

  return (
    <section ref={ref} className="hero ho ho-portal" aria-labelledby="hero-title">
      {/* Not sticky: tells the header when the big logo has effectively gone. */}
      <div className="ho-portal-sentinel" ref={(el) => { logoRef.current = el }} aria-hidden="true" />
      <div ref={stageRef} className="ho-portal-stage">
        <figure className="ho-portal-figure" aria-hidden="true">
          <img src="/portfolio/kitchen.jpg" alt="" decoding="async" fetchPriority="high" />
        </figure>
        <div className="ho-portal-logo">
          <InlineLogo />
        </div>
        <div ref={windowRef} className="ho-portal-window" aria-hidden="true" />
        <div className="ho-portal-copy">
          <p className="eyebrow ho-eyebrow">Interior design</p>
          <Headline id="hero-title" words={['Spaces', 'that', 'feel.']} />
          <p className="lede ho-lede">Material. Vision. Intention.</p>
        </div>
      </div>
    </section>
  )
}
