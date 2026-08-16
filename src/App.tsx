import { useState, type FormEvent } from 'react'
import { isDev } from './env'
import './App.css'

const materials = [
  { src: '/textures/stone.jpg', alt: 'River stones in charcoal and slate', label: 'Stone' },
  { src: '/textures/clay.jpg', alt: 'Layered sedimentary clay and earth', label: 'Clay' },
  { src: '/textures/bark.jpg', alt: 'Peeling bark in cream and taupe', label: 'Bark' },
  { src: '/textures/moss.jpg', alt: 'Moss growing on a tree trunk', label: 'Moss' },
] as const

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
  return (
    <>
      {isDev && (
        <div className="env-banner" role="status">
          Dev environment
        </div>
      )}

      <header className={`site-header${isDev ? ' site-header--dev' : ''}`}>
        <Wordmark />
        <nav aria-label="Primary">
          <a href="#approach">Approach</a>
          <a href="#studio">Studio</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <img
            className="hero-logo"
            src="/logos/logo-principal-musgo.svg"
            alt="Studio Macaya"
          />
          <p className="eyebrow">Interior design</p>
          <h1 id="hero-title">Spaces that feel.</h1>
          <p className="lede">Material. Vision. Intention.</p>
        </section>

        <section className="materials" aria-label="Materials">
          {materials.map((item) => (
            <figure key={item.label}>
              <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
              <figcaption>{item.label}</figcaption>
            </figure>
          ))}
        </section>

        <section className="split" id="approach">
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
                We look for authenticity — the kind a person can recognize as
                their own, and feel at ease inside.
              </p>
            </div>
          </div>
        </section>

        <section className="pillars" aria-label="Practice">
          <article>
            <h3>Matter</h3>
            <p>Natural materials chosen with care, so a room has weight, warmth, and honesty.</p>
          </article>
          <article>
            <h3>Design</h3>
            <p>An honest, intuitive process — from a single room to a complete remodel.</p>
          </article>
          <article>
            <h3>Form</h3>
            <p>Every detail decided with intention, so the space works as well as it looks.</p>
          </article>
        </section>

        <section className="manifesto" aria-labelledby="manifesto-title">
          <p className="eyebrow">Brand manifesto</p>
          <h2 id="manifesto-title">Spaces that are felt.</h2>
          <div className="prose manifesto-copy">
            <p>
              From a single room to a complete project, Studio Macaya works with
              clairvoyance — the gift of seeing what a space can become before
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

        <section className="studio" id="studio">
          <p className="eyebrow">The studio</p>
          <h2>An authenticity that cannot be manufactured.</h2>
          <div className="prose">
            <p>
              Macaya is an interior design studio that transforms the energy of
              a space. Rooms should not only look right — they should feel
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

        <section className="contact" id="contact">
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

      <footer className="site-footer">
        <p className="footer-mark" aria-hidden="true">M</p>
        <span className="footer-rule" aria-hidden="true" />
        <p className="footer-line">matter — design — form</p>
        <p className="footer-meta">© {new Date().getFullYear()} Studio Macaya</p>
      </footer>
    </>
  )
}

export default App
