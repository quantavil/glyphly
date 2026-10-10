import { type FancyStyle, FLIP_PUNCT, STYLES } from './styles'

export type { Cat, FancyStyle } from './styles'
export { STYLES }
export type Pair = readonly [plain: string, styled: string]

export interface StyleMeasure {
  /** The transformed string output (or original text if no style is provided) */
  output: string
  /** Number of visual grapheme clusters */
  graphemes: number
  /** Number of UTF-16 code units (JS string length) */
  codeUnits: number
  /** Number of UTF-8 bytes */
  bytes: number
  /** Number of words */
  words: number
  /** Number of lines */
  lines: number
  /** Characters per line (CPL), evaluating readability measure */
  cpl: number
  /** Total input graphemes analyzed */
  totalGraphemes: number
  /** Count of input graphemes supported by this style */
  supportedGraphemes: number
  /** Coverage ratio (0.0 to 1.0) of supported input characters */
  coverage: number
  /** Typographic line measure status: 'short' (<45), 'optimal' (45-75), 'long' (>75) */
  typographicMeasure: 'short' | 'optimal' | 'long'
}

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
const encoder = new TextEncoder()

export const graphemes = (text: string): string[] =>
  Array.from(segmenter.segment(text), (s) => s.segment)

export const clean = (text: string) => text.replace(/\s+/g, ' ')

export const transform = (text: string, style: FancyStyle): string => {
  const parts = graphemes(clean(text)).map(style.map)
  return style.join ? style.join(parts) : parts.join('')
}

/** Per-letter plain/styled pairs, or null when the style changes letter order or adds extras. */
export const pairs = (text: string, style: FancyStyle): Pair[] | null =>
  style.join ? null : graphemes(clean(text)).map((g) => [g, style.map(g)] as const)

/**
 * Checks if a grapheme cluster is supported by a given style,
 * intelligently eliminating false positives (e.g. self-inverting characters in flip,
 * whitespace, wrapper styles, small caps glyphs, regional indicators, runes, braille, morse, etc.).
 */
export const isGraphemeSupported = (g: string, style: FancyStyle): boolean => {
  // Whitespace is supported by every style
  if (/^\s+$/u.test(g)) return true

  // Wrapper styles (e.g. sparkle, heart, wings, brackets, stars) support all characters
  if (style.join && (style.cat === 'emoji' || style.cat === 'box' || style.cat === 'bracket'))
    return true

  // Combining mark styles and glitch styles apply to any non-whitespace grapheme
  if (
    style.cat === 'line' ||
    style.cat === 'glitch' ||
    style.id.startsWith('enclosing-') ||
    style.id === 'scanline'
  )
    return true

  // Upside-down / Flip / Inverted styles:
  // Symmetric letters/digits (o, s, x, z, l, 0, 8, …) are supported even
  // though they render identically. Punctuation support is exactly the
  // FLIP_PUNCT key set — no broader regex, so '*+-=:~^' correctly report
  // as unsupported instead of false positives.
  if (style.id === 'flip' || style.id === 'inverted' || style.id === 'flip-spaced') {
    if (/^[a-zA-Z0-9]$/.test(g)) return true
    if (g.length === 1 && FLIP_PUNCT[g] !== undefined) return true
    return style.map(g) !== g
  }

  // Mirrored style supports all Latin letters and naturally symmetric characters
  if (style.id === 'mirrored' || style.id === 'mirror-forward' || style.id === 'mirror-spaced') {
    if (/^[a-zA-Z]$/.test(g)) return true
    return style.map(g) !== g
  }

  // Backwards and Spaced styles work for every input (order/spacing only)
  if (
    style.id === 'backwards' ||
    style.id === 'spaced' ||
    style.id.startsWith('spaced-') ||
    style.id === 'backwards-spaced'
  )
    return true

  // Binary, Hex, Octal and Decimal styles support single ASCII printable
  // characters only. Multi-codepoint graphemes would be lossy (only the
  // first codepoint would encode), so they report as unsupported.
  if (
    style.id === 'binary' ||
    style.id === 'hex' ||
    style.id === 'octal' ||
    style.id === 'decimal'
  ) {
    if (g.length !== 1) return false
    const c = g.codePointAt(0) ?? 0
    return c >= 32 && c <= 126
  }

  // ROT13 and Atbash ciphers support single Latin letters A-Z / a-z
  if (style.id === 'rot13' || style.id === 'atbash') {
    return /^[a-zA-Z]$/.test(g)
  }

  // ROT47 cipher supports single printable ASCII characters (! through ~)
  if (style.id === 'rot47') {
    return /^[!-~]$/.test(g)
  }

  // Byte/escape encodings round-trip every grapheme, even when the
  // transformation is visually identical (e.g. 'A' in URL encoding)
  if (
    style.id === 'base64' ||
    style.id === 'base32' ||
    style.id === 'url-encode' ||
    style.id === 'html-entity' ||
    style.id === 'unicode-escape'
  ) {
    return true
  }

  // Leet speak supports single Latin letters and digits
  if (style.id === 'leet') {
    return /^[a-zA-Z0-9]$/.test(g)
  }

  // A1Z26 supports single Latin letters (digits pass through unencoded)
  if (style.id === 'a1z26') {
    return /^[a-zA-Z]$/.test(g)
  }

  // NATO phonetic supports single Latin letters and digits
  if (style.id === 'nato') {
    return /^[a-zA-Z0-9]$/.test(g)
  }

  // Small-caps: all Latin letters except x/X, which have no assigned
  // small-cap in Unicode (map falls back to plain 'x' / case-change 'X').
  // Reporting x/X as unsupported removes the false positive.
  if (style.id === 'small-caps' || style.id === 'small-spaced' || style.id === 'small-dots') {
    if (/^[a-wyzA-WYZ]$/.test(g)) return true
    if (/^[xX]$/.test(g)) return false
  }

  // Inverted small supports all Latin letters A-Z / a-z
  if (style.id === 'inverted-small') {
    return /^[a-zA-Z]$/.test(g)
  }

  // Superscript: alphanumeric characters and math signs (+ - = ( )), excluding unmapped 'q' / 'Q'
  if (style.id === 'superscript' || style.id === 'superscript-spaced') {
    if (/^[a-pr-zA-PR-Z0-9+\-=()]$/.test(g)) return true
    return false
  }

  // Subscript: digits, assigned Latin subscript letters, and math signs (+ - = ( ))
  if (style.id === 'subscript' || style.id === 'subscript-spaced') {
    if (/^[0-9aehijklmnoprstuvxAEHIJKLMNOPRSTUVX+\-=()]$/.test(g)) return true
    return false
  }

  // Wide & Vaporwave: single ASCII printable characters only
  if (style.id === 'wide' || style.id === 'vaporwave') {
    if (g.length !== 1) return false
    const c = g.codePointAt(0) ?? 0
    return c >= 32 && c <= 126
  }

  // Parenthesized: Latin letters and digits 1-9
  if (style.id === 'parenthesized' || style.id === 'parenthesized-spaced') {
    if (/^[a-zA-Z1-9]$/.test(g)) return true
  }

  // Morse code: alphanumeric characters and standard punctuation
  if (style.id === 'morse') {
    return /^[a-zA-Z0-9.,?!'"/()&:;=+\-_$@]$/.test(g)
  }

  // Regional indicators: Latin letters A-Z / a-z
  if (style.id === 'regional') {
    return /^[a-zA-Z]$/.test(g)
  }

  // Archaic scripts: Latin letters A-Z / a-z
  if (
    style.id === 'runes' ||
    style.id === 'ogham' ||
    style.id === 'gothic-archaic' ||
    style.id === 'glagolitic' ||
    style.id === 'phoenician' ||
    style.id === 'cherokee' ||
    style.id === 'syllabics' ||
    style.id === 'greek' ||
    style.id === 'cyrillic' ||
    style.id === 'coptic' ||
    style.id === 'old-italic' ||
    style.id === 'sga' ||
    style.id === 'tai-viet' ||
    style.id === 'yi-nuosu' ||
    style.id === 'asian-stroke' ||
    style.id === 'asian-katakana'
  ) {
    return /^[a-zA-Z]$/.test(g)
  }

  // Symbol/cipher LUT scripts: Latin letters A-Z / a-z
  if (
    style.id === 'neon' ||
    style.id === 'future-alien' ||
    style.id === 'currency' ||
    style.id === 'symbols-latin' ||
    style.id === 'bent' ||
    style.id === 'upper-angles' ||
    style.id === 'squiggle' ||
    style.id === 'squiggle2' ||
    style.id === 'squiggle3' ||
    style.id === 'squiggle4' ||
    style.id === 'squiggle5' ||
    style.id === 'squiggle6' ||
    style.id === 'symbol-per-letter' ||
    style.id === 'cute-dots'
  ) {
    return /^[a-zA-Z]$/.test(g)
  }

  // Wingdings: Latin letters and digits 0-9
  if (style.id === 'wingdings') {
    return /^[a-zA-Z0-9]$/.test(g)
  }

  // Braille: Latin letters and digits 0-9
  if (style.id === 'braille') {
    return /^[a-zA-Z0-9]$/.test(g)
  }

  // Black circles (neg-circled): letters and digits 0-9
  if (style.id === 'neg-circled') {
    return /^[a-zA-Z0-9]$/.test(g)
  }

  // Circled: letters and digits 0-9
  if (style.id === 'circled') {
    return /^[a-zA-Z0-9]$/.test(g)
  }

  // Squares and Black squares: letters A-Z / a-z
  if (style.id === 'squared' || style.id === 'neg-squared') {
    return /^[a-zA-Z]$/.test(g)
  }

  // General check: character is supported if style explicitly transforms it
  return style.map(g) !== g
}

/**
 * Measures text and text style metrics:
 * grapheme count, code units, UTF-8 bytes, words, lines,
 * character coverage (without false positives), and typographic line measure (CPL).
 */
export const measure = (text: string, style?: FancyStyle): StyleMeasure => {
  if (text.length === 0) {
    return {
      output: '',
      graphemes: 0,
      codeUnits: 0,
      bytes: 0,
      words: 0,
      lines: 0,
      cpl: 0,
      totalGraphemes: 0,
      supportedGraphemes: 0,
      coverage: 1,
      typographicMeasure: 'short',
    }
  }

  const output = style ? transform(text, style) : text
  const gList = graphemes(output)
  const inputGraphemes = graphemes(text)
  const trimmed = text.trim()

  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length
  const lines = text.length === 0 ? 0 : text.split(/\r\n|\r|\n/).length
  const gCount = gList.length
  const codeUnits = output.length
  const bytes = encoder.encode(output).length

  let supportedGraphemes = inputGraphemes.length
  if (style) {
    supportedGraphemes = inputGraphemes.filter((g) => isGraphemeSupported(g, style)).length
  }
  const totalGraphemes = inputGraphemes.length
  const coverage = totalGraphemes === 0 ? 1 : supportedGraphemes / totalGraphemes

  // Typographic measure according to classic typography guidelines (45-75 CPL)
  const cpl = lines > 0 ? Math.round(gCount / lines) : 0
  let typographicMeasure: 'short' | 'optimal' | 'long' = 'short'
  if (cpl >= 45 && cpl <= 75) {
    typographicMeasure = 'optimal'
  } else if (cpl > 75) {
    typographicMeasure = 'long'
  }

  return {
    output,
    graphemes: gCount,
    codeUnits,
    bytes,
    words,
    lines,
    cpl,
    totalGraphemes,
    supportedGraphemes,
    coverage,
    typographicMeasure,
  }
}
