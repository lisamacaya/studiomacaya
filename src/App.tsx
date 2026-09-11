import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent,
} from 'react'
import { isDev, isLive } from './env'
import { projects, pad2 } from './projects'
import { getHeroVariant, heroGallery, heroTheme } from './hero-options/variants'
import './App.css'
/* After App.css on purpose: the option styles override the base hero. */
import { HeroOption, HeroSwitcher } from './hero-options/HeroOptions'
import { ArchGallery } from './hero-options/ArchGallery'

/* Hero explorations, chosen with `?hero=N` in the URL (see hero-options/). */
const heroVariant = getHeroVariant()
const galleryVariant = heroVariant ? heroGallery(heroVariant) : null

const navItems = [
  { id: 'approach', label: 'Approach' },
  { id: 'work', label: 'Work' },
  { id: 'studio', label: 'Studio' },
  { id: 'contact', label: 'Contact' },
] as const

const navIds = navItems.map((item) => item.id)

/**
 * Tracks whether an element is inside the viewport. Used the same way the
 * reference site does: a sentinel at the top of the page flips the header
 * into its scrolled state, and the hero logo leaving view brings the
 * wordmark into the header.
 */
function useInView<T extends Element>(rootMargin = '0px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])

  return [ref, inView] as const
}

/**
 * Reveals every `[data-reveal]` block as it scrolls into view. When
 * `resetWhen` becomes true (the page is back at the top), blocks are hidden
 * again so they replay on the next scroll down. Blocks marked
 * `data-reveal="once"` (the hero, which is on screen at the top) are exempt.
 */
function useScrollReveal(resetWhen: boolean) {
  const ioRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const blocks = document.querySelectorAll<HTMLElement>('[data-reveal]')
    if (blocks.length === 0) return

    const reveal = (el: Element) => {
      el.classList.add('is-visible')
      io.unobserve(el)
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Reveal blocks entering view, and any block already scrolled past
          // (e.g. after an anchor jump) so nothing is left hidden above.
          if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
            reveal(entry.target)
          }
        }
        for (const block of blocks) {
          if (!block.classList.contains('is-visible') && block.getBoundingClientRect().bottom < 0) {
            reveal(block)
          }
        }
      },
      // Ignore the bottom quarter of the viewport so a block only reveals once
      // its top edge has risen to where the eye is, not the moment it peeks in.
      { threshold: 0, rootMargin: '0px 0px -25% 0px' },
    )

    blocks.forEach((block) => io.observe(block))
    ioRef.current = io

    // Short blocks at the very end of the page (the footer) can never climb
    // past the ignored margin, so reveal whatever is left once we reach the end.
    const onScroll = () => {
      const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      if (!atEnd) return
      for (const block of blocks) {
        if (!block.classList.contains('is-visible')) reveal(block)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      io.disconnect()
      ioRef.current = null
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    const io = ioRef.current
    if (!resetWhen || !io) return
    const revealed = document.querySelectorAll<HTMLElement>(
      '[data-reveal].is-visible:not([data-reveal="once"])',
    )
    for (const block of revealed) {
      block.classList.remove('is-visible')
      io.observe(block)
    }
  }, [resetWhen])
}

/** Which nav target is currently crossing the middle of the viewport. */
function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id
          if (entry.isIntersecting) {
            setActive(id)
          } else {
            setActive((current) => (current === id ? null : current))
          }
        }
      },
      // A thin band just above the vertical center of the viewport.
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )

    sections.forEach((section) => io.observe(section))
    return () => io.disconnect()
  }, [ids])

  return active
}

const materials = [
  { src: '/textures/stone.jpg', alt: 'River stones in charcoal and slate', label: 'Stone' },
  { src: '/textures/clay.jpg', alt: 'Layered sedimentary clay and earth', label: 'Clay' },
  { src: '/textures/bark.jpg', alt: 'Peeling bark in cream and taupe', label: 'Bark' },
  { src: '/textures/moss.jpg', alt: 'Moss growing on a tree trunk', label: 'Moss' },
] as const

/**
 * Horizontal project gallery. Native scrolling with snap points, so touch,
 * trackpads, and keyboard work as expected; mouse users can also drag.
 */
function Portfolio() {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startLeft: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(1 / projects.length)

  // Keep the counter and progress hairline in step with the scroll position.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let frame = 0
    const update = () => {
      frame = 0
      const inset = parseFloat(getComputedStyle(track).paddingInlineStart) || 0
      const items = Array.from(track.children) as HTMLElement[]
      const range = track.scrollWidth - track.clientWidth
      let nearest = 0
      if (range > 0 && track.scrollLeft >= range - 1) {
        // The last card can never reach the left edge (nothing follows it to
        // scroll past), so once the track is fully scrolled, it is the current one.
        nearest = items.length - 1
      } else {
        let nearestDist = Infinity
        items.forEach((item, i) => {
          const dist = Math.abs(item.offsetLeft - inset - track.scrollLeft)
          if (dist < nearestDist) {
            nearestDist = dist
            nearest = i
          }
        })
      }
      setIndex(nearest)

      const start = 1 / items.length
      setProgress(range > 0 ? start + (1 - start) * (track.scrollLeft / range) : 1)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    track.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      track.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  // Step to the next (or previous) card the track can actually left-align.
  // On wide viewports the last cards share the same end position, so stepping by
  // index alone would jump past a card or get stuck at the end.
  const step = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const inset = parseFloat(getComputedStyle(track).paddingInlineStart) || 0
    const range = track.scrollWidth - track.clientWidth
    const targets = (Array.from(track.children) as HTMLElement[]).map((item) =>
      Math.min(item.offsetLeft - inset, range),
    )
    const current = track.scrollLeft
    const target =
      direction === 1
        ? targets.find((left) => left > current + 1)
        : [...targets].reverse().find((left) => left < current - 1)
    if (target === undefined) return
    track.scrollTo({ left: target, behavior: 'smooth' })
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // Touch and pen already scroll natively; only mice need drag-to-scroll.
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const track = event.currentTarget
    dragRef.current = { startX: event.clientX, startLeft: track.scrollLeft }
    try {
      track.setPointerCapture(event.pointerId)
    } catch {
      // Capture is a nicety; dragging still works without it.
    }
    setDragging(true)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    event.currentTarget.scrollLeft = drag.startLeft - (event.clientX - drag.startX)
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDragging(false)
  }

  const count = projects.length

  return (
    <section className="portfolio" id="work" data-reveal>
      <div className="portfolio-head">
        <div>
          <p className="eyebrow">Selected work</p>
          <h2>Rooms we saw before they existed.</h2>
        </div>
        <div className="portfolio-controls">
          <p className="portfolio-counter" aria-live="polite">
            <span>{pad2(index + 1)}</span> / {pad2(count)}
          </p>
          <button
            type="button"
            className="portfolio-arrow"
            aria-label="Previous project"
            disabled={index === 0}
            onClick={() => step(-1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            className="portfolio-arrow"
            aria-label="Next project"
            disabled={index === count - 1}
            onClick={() => step(1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className={`portfolio-track${dragging ? ' is-dragging' : ''}`}
        role="region"
        aria-label="Project gallery. Scroll sideways to browse."
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {projects.map((project, i) => (
          <figure
            key={project.name}
            className={`portfolio-item portfolio-item--${project.orientation}`}
            style={{ '--i': i } as CSSProperties}
          >
            <div className="portfolio-media">
              <img
                src={project.src}
                alt={project.alt}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>
            <figcaption>
              <span className="portfolio-num">{pad2(i + 1)}</span>
              <span className="portfolio-name">{project.name}</span>
              <span className="portfolio-room">{project.room}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div
        className="portfolio-progress"
        aria-hidden="true"
        style={{ '--progress': progress, '--start': 1 / count } as CSSProperties}
      />
      <p className="portfolio-hint">Drag, or scroll sideways</p>
    </section>
  )
}

function Wordmark({ invert = false }: { invert?: boolean }) {
  return (
    <a className={`wordmark${invert ? ' wordmark--invert' : ''}`} href="#top">
      <span className="wordmark-studio">Studio</span>
      <span className="wordmark-rule" aria-hidden="true" />
      <span className="wordmark-name">Macaya</span>
    </a>
  )
}

function InquiryForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setStatus('sending')

    try {
      const body = new URLSearchParams()
      for (const [key, value] of data.entries()) {
        body.append(key, String(value))
      }

      const response = await fetch('/__forms.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
      if (!response.ok) throw new Error('Request failed')
      form.reset()
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <form className="inquiry" name="inquiry" method="POST" onSubmit={onSubmit}>
      <input type="hidden" name="form-name" value="inquiry" />
      <p className="honeypot">
        <label>
          Leave blank
          <input name="bot-field" tabIndex={-1} autoComplete="off" />
        </label>
      </p>
      <label>
        Name
        <input type="text" name="name" required autoComplete="name" />
      </label>
      <label>
        Email
        <input type="email" name="email" required autoComplete="email" />
      </label>
      <label>
        Tell us about the space
        <textarea name="message" rows={5} required />
      </label>
      <button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Begin a conversation'}
      </button>
      {status === 'sent' && (
        <p className="inquiry-note" role="status">
          Received. We will be in touch.
        </p>
      )}
      {status === 'error' && (
        <p className="inquiry-note inquiry-note--error" role="alert">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  )
}

function App() {
  const [sentinelRef, atTop] = useInView<HTMLDivElement>()
  useScrollReveal(atTop)
  // Treat the hero logo as gone once it slides under the header itself.
  const [heroLogoRef, heroLogoInView] = useInView<HTMLElement>('-72px 0px 0px 0px')
  const activeSection = useActiveSection(navIds)

  const headerClass = [
    'site-header',
    !atTop && 'is-scrolled',
    !heroLogoInView && 'is-branded',
  ]
    .filter(Boolean)
    .join(' ')

  const pageClass = [
    'page',
    isDev && 'page--dev',
    heroVariant && `ho-theme-${heroTheme(heroVariant)}`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={pageClass}>
      {isDev && (
        <div className="env-banner" role="status">
          Dev environment
        </div>
      )}

      <header className={headerClass}>
        <Wordmark />
        <nav aria-label="Primary">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={activeSection === item.id ? 'true' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main id="top">
        <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" />

        {heroVariant ? (
          <HeroOption variant={heroVariant} logoRef={heroLogoRef} />
        ) : (
          <section className="hero" aria-labelledby="hero-title" data-reveal="once">
            <img
              ref={(el) => {
                heroLogoRef.current = el
              }}
              className="hero-logo"
              src="/logos/logo-principal-musgo.svg"
              alt="Studio Macaya"
            />
            <p className="eyebrow">Interior design</p>
            <h1 id="hero-title">Spaces that feel.</h1>
            <p className="lede">Material. Vision. Intention.</p>
          </section>
        )}

        <section className="materials" aria-label="Materials" data-reveal>
          {materials.map((item) => (
            <figure key={item.label}>
              <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
              <figcaption>{item.label}</figcaption>
            </figure>
          ))}
        </section>

        <section className="split" id="approach" data-reveal>
          <p className="eyebrow">Creative concept</p>
          <div className="split-grid">
            <h2>Timeless, harmonious spaces.</h2>
            <div className="prose">
              <p>
                Studio Macaya listens, understands, and projects livable rooms for
                each client. We do not follow trends, ostentatious luxury, or
                spaces made only to impress.
              </p>
              <p>
                We look for authenticity: the kind a person can recognize as
                their own, and feel at ease inside.
              </p>
            </div>
          </div>
        </section>

        <section className="pillars" aria-label="Practice" data-reveal>
          <article>
            <h3>Matter</h3>
            <p>Natural materials chosen with care, so a room has weight, warmth, and honesty.</p>
          </article>
          <article>
            <h3>Design</h3>
            <p>An honest, intuitive process, from a single room to a complete remodel.</p>
          </article>
          <article>
            <h3>Form</h3>
            <p>Every detail decided with intention, so the space works as well as it looks.</p>
          </article>
        </section>

        {galleryVariant === 'arch' ? <ArchGallery /> : <Portfolio />}

        <section className="manifesto" aria-labelledby="manifesto-title" data-reveal>
          <p className="eyebrow">Brand manifesto</p>
          <h2 id="manifesto-title">Spaces that are felt.</h2>
          <div className="prose manifesto-copy">
            <p>
              From a single room to a complete project, Studio Macaya works with
              clairvoyance: the gift of seeing what a space can become before
              anyone else imagines it.
            </p>
            <p>
              We do not follow trends or templates. We see beyond what is there
              and design toward what should exist: environments where life can
              flourish with intention and harmony.
            </p>
            <p>
              The work is for people who sense their space could be better, and
              do not yet know how. Macaya arrives with the clarity of someone
              who has already seen the finished room.
            </p>
          </div>
        </section>

        <section className="studio" id="studio" data-reveal>
          <p className="eyebrow">The studio</p>
          <h2>An authenticity that cannot be manufactured.</h2>
          <div className="prose">
            <p>
              Macaya is an interior design studio that transforms the energy of
              a space. Rooms should not only look right. They should feel
              right. Natural materials. Intentional decisions. A style clients
              recognize before they can name it.
            </p>
            <p>
              The person we work with knows what they love when they see it,
              and needs a partner to bring it into the room. They choose by
              affinity and trust, not by spectacle.
            </p>
          </div>
          <ul className="values">
            <li>Authentic</li>
            <li>Intentional</li>
            <li>Natural</li>
            <li>Timeless</li>
          </ul>
        </section>

        <section className="about" id="lisa" aria-labelledby="about-title" data-reveal>
          <figure className="about-portrait">
            <img
              src="/portrait/lisa-macaya.jpg"
              alt="Lisa Macaya leaning against a plaster wall in a light-filled room"
              loading="lazy"
              decoding="async"
            />
          </figure>
          <div className="about-body">
            <p className="eyebrow">Lisa Macaya</p>
            <h2 id="about-title">The one who sees it first.</h2>
            <div className="prose">
              <p>
                Studio Macaya is Lisa. Every project, from a single room to a
                full remodel, passes through her hands and her eye. There is no
                team to be handed off to: the person you meet on the first
                visit is the person who chooses the last detail.
              </p>
              <p>
                She listens more than she talks. She wants to know how you
                make coffee in the morning, where the light lands at four, and
                which corner you avoid without knowing why. Then she does the
                thing clients find hardest to explain: she sees the finished
                room, clearly, before anything has moved.
              </p>
              <p>
                Her taste leans toward what lasts. Stone, clay, wood, linen.
                Colors that come from the ground. Rooms that grow better with
                age instead of dating themselves.
              </p>
            </div>
            <blockquote className="about-quote">
              <p>
                A room already knows what it wants to be. My work is to listen
                to it, and to you.
              </p>
            </blockquote>
            <p className="about-meta">
              Lisa Macaya
              <span>Founder and Creative Director</span>
            </p>
            <a className="about-link" href="#contact">
              Begin a conversation
            </a>
          </div>
        </section>

        <section className="contact" id="contact" data-reveal>
          <div>
            <p className="eyebrow">Contact</p>
            <h2>Begin with the space you have.</h2>
            <p className="contact-lead">
              Lisa Macaya
              <span>Creative Director</span>
            </p>
          </div>
          <InquiryForm />
        </section>
      </main>

      <footer className="site-footer" data-reveal>
        <p className="footer-mark" aria-hidden="true">M</p>
        <span className="footer-rule" aria-hidden="true" />
        <p className="footer-line">matter - design - form</p>
        <p className="footer-meta">© {new Date().getFullYear()} Studio Macaya</p>
      </footer>

      {/* Hero option switcher: local and dev builds only, never on the live site. */}
      {!isLive && <HeroSwitcher current={heroVariant} />}
    </div>
  )
}

export default App
