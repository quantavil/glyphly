# Glyphly · Agent Engineering Guidelines (`AGENTS.md`)

This document serves as the operational guide and architectural specification for AI agents and automated coding assistants working on **Glyphly**.

---

## 1. Project Overview & Philosophy

Glyphly is an aesthetic Unicode typography studio and specimen lab. The core mission is to provide **high-taste, mathematically accurate typographic transformations** with zero visual slop and zero false positives.

### Core Values
1. **Typographic Integrity**: Transformations must preserve grapheme clusters and handle surrogate pairs, combining diacritics, and zero-width joiners (ZWJ) correctly.
2. **Editorial Depth**: Sparse categories are forbidden. Every category must provide genuine typographic utility and aesthetic depth.
3. **Deterministic Performance**: Style transformations are pure functions. Measurement metrics evaluate actual UTF-8 byte payloads and grapheme lengths without phantom counts.
4. **Tactile UX**: Immediate responsiveness, keyboard shortcuts, continuous-scale specimen sizing, and architectural drafting cues (e.g. the precision ruler).

---

## 2. Codebase Structure & Responsibilities

```text
fancy-text/
├── public/
│   └── glyphly.svg             # High-DPI continuous-curvature squircle SVG favicon
├── src/
│   ├── engine/
│   │   ├── engine.ts           # Typography engine: grapheme segmentation, measure(), isGraphemeSupported()
│   │   ├── engine.test.ts      # Automated unit tests asserting mapping, metrics, and taxonomy invariants
│   │   └── styles.ts           # Registry of 188+ styles, lookup tables, and category definitions
│   ├── App.tsx                 # Preact UI: Console panel, specimen river, ruler sync, scale slider, favorites
│   ├── index.css               # Design system tokens, dark/light themes, kinetic CSS animations
│   └── main.tsx                # Application mounting entrypoint
├── biome.json                  # Biome linter and formatter configuration
├── index.html                  # HTML template with typography preconnects
├── package.json                # Project manifest and scripts (Bun 1.4+ engine)
└── LICENSE                     # GNU General Public License v3.0
```

---

## 3. Strict Invariants (Non-Negotiables)

Whenever you modify or expand the codebase, you must preserve these invariants:

### Invariant A: Minimum 8 Styles per Category
- **Every category in `STYLES` must contain at least 8 unique styles.**
- Automated tests strictly enforce this:
  ```ts
  for (const cat of cats) {
    const count = STYLES.filter((s) => s.cat === cat).length
    expect(count).toBeGreaterThanOrEqual(8)
  }
  ```
- If you introduce a new category or reorganize styles, ensure the category count is `≥ 8`.

### Invariant B: Grapheme Cluster Segmentation
- **Never split Unicode strings using `str.split('')` or indexing `str[i]`.**
- Always use `graphemes(text)` in `src/engine/engine.ts`, which wraps `Intl.Segmenter(undefined, { granularity: 'grapheme' })`.
- This ensures multi-codepoint graphemes (e.g., emoji flags, family ZWJ sequences, combining accents) are kept intact.

### Invariant C: True Grapheme Support Evaluation
- Support detection in `isGraphemeSupported(g, style)` must eliminate false positives:
  - Symmetric letters in inverted/flip styles (e.g., `o`, `s`, `x`, `z`) are supported even if unchanged.
  - Punctuation support in flip styles is limited to `FLIP_PUNCT`.
  - Phonetic small-caps must report unmapped characters (`x`/`X`) honestly as unsupported.
  - Superscript must report unmapped characters (`q`/`Q`) honestly as unsupported.
  - Spaced and backwards styles work across all input characters.

### Invariant D: Default Favorites List
- `DEFAULT_FAVORITES` in `src/App.tsx` must maintain **at least 8 unique, diverse styles** across different categories.
- Currently booted with 9 curated styles: `['bold', 'fraktur', 'double', 'sga', 'cyberpunk', 'zalgo', 'small-caps', 'circled', 'wings']`.

### Invariant E: Tooling & Package Manager
- **Bun** is the exclusive package manager and script runner (`bun >= 1.4.0`).
- Do **not** use npm, yarn, or pnpm.

---

## 4. How to Add or Modify Styles

Styles are declared in `src/engine/styles.ts` using helper constructors:

1. **Mathematical Blocks (`math`)**:
   ```ts
   math('style-id', 'Display Name', 'category-id', {
     u: 0x1d400, // Uppercase Latin start codepoint
     l: 0x1d41a, // Lowercase Latin start codepoint
     d: 0x1d7ce, // Optional digits start codepoint
     holes: { ... } // Optional Unicode hole overrides
   }, ['keyword1', 'keyword2'], joinFn)
   ```

2. **Lookup Tables (`lut`)**:
   ```ts
   lut('style-id', 'Display Name', 'category-id',
     'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ', // Latin lookup map
     '⁰¹²³⁴⁵⁶⁷⁸⁹',               // Digit lookup map
     joinFn,                       // Optional joining formatter
     punctMap,                     // Optional punctuation map
     ['keyword1', 'keyword2']      // Discoverability tags
   )
   ```

3. **Combining Mark Overlays (`mark`)**:
   ```ts
   mark('style-id', 'Display Name', '\u0332', 'line', ['keyword1'])
   ```

4. **Decorative Wrappers (`wrap`)**:
   ```ts
   wrap('style-id', 'Display Name', '【', '】', 'bracket', ['keyword1'])
   ```

### After adding or modifying a style:
1. Update `src/engine/engine.ts` if custom support logic is needed in `isGraphemeSupported`.
2. Add a unit test in `src/engine/engine.test.ts`.
3. Run formatting, linting, and tests (see Section 5).

---

## 5. Verification Protocol

Before completing any task, you must execute and verify the following commands:

```bash
# 1. Format code with Biome
bun run format

# 2. Check linting and static analysis
bun run lint

# 3. Run automated tests (all 188+ tests must pass)
bun test

# 4. Verify TypeScript compilation and production bundle build
bun run build
```

### Visual Verification
When modifying UI components, layout styles, or SVG assets:
- Use Playwright with `/usr/bin/chromium` to capture screenshots in headless mode.
- Inspect the captured images using `view_file` to verify visual alignment and responsive behavior.

---

## 6. Git & Commit Conventions

Follow Conventional Commits:
- `feat: ...` for new styles, tools, or visual features.
- `fix: ...` for bug fixes, alignment fixes, or metric corrections.
- `test: ...` for test additions and assertions.
- `docs: ...` for documentation updates.
- `chore: ...` for configuration or dependency updates.
