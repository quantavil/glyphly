import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { type Cat, STYLES, transform } from './engine/engine'
import {
  ChevronDownIcon,
  ClearIcon,
  MoonIcon,
  StarFilledIcon,
  StarOutlineIcon,
  SunIcon,
} from './icons'

const CATS: { id: 'all' | 'favorites' | Cat; label: string }[] = [
  { id: 'all', label: 'All Styles' },
  { id: 'favorites', label: '★ Starred' },
  { id: 'clean', label: 'Clean & Classic' },
  { id: 'gothic', label: 'Gothic & Script' },
  { id: 'box', label: 'Squared Tiles' },
  { id: 'bracket', label: 'Brackets & Frames' },
  { id: 'round', label: 'Circled Spheres' },
  { id: 'wide', label: 'Vaporwave & Spaced' },
  { id: 'small', label: 'Small Capitals' },
  { id: 'flip', label: 'Mirrored & Flip' },
  { id: 'glitch', label: 'Zalgo & Glitch' },
  { id: 'line', label: 'Line & Strike' },
  { id: 'archaic', label: 'Ancient Runes' },
  { id: 'code', label: 'Ciphers & Code' },
  { id: 'emoji', label: 'Symbols & Ornaments' },
]

const TICKS = Array.from({ length: 101 }, (_, i) => i)

const DEFAULT_FAVORITES = [
  'bold',
  'fraktur',
  'double',
  'sga',
  'cyberpunk',
  'zalgo',
  'small-caps',
  'circled',
  'wings',
]

async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to execCommand
    }
  }
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'absolute'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

export function App() {
  const [text, setText] = useState('GLYPHLY')
  const [cat, setCat] = useState<'all' | 'favorites' | Cat>('all')
  const [query, setQuery] = useState('')
  const [specimenScale, setSpecimenScale] = useState(24)
  const [copiedId, setCopiedId] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const [isDraggingRuler, setIsDraggingRuler] = useState(false)

  const rulerRef = useRef<HTMLElement | null>(null)
  const bracketRef = useRef<HTMLDivElement | null>(null)
  const needleRef = useRef<HTMLDivElement | null>(null)
  const readoutRef = useRef<HTMLSpanElement | null>(null)

  const [geom, setGeom] = useState(() => ({
    docH: typeof document !== 'undefined' ? document.documentElement.scrollHeight : 2000,
    vh: typeof window !== 'undefined' ? window.innerHeight : 800,
  }))

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('fancy_theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch {
      // ignore
    }
    return 'dark'
  })

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fancy_favorites')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length >= 8) {
          return parsed
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...parsed, ...DEFAULT_FAVORITES]))
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_FAVORITES
  })

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  // Auto-grow the textarea with its content (no manual resize handle)
  const autoGrow = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => {
    autoGrow()
  }, [text, autoGrow])

  // Sync theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('fancy_theme', theme)
    } catch {
      // ignore
    }
  }, [theme])

  // Measure document and viewport geometry
  useEffect(() => {
    const measure = () => {
      const docH = document.documentElement.scrollHeight
      const vh = window.innerHeight
      setGeom((prev) => (prev.docH === docH && prev.vh === vh ? prev : { docH, vh }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [text, cat, query, specimenScale])

  // Direct 60fps/120fps hardware-accelerated scroll tracking for the drafting gauge
  useEffect(() => {
    let rafId = 0
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const docH = document.documentElement.scrollHeight
        const vh = window.innerHeight
        const s = window.scrollY
        const maxScroll = Math.max(1, docH - vh)
        const f = Math.max(0, Math.min(1, s / maxScroll))

        // 1. Viewport shaded bracket thumb
        if (bracketRef.current) {
          const bracketTop = (s / docH) * 100
          const bracketHeight = Math.max(2, (vh / docH) * 100)
          bracketRef.current.style.top = `${bracketTop}%`
          bracketRef.current.style.height = `${bracketHeight}%`
        }

        // 2. Cyan glowing needle bar line & readout
        if (needleRef.current) {
          const needleTop = f * 100
          needleRef.current.style.top = `${needleTop}%`
          if (readoutRef.current) {
            readoutRef.current.textContent = `${String(Math.round(f * 100)).padStart(3, '0')}%`
            readoutRef.current.style.top = f > 0.94 ? '-14px' : '4px'
          }
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [geom])

  // Support ?scroll=X or #scroll-X navigation (e.g. ?scroll=86 for 86% scroll)
  useEffect(() => {
    const handleScrollParam = () => {
      const qScroll = new URLSearchParams(window.location.search).get('scroll')
      let pct: number | null = null
      if (qScroll) {
        pct = parseFloat(qScroll) / 100
      } else if (window.location.hash.startsWith('#scroll-')) {
        pct = parseFloat(window.location.hash.replace('#scroll-', '')) / 100
      }
      if (pct !== null && !Number.isNaN(pct)) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight
        window.scrollTo(0, pct * maxScroll)
      }
    }
    handleScrollParam()
    const timer = setTimeout(handleScrollParam, 100)
    window.addEventListener('hashchange', handleScrollParam)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('hashchange', handleScrollParam)
    }
  }, [geom])

  const previewValue = text.trim().length === 0 ? 'GLYPHLY' : text

  // Persist favorites
  const toggleFavorite = useCallback((id: string, e: Event) => {
    e.stopPropagation()
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      try {
        localStorage.setItem('fancy_favorites', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: STYLES.length,
      favorites: favorites.length,
    }
    for (const s of STYLES) {
      counts[s.cat] = (counts[s.cat] ?? 0) + 1
    }
    return counts
  }, [favorites])

  // Filter styles
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return STYLES.filter((s) => {
      if (cat === 'favorites' ? !favorites.includes(s.id) : cat !== 'all' && s.cat !== cat) {
        return false
      }
      if (q.length === 0) return true
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.cat.toLowerCase().includes(q) ||
        (s.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false)
      )
    })
  }, [cat, favorites, query])

  const handleCopy = useCallback(async (id: string, name: string, out: string) => {
    const ok = await copyToClipboard(out)
    if (!ok) return

    navigator.vibrate?.(10)
    setCopiedId(id)
    setToastMessage(`Copied ${name}`)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setCopiedId('')
      setToastMessage('')
    }, 1400)
  }, [])

  function handleClear() {
    setText('')
    inputRef.current?.focus()
  }

  function applyCase(type: 'upper' | 'lower' | 'title' | 'reverse') {
    if (type === 'upper') setText((prev) => prev.toUpperCase())
    if (type === 'lower') setText((prev) => prev.toLowerCase())
    if (type === 'title') setText((prev) => prev.replace(/\b[a-z]/gi, (c) => c.toUpperCase()))
    if (type === 'reverse') setText((prev) => Array.from(prev).reverse().join(''))
  }

  const canScroll = rows.length > 5 && geom.docH > geom.vh + 60

  const updateScrollFromRuler = useCallback(
    (clientY: number) => {
      const ruler = rulerRef.current
      if (!ruler || !canScroll) return
      const rect = ruler.getBoundingClientRect()
      const relY = clientY - rect.top
      const edgePad = 14
      const span = Math.max(1, rect.height - 2 * edgePad)
      const f = Math.max(0, Math.min(1, (relY - edgePad) / span))
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      window.scrollTo({ top: f * maxScroll })
    },
    [canScroll],
  )

  const handleRulerPointerDown = useCallback(
    (e: PointerEvent) => {
      if (!canScroll) return
      e.preventDefault()
      setIsDraggingRuler(true)
      ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
      updateScrollFromRuler(e.clientY)
    },
    [canScroll, updateScrollFromRuler],
  )

  const handleRulerPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRuler) return
      updateScrollFromRuler(e.clientY)
    },
    [isDraggingRuler, updateScrollFromRuler],
  )

  const handleRulerPointerUp = useCallback((e: PointerEvent) => {
    setIsDraggingRuler(false)
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    } catch {
      // ignore
    }
  }, [])

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <>
      {/* Top Navigation */}
      <nav id="site-nav">
        <div class="nav-inner">
          <div class="nav-brand">
            <span class="wordmark">GLYPHLY</span>
          </div>

          <button
            type="button"
            class="theme-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
          </button>
        </div>
      </nav>

      {/* Main Studio Layout */}
      <div class="studio-layout" style={{ '--specimen-size': `${specimenScale}px` }}>
        {/* Left Console Panel (Desktop: permanent left panel. Mobile: collapsible) */}
        <aside class={`console-panel ${mobileExpanded ? 'mobile-open' : ''}`}>
          {/* Pre-text source input */}
          <div class="control-label-row">
            <span>Pre text</span>
            <span class="control-val">{text.length === 0 ? 'empty' : `${text.length} chars`}</span>
          </div>
          <textarea
            ref={inputRef}
            class="console-textarea"
            rows={3}
            value={text}
            placeholder="Type text here..."
            spellcheck={false}
            onInput={(e) => {
              setText(e.currentTarget.value)
              autoGrow()
            }}
          />

          {/* Mobile Expand/Collapse Toggle (mobile only, centered below input) */}
          <div class="mobile-toggle-wrap">
            <button
              type="button"
              class="mobile-toggle-btn"
              aria-expanded={mobileExpanded}
              aria-controls="console-controls-body"
              onClick={() => setMobileExpanded((prev) => !prev)}
            >
              <span class="toggle-line" aria-hidden="true" />
              <span class="toggle-label">Controls</span>
              <span class={`toggle-chevron ${mobileExpanded ? 'open' : ''}`} aria-hidden="true">
                <ChevronDownIcon size={14} />
              </span>
              <span class="toggle-line" aria-hidden="true" />
            </button>
          </div>

          {/* Console Controls Body */}
          <div class="console-body" id="console-controls-body">
            {/* Quick Case Transforms */}
            <div class="case-pills">
              <button type="button" class="case-pill-btn" onClick={() => applyCase('upper')}>
                UPPER
              </button>
              <button type="button" class="case-pill-btn" onClick={() => applyCase('lower')}>
                lower
              </button>
              <button type="button" class="case-pill-btn" onClick={() => applyCase('title')}>
                Title
              </button>
              <button type="button" class="case-pill-btn" onClick={() => applyCase('reverse')}>
                ⇄ Flip
              </button>
            </div>

            {/* Specimen Scale Slider */}
            <div class="control-group">
              <div class="control-label-row">
                <span>Font Size</span>
                <span class="control-val">{specimenScale}px</span>
              </div>
              <input
                type="range"
                class="scale-slider"
                min="14"
                max="48"
                value={specimenScale}
                onInput={(e) => setSpecimenScale(Number(e.currentTarget.value))}
              />
            </div>

            {/* Style Search */}
            <div class="control-group">
              <div class="control-label-row">
                <span>Search</span>
                {query.trim().length > 0 && <span class="control-val">{rows.length} found</span>}
              </div>
              <div class="search-wrap">
                <input
                  type="search"
                  class="search-input"
                  value={query}
                  placeholder="Search styles…"
                  aria-label="Search styles"
                  onInput={(e) => setQuery(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setQuery('')
                  }}
                />
                {query.length > 0 && (
                  <button
                    type="button"
                    class="search-clear-btn"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                  >
                    <ClearIcon size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Category Directory List (Full View, not Dropdown) */}
            <div class="cat-directory-section">
              <div class="control-label-row">
                <span>Categories</span>
                <span class="control-val">{rows.length} styles</span>
              </div>
              <div class="cat-directory-list" role="tablist" aria-label="Style categories">
                {CATS.map((c) => {
                  const count = categoryCounts[c.id] ?? 0
                  const isActive = cat === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      class={`cat-item-row ${isActive ? 'active' : ''}`}
                      onClick={() => setCat(c.id)}
                    >
                      <span class="cat-item-label">{c.label}</span>
                      <span class="cat-item-count">[{count}]</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Clear Button */}
            {text.length > 0 && (
              <button type="button" class="clear-btn" onClick={handleClear}>
                <ClearIcon size={12} /> Clear text
              </button>
            )}
          </div>
        </aside>

        {/* Center Specimen River */}
        <main class="specimen-river">
          <div class="river-ledger">
            {rows.length === 0 ? (
              <div class="empty-state">
                <p>
                  {query.trim().length > 0
                    ? `No styles match “${query.trim()}”.`
                    : 'No styles found in this category.'}
                </p>
                {query.trim().length > 0 ? (
                  <button type="button" class="clear-btn" onClick={() => setQuery('')}>
                    Clear search
                  </button>
                ) : (
                  <button type="button" class="clear-btn" onClick={() => setCat('all')}>
                    Show All Styles
                  </button>
                )}
              </div>
            ) : (
              rows.map((s, idx) => {
                const out = transform(previewValue, s)
                const done = copiedId === s.id
                const isFav = favorites.includes(s.id)
                const indexStr = String(idx + 1).padStart(2, '0')

                return (
                  <article key={s.id} class={`river-row ${done ? 'copied-flash' : ''}`}>
                    <div class="row-topline">
                      <span class="row-idx">#{indexStr}</span>
                      <button
                        type="button"
                        class="row-title-btn"
                        onClick={() => handleCopy(s.id, s.name, out)}
                        aria-label={`Copy ${s.name}`}
                      >
                        {s.name}
                      </button>
                      <span class="row-category">{s.cat}</span>
                      <button
                        type="button"
                        class={`star-btn ${isFav ? 'active' : ''}`}
                        onClick={(e) => toggleFavorite(s.id, e)}
                        title={isFav ? 'Unstar' : 'Star'}
                        aria-label={isFav ? 'Unstar' : 'Star'}
                      >
                        {isFav ? <StarFilledIcon size={14} /> : <StarOutlineIcon size={14} />}
                      </button>
                    </div>

                    <button
                      type="button"
                      class="row-specimen-btn"
                      onClick={() => handleCopy(s.id, s.name, out)}
                      aria-label={`Copy ${s.name} specimen`}
                    >
                      <span class="row-specimen">{out}</span>
                    </button>
                  </article>
                )
              })
            )}
          </div>
        </main>

        {/* Right Architectural Drafting Scale Ruler (Inspired by getartcraft.com/news) */}
        <aside
          ref={rulerRef}
          class={`drafting-ruler ${isDraggingRuler ? 'is-dragging' : ''} ${!canScroll ? 'not-scrollable' : ''}`}
          aria-hidden={!canScroll}
          onPointerDown={handleRulerPointerDown}
          onPointerMove={handleRulerPointerMove}
          onPointerUp={handleRulerPointerUp}
          onPointerCancel={handleRulerPointerUp}
        >
          <div class="ruler-viewport">
            <div class="ruler-track">
              {/* 1. Shaded translucent viewport bracket */}
              <div ref={bracketRef} class="ruler-viewport-bracket">
                <div class="bracket-fill" />
                <span class="bracket-edge top" />
                <span class="bracket-edge bottom" />
              </div>

              {/* 2. Rotated watermark anchored between 30% and 45% */}
              <div class="ruler-watermark-row">
                <span class="ruler-watermark">SPECIMENS</span>
              </div>

              {/* 3. Ticks from 0 to 100 spanning the entire scale */}
              {TICKS.map((t) => {
                const isMajor = t % 5 === 0
                return (
                  <div key={t} class="ruler-tick-item" style={{ top: `${t}%` }}>
                    {isMajor && <span class="ruler-num">{t}</span>}
                    <span class={`ruler-tick-mark ${isMajor ? 'major' : 'minor'}`} />
                  </div>
                )
              })}

              {/* 4. Glowing cyan active needle bar line & readout badge */}
              <div ref={needleRef} class="ruler-needle">
                <span class="ruler-needle-line" />
                <span ref={readoutRef} class="ruler-needle-readout">
                  000%
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Minimal Toast */}
      {toastMessage && (
        <aside class="art-toast" role="status" aria-hidden="true">
          <span>✓</span>
          <span>{toastMessage}</span>
        </aside>
      )}

      {/* Footer */}
      <footer>
        <span>Glyphly · Unicode Typography Engine</span>
        <span style={{ color: 'var(--faint)' }}>{STYLES.length} Styles</span>
      </footer>
    </>
  )
}
