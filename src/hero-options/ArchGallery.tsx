/*
 * Arch gallery. An alternative Selected Work section for option 4: one large
 * arch, the same doorway shape as the hero, that you move through room by
 * room. Each change re-runs the hero's motion (a sliver opens and comes into
 * focus) on the incoming photograph. Driven by arrows, keyboard, swipe, and
 * the small arch thumbnails; the page's own scroll is never touched.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { pad2, projects } from '../projects'

/* Longer than the `ag-open` animation, so the old room is never pulled early. */
const LEAVE_MS = 1900
const SWIPE_PX = 40

export function ArchGallery() {
  const [index, setIndex] = useState(0)
  const [leaving, setLeaving] = useState<number | null>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const count = projects.length

  const go = (target: number) => {
    const next = (target + count) % count
    if (next === index) return
    setLeaving(index)
    setIndex(next)
  }

  // The outgoing photograph is kept underneath until the new one has opened.
  useEffect(() => {
    if (leaving === null) return
    const t = setTimeout(() => setLeaving(null), LEAVE_MS)
    return () => clearTimeout(t)
  }, [leaving, index])

  // Warm the cache so every room opens without a blank frame.
  useEffect(() => {
    for (const project of projects) {
      const img = new Image()
      img.src = project.src
    }
  }, [])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(index + 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(index - 1)
    }
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    swipe.current = { x: event.clientX, y: event.clientY }
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current
    swipe.current = null
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? index + 1 : index - 1)
    } else if (Math.abs(dx) < 6 && Math.abs(dy) < 6) {
      // A plain click on the arch steps through the rooms.
      go(index + 1)
    }
  }

  const current = projects[index]

  return (
    <section className="portfolio ag" id="work" data-reveal>
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
            onClick={() => go(index - 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            className="portfolio-arrow"
            aria-label="Next project"
            onClick={() => go(index + 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="ag-stage"
        role="group"
        aria-roledescription="carousel"
        aria-label="Project gallery"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
      >
        <figure className="ag-arch">
          {leaving !== null && (
            <img
              key={`out-${leaving}`}
              className="ag-frame ag-frame--out"
              src={projects[leaving].src}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
          )}
          <img
            key={`in-${index}`}
            className="ag-frame ag-frame--in"
            src={current.src}
            alt={current.alt}
            draggable={false}
          />
        </figure>
        <div key={index} className="ag-caption">
          <span className="portfolio-num">{pad2(index + 1)}</span>
          <span className="portfolio-name">{current.name}</span>
          <span className="portfolio-room">{current.room}</span>
        </div>
      </div>

      <div className="ag-thumbs" role="tablist" aria-label="Rooms">
        {projects.map((project, i) => (
          <button
            key={project.name}
            type="button"
            role="tab"
            className="ag-thumb"
            aria-selected={i === index}
            aria-label={`${project.name}, ${project.room}`}
            onClick={() => go(i)}
          >
            <img src={project.src} alt="" draggable={false} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
      <p className="portfolio-hint">Choose a room, or use the arrows</p>
    </section>
  )
}
