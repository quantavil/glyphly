import { describe, expect, it } from 'vitest'
import { graphemes, isGraphemeSupported, measure, transform } from './engine'
import { STYLES } from './styles'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

// Per-char framers and ligature styles emit multiple graphemes per letter by
// design (e.g. 【H】, K → ᖽᐸ, j → ୨୧); covered by dedicated tests below.
const MULTI_GRAPHEME = new Set([
  'thick-block-char',
  'corner-char',
  'weirdbox-char',
  'future-alien',
  'symbol-per-letter',
])

describe('styles', () => {
  for (const s of STYLES.filter((x) => !x.join && x.cat !== 'line' && !MULTI_GRAPHEME.has(x.id))) {
    it(`${s.name} maps all 52 letters to assigned characters`, () => {
      const out = transform(LETTERS, s)
      expect(/\p{Cn}/u.test(out)).toBe(false)
      expect(graphemes(out)).toHaveLength(52)
    })
  }
})

describe('graphemes', () => {
  it('keeps emoji sequences whole', () => {
    expect(graphemes('a👨‍👩‍👧b')).toHaveLength(3)
  })
  it('collapses whitespace and reverses flipped text', () => {
    const flip = STYLES.find((s) => s.id === 'flip')
    expect(flip && transform('ab\n c', flip)).toBe('ɔ ᗺɐ'.replace('ᗺ', 'q'))
  })
})

const getStyle = (id: string) => {
  const s = STYLES.find((x) => x.id === id)
  if (!s) throw new Error(`Style ${id} not found`)
  return s
}

describe('flip enhancements', () => {
  const flip = getStyle('flip')

  it('flips digits properly', () => {
    expect(transform('012', flip)).toBe('ᄅƖ0')
  })

  it('flips punctuation properly', () => {
    expect(transform('Hi?!', flip)).toBe('¡¿ᴉɥ')
  })
})

describe('measure', () => {
  it('measures plain text metrics correctly', () => {
    const m = measure('Hello world')
    expect(m.output).toBe('Hello world')
    expect(m.graphemes).toBe(11)
    expect(m.codeUnits).toBe(11)
    expect(m.bytes).toBe(11)
    expect(m.words).toBe(2)
    expect(m.lines).toBe(1)
    expect(m.coverage).toBe(1)
    expect(m.typographicMeasure).toBe('short')
  })

  it('measures styled text byte expansion accurately', () => {
    const bold = getStyle('bold')
    const m = measure('Hello', bold)
    expect(m.output).toBe('𝐇𝐞𝐥𝐥𝐨')
    expect(m.graphemes).toBe(5)
    expect(m.codeUnits).toBe(10) // surrogate pairs
    expect(m.bytes).toBe(20) // 4 bytes per math bold character
    expect(m.coverage).toBe(1)
  })

  it('measures typographic line length thresholds', () => {
    const shortText = 'Short line'
    const optimalText = 'A'.repeat(55)
    const longText = 'A'.repeat(85)

    expect(measure(shortText).typographicMeasure).toBe('short')
    expect(measure(optimalText).typographicMeasure).toBe('optimal')
    expect(measure(longText).typographicMeasure).toBe('long')
  })

  it('eliminates false positives for multi-line text by evaluating CPL', () => {
    // 2 lines of 50 chars each -> total 100+ chars, but CPL is 50 -> optimal
    const multiLineOptimal = `${'A'.repeat(50)}\n${'B'.repeat(50)}`
    const m = measure(multiLineOptimal)
    expect(m.lines).toBe(2)
    expect(m.cpl).toBeGreaterThanOrEqual(45)
    expect(m.cpl).toBeLessThanOrEqual(75)
    expect(m.typographicMeasure).toBe('optimal')
  })

  it('keeps line count consistent between plain and styled text', () => {
    const bold = getStyle('bold')
    const multi = 'First line\nSecond line\nThird line'
    const plainM = measure(multi)
    const styledM = measure(multi, bold)
    expect(plainM.lines).toBe(3)
    expect(styledM.lines).toBe(3)
  })

  it('handles empty text edge cases without phantom metrics for wrappers', () => {
    const m = measure('')
    expect(m.graphemes).toBe(0)
    expect(m.bytes).toBe(0)
    expect(m.words).toBe(0)
    expect(m.lines).toBe(0)
    expect(m.cpl).toBe(0)
    expect(m.coverage).toBe(1)

    const stars = getStyle('stars')
    const mStars = measure('', stars)
    expect(mStars.output).toBe('')
    expect(mStars.bytes).toBe(0)
    expect(mStars.words).toBe(0)
    expect(mStars.lines).toBe(0)
  })
})

describe('flip bidirectional enhancements', () => {
  const flip = getStyle('flip')

  it('supports bidirectional punctuation flipping', () => {
    expect(transform('a/b;c\'d"e', flip)).toBe('ǝ„p,ɔ؛q\\ɐ')
    // Flipping inverted punctuation back returns standard ASCII
    expect(transform('¡¿', flip)).toBe('?!')
  })
})

describe('combining marks line integrity', () => {
  const underline = getStyle('underline')

  it('does not append combining marks to whitespace and newlines', () => {
    expect(underline.map(' ')).toBe(' ')
    expect(underline.map('\n')).toBe('\n')
    expect(underline.map('\t')).toBe('\t')
    expect(underline.map('a')).toBe('a\u0332')
  })
})

describe('false positive elimination in style detection', () => {
  it('removes false positive unsupported flags for symmetric characters in flip', () => {
    const flip = getStyle('flip')
    // 'o', 's', 'x', 'z', 'l', '0', '8' look identical or map to themselves when inverted
    const symmetric = ['o', 's', 'x', 'z', 'l', '0', '8']
    for (const ch of symmetric) {
      expect(isGraphemeSupported(ch, flip)).toBe(true)
    }
    const m = measure('ox 108', flip)
    expect(m.coverage).toBe(1)
  })

  it('removes false positives for wrapper styles (stars and wings)', () => {
    const stars = getStyle('stars')
    const wings = getStyle('wings')

    const mStars = measure('Any arbitrary text 123!', stars)
    const mWings = measure('Any arbitrary text 123!', wings)

    expect(mStars.coverage).toBe(1)
    expect(mWings.coverage).toBe(1)
  })

  it('honestly reports unmapped small-caps x/X as unsupported', () => {
    const smallCaps = getStyle('small-caps')
    expect(isGraphemeSupported('a', smallCaps)).toBe(true)
    expect(isGraphemeSupported('x', smallCaps)).toBe(false)
    expect(isGraphemeSupported('X', smallCaps)).toBe(false)
    const m = measure('fox', smallCaps)
    expect(m.supportedGraphemes).toBe(2)
    expect(m.coverage).toBeCloseTo(2 / 3, 2)
    expect(measure('foam', smallCaps).coverage).toBe(1)
  })

  it('correctly reports true unmapped characters as unsupported', () => {
    const bold = getStyle('bold')
    // Punctuation like '!' is unmapped in math bold
    expect(isGraphemeSupported('!', bold)).toBe(false)
    const m = measure('Hi!', bold)
    // 2 letters + 1 unmapped mark -> 2/3 supported
    expect(m.supportedGraphemes).toBe(2)
    expect(m.coverage).toBeCloseTo(2 / 3, 2)
  })

  it('correctly calculates subscript and superscript coverage without false positives', () => {
    const sub = getStyle('subscript')
    const sup = getStyle('superscript')
    // 'a' has assigned subscript ₐ, but 'b' has no Latin subscript in Unicode standard
    expect(isGraphemeSupported('a', sub)).toBe(true)
    expect(isGraphemeSupported('0', sub)).toBe(true)
    expect(isGraphemeSupported('+', sub)).toBe(true)
    expect(isGraphemeSupported('b', sub)).toBe(false)

    // Superscript supports letters a-z except 'q' which has no Unicode modifier letter
    expect(isGraphemeSupported('a', sup)).toBe(true)
    expect(isGraphemeSupported('+', sup)).toBe(true)
    expect(isGraphemeSupported('q', sup)).toBe(false)
    expect(isGraphemeSupported('Q', sup)).toBe(false)
  })

  it('correctly calculates parenthesized and regional coverage without false positives', () => {
    const paren = getStyle('parenthesized')
    const regional = getStyle('regional')

    expect(isGraphemeSupported('A', paren)).toBe(true)
    expect(isGraphemeSupported('5', paren)).toBe(true)
    expect(isGraphemeSupported('!', paren)).toBe(false)

    expect(isGraphemeSupported('A', regional)).toBe(true)
    expect(isGraphemeSupported('z', regional)).toBe(true)
    expect(isGraphemeSupported('1', regional)).toBe(false)
    expect(isGraphemeSupported('!', regional)).toBe(false)
  })

  it('correctly calculates archaic and code script coverage without false positives', () => {
    const runes = getStyle('runes')
    const ogham = getStyle('ogham')
    const braille = getStyle('braille')
    const morse = getStyle('morse')

    expect(isGraphemeSupported('A', runes)).toBe(true)
    expect(isGraphemeSupported('!', runes)).toBe(false)

    expect(isGraphemeSupported('a', ogham)).toBe(true)
    expect(isGraphemeSupported('!', ogham)).toBe(false)

    expect(isGraphemeSupported('a', braille)).toBe(true)
    expect(isGraphemeSupported('5', braille)).toBe(true)
    expect(isGraphemeSupported('!', braille)).toBe(false)

    expect(isGraphemeSupported('a', morse)).toBe(true)
    expect(isGraphemeSupported('5', morse)).toBe(true)
    expect(isGraphemeSupported('.', morse)).toBe(true)
    expect(isGraphemeSupported('~', morse)).toBe(false)
  })

  it('eliminates false positives for Black circles digits 0-9', () => {
    const negCircled = getStyle('neg-circled')
    expect(isGraphemeSupported('A', negCircled)).toBe(true)
    expect(isGraphemeSupported('0', negCircled)).toBe(true)
    expect(isGraphemeSupported('9', negCircled)).toBe(true)
    expect(isGraphemeSupported('!', negCircled)).toBe(false)
    expect(measure('Hello 123', negCircled).coverage).toBe(1)
  })

  it('rejects unmapped flip punctuation instead of false positives', () => {
    const flip = getStyle('flip')
    const inverted = getStyle('inverted')
    for (const s of [flip, inverted]) {
      for (const ch of ['*', '+', '-', ':', '=', '^', '~']) {
        expect(isGraphemeSupported(ch, s)).toBe(false)
      }
      for (const ch of ['?', '!', '.', ',', "'", '"', '(', ')', '/', '&']) {
        expect(isGraphemeSupported(ch, s)).toBe(true)
      }
      // Symmetric identities stay supported
      for (const ch of ['o', 's', 'x', 'z', 'l', '0', '8']) {
        expect(isGraphemeSupported(ch, s)).toBe(true)
      }
    }
  })

  it('rejects multi-codepoint graphemes instead of false positives', () => {
    const accent = 'é'
    for (const id of ['rot13', 'regional', 'morse', 'braille', 'runes', 'circled', 'squared']) {
      const s = getStyle(id)
      expect(isGraphemeSupported(accent, s)).toBe(false)
      expect(isGraphemeSupported('AB', s)).toBe(false)
    }
    const binary = getStyle('binary')
    const hex = getStyle('hex')
    const wide = getStyle('wide')
    for (const s of [binary, hex, wide]) {
      expect(isGraphemeSupported('AB', s)).toBe(false)
      expect(isGraphemeSupported(accent, s)).toBe(false)
      expect(isGraphemeSupported('A', s)).toBe(true)
    }
    expect(isGraphemeSupported('é', binary)).toBe(false)
    expect(isGraphemeSupported('é', hex)).toBe(false)
  })
})

describe('morse code conversion', () => {
  const morse = getStyle('morse')

  it('transliterates text to Morse code with standard spacing', () => {
    expect(transform('SOS', morse)).toBe('... --- ...')
    expect(transform('Hello World', morse)).toBe('.... . .-.. .-.. --- / .-- --- .-. .-.. -..')
  })

  it('handles empty text edge case', () => {
    expect(transform('', morse)).toBe('')
    expect(measure('', morse).bytes).toBe(0)
  })

  it('handles numbers and punctuation', () => {
    expect(transform('42!', morse)).toBe('....- ..--- -.-.--')
  })
})

describe('vaporwave and backwards transforms', () => {
  const vaporwave = getStyle('vaporwave')
  const backwards = getStyle('backwards')
  const inverted = getStyle('inverted')

  it('transforms text into spaced fullwidth Vaporwave style', () => {
    const out = transform('Vapor', vaporwave)
    expect(out).toBe('Ｖ ａ ｐ ｏ ｒ')
  })

  it('reverses character order in backwards style', () => {
    expect(transform('Hello World', backwards)).toBe('dlroW olleH')
  })

  it('inverts character glyphs without reversing string order', () => {
    expect(transform('hi', inverted)).toBe('ɥᴉ')
  })

  it('mirrors characters and reverses string order', () => {
    const mirrored = getStyle('mirrored')
    expect(transform('HELLO', mirrored)).toBe('O⅃⅃ƎH')
    expect(isGraphemeSupported('H', mirrored)).toBe(true)
    expect(isGraphemeSupported('E', mirrored)).toBe(true)
  })
})

describe('binary and hex encoding styles', () => {
  const binary = getStyle('binary')
  const hex = getStyle('hex')

  it('encodes ASCII text to space-separated binary bytes', () => {
    expect(transform('Hi', binary)).toBe('01001000 01101001')
    expect(measure('Hi', binary).coverage).toBe(1)
  })

  it('encodes ASCII text to space-separated hex bytes', () => {
    expect(transform('Hi', hex)).toBe('48 69')
    expect(measure('Hi', hex).coverage).toBe(1)
  })
})

describe('ROT13 cipher transformation', () => {
  const rot13 = getStyle('rot13')

  it('correctly shifts letters by 13 positions symmetrically', () => {
    expect(transform('Hello World!', rot13)).toBe('Uryyb Jbeyq!')
    expect(transform('Uryyb Jbeyq!', rot13)).toBe('Hello World!')
  })
})

describe('new cipher styles', () => {
  it('encodes leet speak with single-glyph substitutions', () => {
    const leet = getStyle('leet')
    expect(transform('Hello', leet)).toBe('#3££0')
    expect(transform('leet', leet)).toBe('£337')
    expect(isGraphemeSupported('A', leet)).toBe(true)
    expect(isGraphemeSupported('5', leet)).toBe(true)
    expect(isGraphemeSupported('!', leet)).toBe(false)
  })

  it('atbash cipher mirrors the alphabet and preserves case', () => {
    const atbash = getStyle('atbash')
    expect(transform('Hello', atbash)).toBe('Svool')
    expect(transform('Svool', atbash)).toBe('Hello')
    expect(isGraphemeSupported('A', atbash)).toBe(true)
    expect(isGraphemeSupported('1', atbash)).toBe(false)
  })

  it('a1z26 encodes letter positions separated by spaces', () => {
    const a1z26 = getStyle('a1z26')
    expect(transform('Hi', a1z26)).toBe('8 9')
    expect(transform('', a1z26)).toBe('')
    expect(isGraphemeSupported('z', a1z26)).toBe(true)
    expect(isGraphemeSupported('5', a1z26)).toBe(false)
  })

  it('nato spells words with standard phonetic alphabet', () => {
    const nato = getStyle('nato')
    expect(transform('Hi', nato)).toBe('Hotel India')
    expect(transform('A1', nato)).toBe('Alfa One')
    expect(transform('', nato)).toBe('')
    expect(isGraphemeSupported('A', nato)).toBe(true)
    expect(isGraphemeSupported('5', nato)).toBe(true)
    expect(isGraphemeSupported('!', nato)).toBe(false)
  })

  it('octal and decimal encode ASCII bytes like binary and hex', () => {
    const octal = getStyle('octal')
    const decimal = getStyle('decimal')
    expect(transform('Hi', octal)).toBe('110 151')
    expect(transform('Hi', decimal)).toBe('072 105')
    expect(transform('', octal)).toBe('')
    expect(isGraphemeSupported('A', octal)).toBe(true)
    expect(isGraphemeSupported('é', octal)).toBe(false)
    expect(isGraphemeSupported('AB', decimal)).toBe(false)
  })
})

describe('new archaic lookalike scripts', () => {
  it('transliterates text to Cherokee, Syllabics, Greek and Cyrillic', () => {
    expect(transform('Hello', getStyle('cherokee'))).toBe('ᎧᎤᎫᎫᎮ')
    expect(transform('Hello', getStyle('syllabics'))).toBe('ᐊᐇᐎᐎᐑ')
    expect(transform('Hello', getStyle('greek'))).toBe('ΗΕΛΛΟ')
    expect(transform('Hello', getStyle('cyrillic'))).toBe('НЕЛЛО')
  })

  it('supports letters only in lookalike scripts', () => {
    for (const id of ['cherokee', 'syllabics', 'greek', 'cyrillic']) {
      const s = getStyle(id)
      expect(isGraphemeSupported('A', s)).toBe(true)
      expect(isGraphemeSupported('!', s)).toBe(false)
      expect(isGraphemeSupported('AB', s)).toBe(false)
    }
  })

  it('supports letters only in new research scripts and ciphers', () => {
    for (const id of [
      'tai-viet',
      'yi-nuosu',
      'asian-stroke',
      'asian-katakana',
      'neon',
      'future-alien',
      'currency',
      'symbols-latin',
      'bent',
      'upper-angles',
      'squiggle',
      'squiggle2',
      'squiggle3',
      'squiggle4',
      'squiggle5',
      'squiggle6',
      'symbol-per-letter',
      'cute-dots',
      'wingdings',
    ]) {
      const s = getStyle(id)
      expect(isGraphemeSupported('A', s)).toBe(true)
      expect(isGraphemeSupported('AB', s)).toBe(false)
    }
    expect(isGraphemeSupported('5', getStyle('wingdings'))).toBe(true)
    expect(isGraphemeSupported('!', getStyle('tai-viet'))).toBe(false)
  })

  it('transliterates research LUT spot checks', () => {
    expect(transform('Hello', getStyle('tai-viet'))).toBe('ꫝꫀꪶꪶꪮ')
    expect(transform('Hello', getStyle('yi-nuosu'))).toBe('ꃅꍟ꒒꒒ꂦ')
    expect(transform('Hello', getStyle('asian-stroke'))).toBe('卄乇ㄥㄥㄖ')
    expect(transform('Hello', getStyle('neon'))).toBe('ᕼEᒪᒪO')
    expect(transform('Hello', getStyle('currency'))).toBe('ⱧɆⱠⱠØ')
    expect(transform('Hello', getStyle('bent'))).toBe('հҽӀӀօ')
    expect(transform('Hello', getStyle('squiggle4'))).toBe('ᏂᏋᏝᏝᎧ')
    expect(transform('Hello', getStyle('symbol-per-letter'))).toBe('⋈⋆﹅﹅ꕤ')
    expect(transform('Hi', getStyle('wingdings'))).toBe('☟︎♓︎')
    expect(transform('Kk', getStyle('future-alien'))).toBe('ᖽᐸᖽᐸ')
    expect(transform('Jj', getStyle('symbol-per-letter'))).toBe('୨୧୨୧')
  })

  it('frames every letter individually in per-char frame styles', () => {
    expect(transform('Hi', getStyle('thick-block-char'))).toBe('【H】【i】')
    expect(transform('Hi', getStyle('corner-char'))).toBe('『H』『i』')
    expect(transform('Hi', getStyle('weirdbox-char'))).toBe('[̲̅H][̲̅i]')
    for (const id of ['thick-block-char', 'corner-char', 'weirdbox-char']) {
      const s = getStyle(id)
      expect(s.map(' ')).toBe(' ')
      expect(isGraphemeSupported('A', s)).toBe(true)
    }
    expect(transform('H i', getStyle('thick-block-char'))).toBe('【H】 【i】')
  })
})

describe('new spacing and overlay styles', () => {
  it('spaces plain letters without fullwidth conversion', () => {
    const spaced = getStyle('spaced')
    expect(transform('Hi', spaced)).toBe('H i')
    expect(transform('', spaced)).toBe('')
    expect(transform('Hi', spaced)).not.toBe(transform('Hi', getStyle('vaporwave')))
    expect(isGraphemeSupported('!', spaced)).toBe(true)
  })

  it('joins letters with hearts, arrows, waves and shades', () => {
    expect(transform('Hi', getStyle('hearts-between'))).toBe('H♥i')
    expect(transform('Hi', getStyle('arrow-join'))).toBe('H»i')
    expect(transform('Hi', getStyle('wavy-join'))).toBe('H≋i')
    expect(transform('Hi', getStyle('dotty-join'))).toBe('H░i')
    for (const id of ['hearts-between', 'arrow-join', 'wavy-join', 'dotty-join']) {
      const s = getStyle(id)
      expect(transform('', s)).toBe('')
      expect(isGraphemeSupported('!', s)).toBe(true)
      expect(measure('Test 123!', s).coverage).toBe(1)
    }
  })

  it('applies backslash, double-slash and strike-underline marks', () => {
    expect(getStyle('backslash').map('A')).toBe('A\u20E5')
    expect(getStyle('double-slash').map('A')).toBe('A\u20EB')
    expect(getStyle('strike-underline').map('A')).toBe('A\u0332\u0336')
    for (const id of ['backslash', 'double-slash', 'strike-underline']) {
      const s = getStyle(id)
      expect(s.map(' ')).toBe(' ')
      expect(isGraphemeSupported('A', s)).toBe(true)
      expect(isGraphemeSupported('!', s)).toBe(true)
    }
  })

  it('applies x-above, acute and circumflex accent marks', () => {
    expect(getStyle('x-above').map('A')).toBe('A\u033D')
    expect(getStyle('acute').map('A')).toBe('A\u0301')
    expect(getStyle('circumflex').map('A')).toBe('A\u0302')
    for (const id of ['x-above', 'acute', 'circumflex']) {
      const s = getStyle(id)
      expect(s.map(' ')).toBe(' ')
      expect(isGraphemeSupported('A', s)).toBe(true)
      expect(isGraphemeSupported('!', s)).toBe(true)
      expect(measure('Test 123!', s).coverage).toBe(1)
    }
  })
})

describe('math superscript and subscript signs', () => {
  const superStyle = getStyle('superscript')
  const subStyle = getStyle('subscript')

  it('supports math symbols +, -, =, (, ) in superscripts', () => {
    expect(transform('x+1=(2)', superStyle)).toBe('ˣ⁺¹⁼⁽²⁾')
    expect(isGraphemeSupported('+', superStyle)).toBe(true)
    expect(isGraphemeSupported('=', superStyle)).toBe(true)
  })

  it('supports math symbols +, -, =, (, ) in subscripts', () => {
    expect(transform('x-1=(2)', subStyle)).toBe('ₓ₋₁₌₍₂₎')
    expect(isGraphemeSupported('-', subStyle)).toBe(true)
    expect(isGraphemeSupported('(', subStyle)).toBe(true)
  })
})

describe('combining marks line and enclosing integrity', () => {
  const lineStyleIds = [
    'slash',
    'tilde-strike',
    'double-underline',
    'overline',
    'double-overline',
    'wavy-underline',
    'dotted-underline',
    'arrow-above',
    'ring-above',
    'dots-above',
    'x-above',
    'acute',
    'circumflex',
    'firework',
    'vertical-tilde',
    'arrow-below',
    'x-cross',
    'dash-below',
    'cross-above-below',
    'backslash',
    'double-slash',
    'strike-underline',
    'enclosing-circle',
    'enclosing-circle-slash',
    'enclosing-square',
    'enclosing-keycap',
    'enclosing-screen',
    'enclosing-diamond',
    'enclosing-triangle',
    'scanline',
  ]

  for (const id of lineStyleIds) {
    it(`${id} preserves whitespace and transforms printable characters`, () => {
      const s = getStyle(id)
      expect(s.map(' ')).toBe(' ')
      expect(s.map('\n')).toBe('\n')
      expect(s.map('\t')).toBe('\t')
      const mapped = s.map('A')
      expect(mapped).not.toBe('A')
      expect(mapped.startsWith('A')).toBe(true)
      expect(isGraphemeSupported('A', s)).toBe(true)
      expect(isGraphemeSupported('!', s)).toBe(true)
      expect(measure('Test 123!', s).coverage).toBe(1)
    })
  }
})

describe('zalgo glitch determinism and integrity', () => {
  const zalgo = getStyle('zalgo')
  const staticStyle = getStyle('glitch-static')

  it('produces pure deterministic output for identical input', () => {
    const out1 = transform('Cyberpunk', zalgo)
    const out2 = transform('Cyberpunk', zalgo)
    expect(out1).toBe(out2)
  })

  it('preserves visual grapheme cluster count', () => {
    const text = 'Glitch Matrix'
    const out = transform(text, zalgo)
    expect(graphemes(out)).toHaveLength(graphemes(text).length)
  })

  it('does not corrupt whitespace in glitch styles', () => {
    expect(zalgo.map(' ')).toBe(' ')
    expect(zalgo.map('\n')).toBe('\n')
    expect(staticStyle.map(' ')).toBe(' ')
  })
})

describe('regional indicators flag independence', () => {
  const regional = getStyle('regional')

  it('does not fuse adjacent letters into country flag emoji', () => {
    // US should produce 2 distinct grapheme clusters with ZWNJ, not 1 country flag
    const out = transform('US', regional)
    expect(graphemes(out)).toHaveLength(2)
    expect(out.includes('\u200C')).toBe(true)
  })
})

describe('decorative wrapper styles', () => {
  const wrappers = [
    { id: 'stars', pre: '★', post: '★' },
    { id: 'white-stars', pre: '☆', post: '☆' },
    { id: 'sparkle-star', pre: '✧', post: '✧' },
    { id: 'flourish-star', pre: '✦', post: '✦' },
    { id: 'flower', pre: '✿', post: '✿' },
    { id: 'moon', pre: '☽', post: '☾' },
    { id: 'sun-moon', pre: '☼', post: '☽' },
    { id: 'music', pre: '♫', post: '♪' },
    { id: 'infinity', pre: '∞', post: '∞' },
    { id: 'fleuron', pre: '❦', post: '❦' },
    { id: 'asterism', pre: '⁂', post: '⁂' },
    { id: 'peace', pre: '☮', post: '☮' },
    { id: 'yin-yang', pre: '☯', post: '☯' },
    { id: 'math-brackets', pre: '⟦', post: '⟧' },
    { id: 'brackets', pre: '【', post: '】' },
    { id: 'aesthetic', pre: '『', post: '』' },
    { id: 'double-angle', pre: '《', post: '》' },
    { id: 'corner-single', pre: '「', post: '」' },
    { id: 'tortoise', pre: '〔', post: '〕' },
    { id: 'white-lenticular', pre: '〖', post: '〗' },
    { id: 'yi-brackets', pre: '꒰', post: '꒱' },
    { id: 'curly-quotes', pre: '❝', post: '❞' },
    { id: 'arrow-heart', pre: '➳❥', post: '❥➳' },
    { id: 'kawaii', pre: '〜☆', post: '☆〜' },
    { id: 'cyberpunk', pre: '░▒▓', post: '▓▒░' },
    { id: 'crosses', pre: '†', post: '†' },
    { id: 'wings', pre: '꧁', post: '꧂' },
    { id: 'ornament', pre: '༺', post: '༻' },
    { id: 'clan', pre: '乂', post: '乂' },
    { id: 'stardust', pre: '⋆⁺₊⋆', post: '⋆⁺₊⋆' },
    { id: 'kirby-hug', pre: '(っ◔◡◔)っ ♥', post: '♥' },
    { id: 'little-sparkles', pre: '˜”*°•.˜”*°•', post: '•°*”˜.•°*”˜' },
    { id: 'finish-blocks', pre: '▀▄▀▄▀▄', post: '▄▀▄▀▄▀' },
  ]

  for (const { id, pre, post } of wrappers) {
    it(`${id} surrounds text with decorative glyphs and supports all characters`, () => {
      const s = getStyle(id)
      const out = transform('Specimen', s)
      expect(out).toBe(`${pre} Specimen ${post}`)
      expect(measure('Hello World', s).coverage).toBe(1)
    })
  }
})

describe('ciphers and code systems', () => {
  const rot13 = getStyle('rot13')
  const binary = getStyle('binary')
  const hex = getStyle('hex')

  it('rot13 cipher is self-inverting and shifts characters by 13 positions', () => {
    const original = 'Hello World 123'
    const encrypted = transform(original, rot13)
    expect(encrypted).toBe('Uryyb Jbeyq 123')
    const decrypted = transform(encrypted, rot13)
    expect(decrypted).toBe(original)
    expect(isGraphemeSupported('A', rot13)).toBe(true)
    expect(isGraphemeSupported('!', rot13)).toBe(false)
  })

  it('binary encodes characters into 8-bit byte representation', () => {
    const out = transform('Hi', binary)
    expect(out).toBe('01001000 01101001')
    expect(measure('Hi', binary).coverage).toBe(1)
  })

  it('hexadecimal encodes characters into 2-digit uppercase hex bytes', () => {
    const out = transform('Hi', hex)
    expect(out).toBe('48 69')
    expect(measure('Hi', hex).coverage).toBe(1)
  })

  it('encodes text into base64, base32, url, html-entity and unicode-escape bytes', () => {
    expect(transform('Hi', getStyle('base64'))).toBe('SA== aQ==')
    expect(transform('Hi', getStyle('base32'))).toBe('JA====== NE======')
    expect(transform('Hi', getStyle('html-entity'))).toBe('&#72; &#105;')
    expect(transform('Hi', getStyle('unicode-escape'))).toBe('\\u0048 \\u0069')
    for (const id of ['base64', 'base32', 'url-encode', 'html-entity', 'unicode-escape']) {
      const s = getStyle(id)
      expect(measure('Test 123!', s).coverage).toBe(1)
      // visually-identical mappings still count as supported (round-trippable)
      expect(isGraphemeSupported('A', s)).toBe(true)
      expect(isGraphemeSupported('!', s)).toBe(true)
    }
    expect(transform('A B', getStyle('url-encode'))).toBe('A %20 B')
  })

  it('rot47 cipher rotates printable ASCII by 47 positions', () => {
    expect(transform('Hello', getStyle('rot47'))).toBe('w6==@')
    expect(transform('Hello World!', getStyle('rot47'))).toBe('w6==@ (@C=5P')
    const s = getStyle('rot47')
    expect(isGraphemeSupported('A', s)).toBe(true)
    expect(isGraphemeSupported('!', s)).toBe(true)
    expect(isGraphemeSupported('é', s)).toBe(false)
  })
})

describe('mirrored reflections', () => {
  const mirrored = getStyle('mirrored')

  it('mirrored style reverses reading order and reflects glyphs horizontally', () => {
    const out = transform('Hello', mirrored)
    expect(out).toBe('O⅃⅃ƎH')
    expect(measure('Hello', mirrored).coverage).toBe(1)
    expect(isGraphemeSupported('H', mirrored)).toBe(true)
  })
})

describe('ancient and archaic scripts', () => {
  const gothic = getStyle('gothic-archaic')
  const glag = getStyle('glagolitic')
  const phoen = getStyle('phoenician')

  it('transliterates text to Ulfilas Gothic, Glagolitic, and Phoenician scripts', () => {
    expect(transform('Hello', gothic)).toBe('𐌷𐌴𐌻𐌻𐍉')
    expect(transform('Hello', glag)).toBe('ⰢⰅⰎⰎⰑ')
    expect(transform('Hello', phoen)).toBe('𐤇𐤄𐤋𐤋𐤏')
  })

  it('transliterates text to Coptic, Old Italic, and SGA scripts', () => {
    expect(transform('Hello', getStyle('coptic'))).toBe('ⲇⲄⲋⲋⲎ')
    expect(transform('Hello', getStyle('old-italic'))).toBe('𐌇𐌄𐌋𐌋𐌎')
    expect(transform('Minecraft', getStyle('sga'))).toBe('ᒲ╎リᒷᓵ∷ᔑ⎓ℸ')
    for (const id of ['coptic', 'old-italic', 'sga']) {
      const s = getStyle(id)
      expect(isGraphemeSupported('A', s)).toBe(true)
      expect(isGraphemeSupported('!', s)).toBe(false)
      expect(isGraphemeSupported('AB', s)).toBe(false)
    }
  })
})

describe('redacted blackout and custom line marks', () => {
  it('redacted masks characters with blackout blocks while preserving spacing', () => {
    const redacted = getStyle('redacted')
    const redactedShade = getStyle('redacted-shade')
    expect(transform('Secret Pass', redacted)).toBe('██████ ████')
    expect(transform('Secret Pass', redactedShade)).toBe('▓▓▓▓▓▓ ▓▓▓▓')
    expect(isGraphemeSupported('A', redacted)).toBe(true)
    expect(isGraphemeSupported(' ', redacted)).toBe(true)
    expect(isGraphemeSupported('A', redactedShade)).toBe(true)
    expect(isGraphemeSupported(' ', redactedShade)).toBe(true)
  })

  it('zigzag and medieval-above apply diacritics cleanly', () => {
    const zigzag = getStyle('zigzag')
    const medieval = getStyle('medieval-above')
    expect(transform('Hi', zigzag)).toBe('H͛i͛')
    expect(transform('Hi', medieval)).toBe('Hͪiͥ')
    expect(isGraphemeSupported('H', zigzag)).toBe(true)
    expect(isGraphemeSupported('H', medieval)).toBe(true)
  })

  it('corrupt and vapor glitch styles apply marks cleanly', () => {
    const corrupt = getStyle('corrupt-bars')
    const vapor = getStyle('vapor-glitch')
    expect(transform('Hi', corrupt)).toBe('H̷̸i̷̸')
    expect(transform('Hi', vapor)).toBe('H̴̿i̴̿')
    expect(isGraphemeSupported('H', corrupt)).toBe(true)
    expect(isGraphemeSupported('H', vapor)).toBe(true)
  })

  it('wide tracking styles format with precision separators', () => {
    expect(transform('Hey', getStyle('spaced-dash'))).toBe('H — e — y')
    expect(transform('Hey', getStyle('spaced-pipes'))).toBe('H | e | y')
    expect(transform('Hey', getStyle('spaced-double'))).toBe('H  e  y')
  })

  it('small caps and super/sub variations format properly', () => {
    expect(transform('hey', getStyle('small-dots'))).toBe('ʜ · ᴇ · ʏ')
    expect(transform('hey', getStyle('superscript-spaced'))).toBe('ʰ ᵉ ʸ')
    expect(transform('hi', getStyle('subscript-spaced'))).toBe('ₕ ᵢ')
  })

  it('tracked flip styles reverse and space appropriately', () => {
    expect(transform('Hey', getStyle('flip-spaced'))).toBe('ʎ ǝ ɥ')
    expect(transform('Hey', getStyle('mirror-spaced'))).toBe('Y Ǝ H')
  })
})

describe('category and taxonomy integrity', () => {
  it('ensures all categories contain authentic assigned styles', () => {
    const cats = new Set(STYLES.map((s) => s.cat))
    expect(cats.has('clean')).toBe(true)
    expect(cats.has('gothic')).toBe(true)
    expect(cats.has('round')).toBe(true)
    expect(cats.has('box')).toBe(true)
    expect(cats.has('bracket')).toBe(true)
    expect(cats.has('wide')).toBe(true)
    expect(cats.has('small')).toBe(true)
    expect(cats.has('line')).toBe(true)
    expect(cats.has('flip')).toBe(true)
    expect(cats.has('glitch')).toBe(true)
    expect(cats.has('archaic')).toBe(true)
    expect(cats.has('code')).toBe(true)
    expect(cats.has('emoji')).toBe(true)

    // Check box category styles (strictly geometric tiles)
    const boxStyles = STYLES.filter((s) => s.cat === 'box').map((s) => s.id)
    expect(boxStyles).toContain('squared')
    expect(boxStyles).toContain('neg-squared')
    expect(boxStyles).toContain('enclosing-keycap')
    expect(boxStyles).toContain('enclosing-screen')

    // Check bracket category styles (typographic frames & decorative borders)
    const bracketStyles = STYLES.filter((s) => s.cat === 'bracket').map((s) => s.id)
    expect(bracketStyles).toContain('brackets')
    expect(bracketStyles).toContain('white-lenticular')
    expect(bracketStyles).toContain('cyberpunk')
    expect(bracketStyles).toContain('wings')
    expect(bracketStyles).toContain('crosses')
    expect(bracketStyles).toContain('ornament')
    expect(bracketStyles).toContain('clan')

    // Check round category styles
    const roundStyles = STYLES.filter((s) => s.cat === 'round').map((s) => s.id)
    expect(roundStyles).toContain('circled')
    expect(roundStyles).toContain('neg-circled')
    expect(roundStyles).toContain('parenthesized')

    // Ensure every category has at least 8 styles
    for (const cat of cats) {
      const count = STYLES.filter((s) => s.cat === cat).length
      expect(count).toBeGreaterThanOrEqual(8)
    }
  })
})

describe('search keywords discoverability', () => {
  it('ensures all styles have searchable keywords or names', () => {
    for (const s of STYLES) {
      expect(s.keywords === undefined || Array.isArray(s.keywords)).toBe(true)
    }

    const searchStyle = (q: string) =>
      STYLES.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.cat.toLowerCase().includes(q) ||
          (s.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false),
      )

    expect(searchStyle('nordic').map((x) => x.id)).toContain('runes')
    expect(searchStyle('celtic').map((x) => x.id)).toContain('ogham')
    expect(searchStyle('minecraft').map((x) => x.id)).toContain('sga')
    expect(searchStyle('censored').map((x) => x.id)).toContain('redacted')
    expect(searchStyle('cyberpunk').map((x) => x.id)).toContain('cyberpunk')
    expect(searchStyle('corrupt').map((x) => x.id)).toContain('zalgo')
    expect(searchStyle('flags').map((x) => x.id)).toContain('regional')
    expect(searchStyle('dots').map((x) => x.id)).toContain('braille')
    expect(searchStyle('fullwidth').map((x) => x.id)).toContain('vaporwave')
    expect(searchStyle('bubble').map((x) => x.id)).toContain('circled')
    expect(searchStyle('binary').map((x) => x.id)).toContain('binary')
    expect(searchStyle('caesar').map((x) => x.id)).toContain('rot13')
    expect(searchStyle('slavic').map((x) => x.id)).toContain('glagolitic')
    expect(searchStyle('ulfilas').map((x) => x.id)).toContain('gothic-archaic')
    expect(searchStyle('keycap').map((x) => x.id)).toContain('enclosing-keycap')
    expect(searchStyle('mirror').map((x) => x.id)).toContain('mirrored')
    expect(searchStyle('lightning').map((x) => x.id)).toContain('zigzag')
    expect(searchStyle('dagger').map((x) => x.id)).toContain('crosses')
  })
})
