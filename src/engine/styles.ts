export type Cat =
  | "clean"
  | "gothic"
  | "round"
  | "box"
  | "bracket"
  | "wide"
  | "small"
  | "line"
  | "flip"
  | "glitch"
  | "archaic"
  | "code"
  | "emoji";

export interface FancyStyle {
  id: string;
  name: string;
  cat: Cat;
  map: (g: string) => string;
  join?: (parts: string[]) => string;
  keywords?: string[];
}

const cp = String.fromCodePoint;
interface Base {
  u: number;
  l: number;
  d?: number;
  holes?: Record<string, number>;
}

// Mathematical Alphanumeric Symbols: offsets from A / a / 0, plus the "holes"
// that Unicode filled with older Letterlike Symbols code points.
const math = (
  id: string,
  name: string,
  cat: Cat,
  b: Base,
  keywords?: string[],
  join?: (parts: string[]) => string,
): FancyStyle => ({
  id,
  name,
  cat,
  keywords,
  join,
  map: (g) => {
    const h = b.holes?.[g];
    if (h !== undefined) return cp(h);
    const c = g.length === 1 ? (g.codePointAt(0) ?? 0) : 0;
    if (c >= 65 && c <= 90) return cp(b.u + c - 65);
    if (c >= 97 && c <= 122) return cp(b.l + c - 97);
    if (b.d !== undefined && c >= 48 && c <= 57) return cp(b.d + c - 48);
    return g;
  },
});

const AZ = "abcdefghijklmnopqrstuvwxyz";
const lut = (
  id: string,
  name: string,
  cat: Cat,
  to: string,
  digits = "",
  join?: (p: string[]) => string,
  extra?: Record<string, string>,
  keywords?: string[],
): FancyStyle => {
  const t = Array.from(to);
  const d = Array.from(digits);
  return {
    id,
    name,
    cat,
    join,
    keywords,
    map: (g) => {
      if (extra?.[g] !== undefined) return extra[g];
      if (g.length !== 1) return g;
      const i = AZ.indexOf(g.toLowerCase());
      if (i >= 0) return t[i] ?? g;
      const n = "0123456789".indexOf(g);
      return n >= 0 ? (d[n] ?? g) : g;
    },
  };
};

const mark = (
  id: string,
  name: string,
  m: string,
  cat: Cat = "line",
  keywords?: string[],
): FancyStyle => ({
  id,
  name,
  cat,
  keywords,
  map: (g) => (/^\s+$/u.test(g) ? g : g + m),
});

const wrap = (
  id: string,
  name: string,
  pre: string,
  post: string,
  cat: Cat = "emoji",
  keywords?: string[],
): FancyStyle => ({
  id,
  name,
  cat,
  keywords,
  map: (g) => g,
  join: (p) => (p.length === 0 ? "" : `${pre} ${p.join("")} ${post}`),
});

export const FLIP_PUNCT: Record<string, string> = {
  "?": "¿",
  "¿": "?",
  "!": "¡",
  "¡": "!",
  ".": "˙",
  "˙": ".",
  ",": "'",
  "'": ",",
  '"': "„",
  "„": '"',
  "(": ")",
  ")": "(",
  "[": "]",
  "]": "[",
  "{": "}",
  "}": "{",
  "<": ">",
  ">": "<",
  "&": "⅋",
  "⅋": "&",
  _: "‾",
  "‾": "_",
  "/": "\\",
  "\\": "/",
  ";": "؛",
  "؛": ";",
  "`": "ˎ",
  ˎ: "`",
};

const MORSE_MAP: Record<string, string> = {
  a: ".-",
  b: "-...",
  c: "-.-.",
  d: "-..",
  e: ".",
  f: "..-.",
  g: "--.",
  h: "....",
  i: "..",
  j: ".---",
  k: "-.-",
  l: ".-..",
  m: "--",
  n: "-.",
  o: "---",
  p: ".--.",
  q: "--.-",
  r: ".-.",
  s: "...",
  t: "-",
  u: "..-",
  v: "...-",
  w: ".--",
  x: "-..-",
  y: "-.--",
  z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "'": ".----.",
  "!": "-.-.--",
  "/": "-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  "&": ".-...",
  ":": "---...",
  ";": "-.-.-.",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  _: "..--.-",
  '"': ".-..-.",
  $: "...-..-",
  "@": ".--.-.",
};

const NATO_WORDS: Record<string, string> = {
  a: "Alfa",
  b: "Bravo",
  c: "Charlie",
  d: "Delta",
  e: "Echo",
  f: "Foxtrot",
  g: "Golf",
  h: "Hotel",
  i: "India",
  j: "Juliett",
  k: "Kilo",
  l: "Lima",
  m: "Mike",
  n: "November",
  o: "Oscar",
  p: "Papa",
  q: "Quebec",
  r: "Romeo",
  s: "Sierra",
  t: "Tango",
  u: "Uniform",
  v: "Victor",
  w: "Whiskey",
  x: "X-ray",
  y: "Yankee",
  z: "Zulu",
};

const NATO_DIGITS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
];

const CUTEDOTS: Record<string, string> = {
  a: "ɑׁׅ֮",
  b: "ϐׁׅ֒",
  c: "ᝯׁ",
  d: "ժׁׅ݊",
  e: "ꫀׁׅܻ",
  f: "⨍",
  g: "ᧁׁ",
  h: "hׁׅ֮",
  i: "ꪱׁׅ",
  j: "յׁׅ",
  k: "ƙׁׅ֑",
  l: "ᥣׁׅ֪",
  m: "ꩇׁׅ݊",
  n: "ꪀׁׅ",
  o: "ᨵׁׅ",
  p: "℘",
  q: "qׁׅ",
  r: "ꭈׁׅ",
  s: "꯱ׁׅ֒",
  t: "tׁׅ",
  u: "υׁׅ",
  v: "᥎꫶ׁׅ",
  w: "ᨰׁׅ",
  x: "᥊ׁׅ",
  y: "ᨮ꫶ׁׅ֮",
  z: "zׁׅ֬",
};

const WINGDINGS: Record<string, string> = {
  "0": "📁︎",
  "1": "📂︎",
  "2": "📄︎",
  "3": "🗏︎",
  "4": "🗐︎",
  "5": "🗄︎",
  "6": "⌛︎",
  "7": "🖮︎",
  "8": "🖰︎",
  "9": "🖲︎",
  a: "♋︎",
  b: "♌︎",
  c: "♍︎",
  d: "♎︎",
  e: "♏︎",
  f: "♐︎",
  g: "♑︎",
  h: "♒︎",
  i: "♓︎",
  j: "🙰",
  k: "🙵",
  l: "●︎",
  m: "❍︎",
  n: "■︎",
  o: "□︎",
  p: "◻︎",
  q: "❑︎",
  r: "❒︎",
  s: "⬧︎",
  t: "⧫︎",
  u: "◆︎",
  v: "❖︎",
  w: "⬥︎",
  x: "⌧︎",
  y: "⍓︎",
  z: "⌘︎",
  A: "✌︎",
  B: "👌︎",
  C: "👍︎",
  D: "👎︎",
  E: "☜︎",
  F: "☞︎",
  G: "☝︎",
  H: "☟︎",
  I: "✋︎",
  J: "☺︎",
  K: "😐︎",
  L: "☹︎",
  M: "💣︎",
  N: "☠︎",
  O: "⚐︎",
  P: "🏱︎",
  Q: "✈︎",
  R: "☼︎",
  S: "💧︎",
  T: "❄︎",
  U: "🕆︎",
  V: "✞︎",
  W: "🕈︎",
  X: "✠︎",
  Y: "✡︎",
  Z: "☪︎",
};

const utf8 = new TextEncoder();
const toBase64 = (s: string): string => {
  const bytes = utf8.encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const toBase32 = (s: string): string => {
  const bytes = utf8.encode(s);
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  while (out.length % 8 !== 0) out += "=";
  return out;
};

const ZALGO_UP = [
  "\u030d",
  "\u030e",
  "\u0304",
  "\u0305",
  "\u033f",
  "\u0311",
  "\u0306",
  "\u0310",
  "\u0352",
  "\u0357",
  "\u0351",
  "\u030a",
  "\u0342",
];
const ZALGO_MID = [
  "\u0315",
  "\u031b",
  "\u0340",
  "\u0341",
  "\u0358",
  "\u0334",
  "\u0335",
  "\u0336",
  "\u0337",
  "\u0338",
];
const ZALGO_DOWN = [
  "\u0316",
  "\u0317",
  "\u0318",
  "\u0319",
  "\u031c",
  "\u031d",
  "\u031e",
  "\u031f",
  "\u0320",
  "\u0324",
  "\u0325",
  "\u0326",
  "\u0329",
  "\u0330",
  "\u0331",
  "\u0332",
  "\u0333",
];

const STATIC_MARKS = ["\u0337", "\u033f", "\u0316", "\u035f", "\u034f"];

const MEDIEVAL_MARKS: Record<string, string> = {
  a: "\u0363",
  b: "\u0364",
  c: "\u0368",
  d: "\u0369",
  e: "\u0364",
  f: "\u0364",
  g: "\u0364",
  h: "\u036A",
  i: "\u0365",
  j: "\u0365",
  k: "\u0364",
  l: "\u036C",
  m: "\u036B",
  n: "\u0364",
  o: "\u0366",
  p: "\u0364",
  q: "\u0364",
  r: "\u036C",
  s: "\u0364",
  t: "\u036D",
  u: "\u0367",
  v: "\u036E",
  w: "\u036E",
  x: "\u036F",
  y: "\u0365",
  z: "\u0364",
};

export const STYLES: FancyStyle[] = [
  // --- CLEAN & MATHEMATICAL ---
  math("bold", "Bold", "clean", { u: 0x1d400, l: 0x1d41a, d: 0x1d7ce }, [
    "thick",
    "heavy",
    "strong",
    "serif",
  ]),
  math("sans-bold", "Sans bold", "clean", { u: 0x1d5d4, l: 0x1d5ee, d: 0x1d7ec }, [
    "clean",
    "thick",
    "modern",
    "sans",
  ]),
  math("bold-italic", "Bold italic", "clean", { u: 0x1d468, l: 0x1d482 }, [
    "slant",
    "heavy",
    "math",
    "serif",
  ]),
  math("sans-bold-italic", "Sans bold italic", "clean", { u: 0x1d63c, l: 0x1d656 }, [
    "modern",
    "slant",
    "heavy",
    "sans",
  ]),
  math("italic", "Italic", "clean", { u: 0x1d434, l: 0x1d44e, holes: { h: 0x210e } }, [
    "slant",
    "cursive",
    "math",
    "serif",
  ]),
  math("sans", "Sans", "clean", { u: 0x1d5a0, l: 0x1d5ba, d: 0x1d7e2 }, [
    "clean",
    "modern",
    "minimal",
    "sans",
  ]),
  math("sans-italic", "Sans italic", "clean", { u: 0x1d608, l: 0x1d622 }, [
    "clean",
    "slant",
    "modern",
    "sans",
  ]),
  math("mono", "Monospace", "clean", { u: 0x1d670, l: 0x1d68a, d: 0x1d7f6 }, [
    "code",
    "terminal",
    "fixed",
    "developer",
  ]),
  math(
    "double",
    "Double struck",
    "clean",
    {
      u: 0x1d538,
      l: 0x1d552,
      d: 0x1d7d8,
      holes: { C: 0x2102, H: 0x210d, N: 0x2115, P: 0x2119, Q: 0x211a, R: 0x211d, Z: 0x2124 },
    },
    ["blackboard", "math", "hollow", "outline"],
  ),

  // --- GOTHIC & SCRIPT ---
  math(
    "fraktur",
    "Fraktur",
    "gothic",
    {
      u: 0x1d504,
      l: 0x1d51e,
      holes: { C: 0x212d, H: 0x210c, I: 0x2111, R: 0x211c, Z: 0x2128 },
    },
    ["medieval", "blackletter", "old english", "german"],
  ),
  math("bold-fraktur", "Bold fraktur", "gothic", { u: 0x1d56c, l: 0x1d586 }, [
    "medieval",
    "heavy",
    "blackletter",
  ]),
  math(
    "script",
    "Script",
    "gothic",
    {
      u: 0x1d49c,
      l: 0x1d4b6,
      holes: {
        B: 0x212c,
        E: 0x2130,
        F: 0x2131,
        H: 0x210b,
        I: 0x2110,
        L: 0x2112,
        M: 0x2133,
        R: 0x211b,
        e: 0x212f,
        g: 0x210a,
        o: 0x2134,
      },
    },
    ["cursive", "calligraphy", "handwriting"],
  ),
  math("bold-script", "Bold script", "gothic", { u: 0x1d4d0, l: 0x1d4ea }, [
    "cursive",
    "calligraphy",
    "heavy",
  ]),
  math(
    "script-spaced",
    "Tracked script",
    "gothic",
    {
      u: 0x1d49c,
      l: 0x1d4b6,
      holes: {
        B: 0x212c,
        E: 0x2130,
        F: 0x2131,
        H: 0x210b,
        I: 0x2110,
        L: 0x2112,
        M: 0x2133,
        R: 0x211b,
        e: 0x212f,
        g: 0x210a,
        o: 0x2134,
      },
    },
    ["cursive", "calligraphy", "spaced", "tracking", "gothic"],
    (p) => (p.length === 0 ? "" : p.join(" ")),
  ),
  math(
    "fraktur-spaced",
    "Tracked fraktur",
    "gothic",
    {
      u: 0x1d504,
      l: 0x1d51e,
      holes: { C: 0x212d, H: 0x210c, I: 0x2111, R: 0x211c, Z: 0x2128 },
    },
    ["medieval", "blackletter", "spaced", "tracking", "german"],
    (p) => (p.length === 0 ? "" : p.join(" ")),
  ),
  math(
    "bold-fraktur-spaced",
    "Tracked bold fraktur",
    "gothic",
    { u: 0x1d56c, l: 0x1d586 },
    ["medieval", "heavy", "blackletter", "spaced", "tracking"],
    (p) => (p.length === 0 ? "" : p.join(" ")),
  ),
  {
    id: "medieval-above",
    name: "Medieval superscript",
    cat: "gothic",
    keywords: [
      "medieval",
      "manuscript",
      "superscript",
      "accent",
      "diacritic",
      "above",
      "latin",
      "gothic",
    ],
    map: (g) => {
      if (/^\s+$/u.test(g)) return g;
      const c = g.toLowerCase();
      const m = MEDIEVAL_MARKS[c] ?? "\u0364";
      return g + m;
    },
  },

  // --- ROUND / CIRCLED / BUBBLE ---
  math("circled", "Circled", "round", { u: 0x24b6, l: 0x24d0, d: 0x245f, holes: { "0": 0x24ea } }, [
    "round",
    "bubble",
    "circle",
    "white circle",
  ]),
  math(
    "neg-circled",
    "Black circles",
    "round",
    {
      u: 0x1f150,
      l: 0x1f150,
      holes: {
        "0": 0x24ff,
        "1": 0x2776,
        "2": 0x2777,
        "3": 0x2778,
        "4": 0x2779,
        "5": 0x277a,
        "6": 0x277b,
        "7": 0x277c,
        "8": 0x277d,
        "9": 0x277e,
      },
    },
    ["black circle", "bubble", "dark", "inverse", "round", "dingbat"],
  ),
  lut(
    "parenthesized",
    "Parenthesized",
    "round",
    "⒜⒝⒞⒟⒠⒡⒢⒣⒤⒥⒦⒧⒨⒩⒪⒫⒬⒭⒮⒯⒰⒱⒲⒳⒴⒵",
    "0⑴⑵⑶⑷⑸⑹⑺⑻⑼",
    undefined,
    undefined,
    ["brackets", "enclosed", "round", "bubble", "parenthesis"],
  ),
  math(
    "circled-spaced",
    "Tracked circled",
    "round",
    { u: 0x24b6, l: 0x24d0, d: 0x245f, holes: { "0": 0x24ea } },
    ["round", "bubble", "circle", "spaced", "tracking"],
    (p) => (p.length === 0 ? "" : p.join(" ")),
  ),
  math(
    "neg-circled-spaced",
    "Tracked black circles",
    "round",
    {
      u: 0x1f150,
      l: 0x1f150,
      holes: {
        "0": 0x24ff,
        "1": 0x2776,
        "2": 0x2777,
        "3": 0x2778,
        "4": 0x2779,
        "5": 0x277a,
        "6": 0x277b,
        "7": 0x277c,
        "8": 0x277d,
        "9": 0x277e,
      },
    },
    ["black circle", "bubble", "dark", "spaced", "tracking", "round"],
    (p) => (p.length === 0 ? "" : p.join(" ")),
  ),
  lut(
    "parenthesized-spaced",
    "Tracked parenthesized",
    "round",
    "⒜⒝⒞⒟⒠⒡⒢⒣⒤⒥⒦⒧⒨⒩⒪⒫⒬⒭⒮⒯⒰⒱⒲⒳⒴⒵",
    "0⑴⑵⑶⑷⑸⑹⑺⑻⑼",
    (p) => (p.length === 0 ? "" : p.join(" ")),
    undefined,
    ["brackets", "enclosed", "round", "bubble", "parenthesis", "spaced", "tracking"],
  ),
  mark("enclosing-circle", "Enclosing circle", "\u20DD", "round", [
    "enclosing",
    "bubble",
    "round",
    "circle",
    "combining",
  ]),
  mark("enclosing-circle-slash", "Prohibited circle", "\u20E0", "round", [
    "prohibited",
    "no",
    "ban",
    "cancel",
    "circle",
    "slash",
    "enclosing",
  ]),

  // --- BOX / SQUARE / FRAMES ---
  math("squared", "Squares", "box", { u: 0x1f130, l: 0x1f130 }, [
    "box",
    "square",
    "tile",
    "block",
    "enclosed",
  ]),
  math(
    "squared-spaced",
    "Tracked squares",
    "box",
    { u: 0x1f130, l: 0x1f130 },
    ["box", "square", "tile", "block", "spaced", "tracking"],
    (p) => (p.length === 0 ? "" : p.join(" ")),
  ),
  math("neg-squared", "Black squares", "box", { u: 0x1f170, l: 0x1f170 }, [
    "black square",
    "dark",
    "tile",
    "block",
    "box",
    "inverse",
  ]),
  math(
    "neg-squared-spaced",
    "Tracked black squares",
    "box",
    { u: 0x1f170, l: 0x1f170 },
    ["black square", "dark", "tile", "block", "box", "spaced", "tracking"],
    (p) => (p.length === 0 ? "" : p.join(" ")),
  ),
  mark("enclosing-square", "Enclosing square", "\u20DE", "box", [
    "enclosing",
    "box",
    "square",
    "frame",
  ]),
  mark("enclosing-keycap", "Keycap", "\u20E3", "box", [
    "keycap",
    "button",
    "keyboard",
    "box",
    "square",
    "combining",
  ]),
  mark("enclosing-screen", "Retro screen", "\u20E2", "box", [
    "screen",
    "tv",
    "crt",
    "monitor",
    "retro",
    "box",
    "display",
  ]),
  mark("enclosing-diamond", "Enclosing diamond", "\u20DF", "box", [
    "enclosing",
    "rhombus",
    "gem",
    "diamond",
    "box",
  ]),
  mark("enclosing-triangle", "Enclosing triangle", "\u20E4", "box", [
    "enclosing",
    "triangle",
    "delta",
    "prism",
    "pyramid",
    "box",
  ]),
  // --- BRACKETS & FRAMES ---
  wrap("brackets", "Lenticular brackets", "【", "】", "bracket", [
    "asian",
    "japanese",
    "bracket",
    "lenticular",
    "frame",
    "black",
  ]),
  wrap("white-lenticular", "White lenticular", "〖", "〗", "bracket", [
    "white",
    "lenticular",
    "bracket",
    "frame",
    "hollow",
  ]),
  wrap("math-brackets", "White square brackets", "⟦", "⟧", "bracket", [
    "oxford",
    "semantic",
    "logic",
    "math",
    "square",
    "bracket",
    "frame",
  ]),
  wrap("aesthetic", "Double corner brackets", "『", "』", "bracket", [
    "japanese",
    "quote",
    "retro",
    "corner",
    "bracket",
    "frame",
    "double",
  ]),
  wrap("corner-single", "Single corner brackets", "「", "」", "bracket", [
    "japanese",
    "quote",
    "corner",
    "bracket",
    "frame",
    "single",
  ]),
  wrap("double-angle", "Double angle brackets", "《", "》", "bracket", [
    "chinese",
    "book",
    "title",
    "angle",
    "bracket",
    "frame",
  ]),
  wrap("tortoise", "Tortoise brackets", "〔", "〕", "bracket", [
    "shell",
    "brackets",
    "bracket",
    "frame",
  ]),
  wrap("yi-brackets", "Yi brackets", "꒰", "꒱", "bracket", [
    "yi",
    "parentheses",
    "cute",
    "bracket",
    "frame",
  ]),
  wrap("curly-quotes", "Curly quotes", "❝", "❞", "bracket", [
    "quotes",
    "curly",
    "ornament",
    "bracket",
    "frame",
  ]),
  wrap("cyberpunk", "Cyberpunk shades", "░▒▓", "▓▒░", "bracket", [
    "cyberpunk",
    "shade",
    "gradient",
    "ascii",
    "retro",
    "hacker",
    "matrix",
    "terminal",
    "frame",
    "bracket",
  ]),
  wrap("crosses", "Gothic crosses", "†", "†", "bracket", [
    "gothic",
    "cross",
    "dagger",
    "medieval",
    "dark",
    "vampire",
    "alt",
    "frame",
    "bracket",
  ]),
  wrap("wings", "Tibetan wings", "꧁", "꧂", "bracket", [
    "angel",
    "flourish",
    "tibetan",
    "frame",
    "ornament",
    "wings",
    "bracket",
  ]),
  wrap("ornament", "Ornate flourish", "༺", "༻", "bracket", [
    "tibetan",
    "ornament",
    "flourish",
    "royal",
    "frame",
    "vintage",
    "wings",
    "bracket",
  ]),
  wrap("clan", "Clan wings", "乂", "乂", "bracket", [
    "clan",
    "gamer",
    "cross",
    "wings",
    "esports",
    "frame",
    "war",
    "bracket",
  ]),
  wrap("stardust", "Stardust frame", "⋆⁺₊⋆", "⋆⁺₊⋆", "bracket", [
    "stars",
    "sky",
    "galaxy",
    "aesthetic",
    "bracket",
    "frame",
  ]),
  wrap("kawaii", "Kawaii wave", "〜☆", "☆〜", "bracket", [
    "kawaii",
    "cute",
    "wave",
    "star",
    "japanese",
    "bracket",
    "frame",
  ]),
  wrap("arrow-heart", "Arrow heart", "➳❥", "❥➳", "bracket", [
    "arrow",
    "heart",
    "love",
    "cupid",
    "cute",
    "bracket",
    "frame",
  ]),
  {
    id: "thick-block-char",
    name: "Block per letter",
    cat: "bracket",
    keywords: ["block", "thick", "frame", "per letter", "asian", "bracket"],
    map: (g) => (/^\s+$/u.test(g) ? g : `【${g}】`),
  },
  {
    id: "corner-char",
    name: "Corner per letter",
    cat: "bracket",
    keywords: ["corner", "frame", "per letter", "japanese", "bracket"],
    map: (g) => (/^\s+$/u.test(g) ? g : `『${g}』`),
  },
  {
    id: "weirdbox-char",
    name: "Weird box per letter",
    cat: "bracket",
    keywords: ["weird", "box", "frame", "per letter", "glitch", "bracket"],
    map: (g) => (/^\s+$/u.test(g) ? g : `[̲̅${g}]`),
  },
  wrap("little-sparkles", "Little sparkles", "˜”*°•.˜”*°•", "•°*”˜.•°*”˜", "bracket", [
    "sparkles",
    "glitter",
    "flourish",
    "frame",
    "bracket",
  ]),
  wrap("finish-blocks", "Finish blocks", "▀▄▀▄▀▄", "▄▀▄▀▄▀", "bracket", [
    "blocks",
    "finish",
    "race",
    "checker",
    "frame",
    "bracket",
  ]),

  // --- WIDE / VAPORWAVE ---
  {
    id: "wide",
    name: "Wide",
    cat: "wide",
    keywords: ["fullwidth", "vaporwave", "spaced", "asian", "zenkaku"],
    map: (g) => {
      const c = g.length === 1 ? (g.codePointAt(0) ?? 0) : 0;
      if (c === 32) return "\u3000";
      return c > 32 && c < 127 ? cp(c + 0xfee0) : g;
    },
  },
  {
    id: "vaporwave",
    name: "Vaporwave",
    cat: "wide",
    keywords: ["aesthetic", "fullwidth", "spaced", "synthwave", "90s", "chill"],
    map: (g) => {
      const c = g.length === 1 ? (g.codePointAt(0) ?? 0) : 0;
      if (c === 32) return "\u3000";
      return c > 32 && c < 127 ? cp(c + 0xfee0) : g;
    },
    join: (p) => (p.length === 0 ? "" : p.join(" ")),
  },
  {
    id: "spaced",
    name: "Spaced",
    cat: "wide",
    keywords: ["spaced", "letters", "tracking", "aesthetic", "wide", "airy"],
    map: (g) => g,
    join: (p) => (p.length === 0 ? "" : p.join(" ")),
  },
  {
    id: "spaced-dots",
    name: "Dotted tracking",
    cat: "wide",
    keywords: ["spaced", "dot", "middle dot", "tracking", "aesthetic", "minimal", "wide"],
    map: (g) => g,
    join: (p) => (p.length === 0 ? "" : p.join(" · ")),
  },
  {
    id: "spaced-slash",
    name: "Slash tracking",
    cat: "wide",
    keywords: ["spaced", "slash", "tracking", "aesthetic", "editorial", "wide"],
    map: (g) => g,
    join: (p) => (p.length === 0 ? "" : p.join(" / ")),
  },
  {
    id: "spaced-dash",
    name: "Dash tracking",
    cat: "wide",
    keywords: ["spaced", "dash", "em dash", "tracking", "aesthetic", "editorial", "wide"],
    map: (g) => g,
    join: (p) => (p.length === 0 ? "" : p.join(" — ")),
  },
  {
    id: "spaced-pipes",
    name: "Pipe tracking",
    cat: "wide",
    keywords: ["spaced", "pipe", "bar", "vertical", "tracking", "minimal", "wide"],
    map: (g) => g,
    join: (p) => (p.length === 0 ? "" : p.join(" | ")),
  },
  {
    id: "spaced-double",
    name: "Double spaced",
    cat: "wide",
    keywords: ["spaced", "double", "wide", "tracking", "airy", "vaporwave"],
    map: (g) => g,
    join: (p) => (p.length === 0 ? "" : p.join("  ")),
  },

  // --- SMALL / SUB / SUPER ---
  lut("small-caps", "Small caps", "small", "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ", "", undefined, undefined, [
    "capital",
    "mini",
    "tiny",
    "phonetic",
  ]),
  lut(
    "small-spaced",
    "Tracked small caps",
    "small",
    "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ",
    "",
    (p) => (p.length === 0 ? "" : p.join(" ")),
    undefined,
    ["small caps", "tracking", "spaced", "editorial", "aesthetic", "mini"],
  ),
  lut(
    "superscript",
    "Superscript",
    "small",
    "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻ",
    "⁰¹²³⁴⁵⁶⁷⁸⁹",
    undefined,
    { "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾" },
    ["exponent", "high", "tiny", "math", "power"],
  ),
  lut(
    "subscript",
    "Subscript",
    "small",
    "ₐbcdₑfgₕᵢⱼₖₗₘₙₒₚqᵣₛₜᵤᵥwₓyz",
    "₀₁₂₃₄₅₆₇₈₉",
    undefined,
    { "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎" },
    ["chemical", "low", "tiny", "math", "formula"],
  ),
  lut(
    "inverted-small",
    "Inverted small",
    "small",
    "ɐqɔpǝɟɓɥıɾʞןɯuodbɹsʇnʌʍxʎz",
    "",
    undefined,
    undefined,
    ["inverted", "small", "tiny", "phonetic", "mini"],
  ),
  lut(
    "superscript-spaced",
    "Tracked superscript",
    "small",
    "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻ",
    "⁰¹²³⁴⁵⁶⁷⁸⁹",
    (p) => (p.length === 0 ? "" : p.join(" ")),
    { "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾" },
    ["exponent", "high", "tiny", "math", "power", "spaced", "tracking"],
  ),
  lut(
    "subscript-spaced",
    "Tracked subscript",
    "small",
    "ₐbcdₑfgₕᵢⱼₖₗₘₙₒₚqᵣₛₜᵤᵥwₓyz",
    "₀₁₂₃₄₅₆₇₈₉",
    (p) => (p.length === 0 ? "" : p.join(" ")),
    { "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎" },
    ["chemical", "low", "tiny", "math", "formula", "spaced", "tracking"],
  ),
  lut(
    "small-dots",
    "Dotted small caps",
    "small",
    "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ",
    "",
    (p) => (p.length === 0 ? "" : p.join(" · ")),
    undefined,
    ["small caps", "dots", "tracking", "aesthetic", "mini"],
  ),

  // --- LINES & COMBINING MARKS ---
  mark("underline", "Underline", "\u0332", "line", ["line", "bottom", "underscore"]),
  mark("double-underline", "Double underline", "\u0333", "line", ["line", "bottom", "double"]),
  mark("strike", "Strikethrough", "\u0336", "line", ["line", "cross", "cancel", "delete"]),
  mark("slash", "Slash through", "\u0338", "line", ["slashed", "diagonal", "cross", "cancel"]),
  mark("tilde-strike", "Tilde strike", "\u0334", "line", ["wavy", "tilde", "cross", "squiggle"]),
  mark("overline", "Overline", "\u0305", "line", ["macron", "bar", "top", "line"]),
  mark("double-overline", "Double overline", "\u033F", "line", [
    "macron",
    "bar",
    "top",
    "line",
    "double",
  ]),
  mark("wavy-underline", "Wavy underline", "\u0330", "line", [
    "squiggle",
    "wave",
    "bottom",
    "underline",
  ]),
  mark("dotted-underline", "Dotted underline", "\u0323", "line", [
    "dots",
    "point",
    "bottom",
    "underline",
  ]),
  mark("arrow-above", "Vector arrow", "\u20D7", "line", [
    "vector",
    "arrow",
    "physics",
    "math",
    "direction",
    "top",
  ]),
  mark("ring-above", "Halo ring", "\u030A", "line", ["halo", "ring", "angel", "top", "accent"]),
  mark("dots-above", "Umlaut dots", "\u0308", "line", [
    "dots",
    "diaeresis",
    "umlaut",
    "german",
    "metal",
    "top",
  ]),
  mark("backslash", "Backslash through", "\u20E5", "line", [
    "backslash",
    "reverse",
    "slash",
    "cross",
    "overlay",
  ]),
  mark("double-slash", "Double slash", "\u20EB", "line", [
    "double",
    "slash",
    "parallel",
    "cross",
    "overlay",
  ]),
  mark("strike-underline", "Strike underline", "\u0332\u0336", "line", [
    "strike",
    "underline",
    "combo",
    "cross",
    "bottom",
  ]),
  mark("x-above", "X above", "\u033D", "line", ["x", "cross", "top", "mark", "accent"]),
  mark("acute", "Acute accent", "\u0301", "line", ["acute", "accent", "spanish", "french", "top"]),
  mark("circumflex", "Circumflex", "\u0302", "line", [
    "circumflex",
    "hat",
    "accent",
    "french",
    "top",
  ]),
  mark("zigzag", "Lightning zigzag", "\u035B", "line", [
    "zigzag",
    "lightning",
    "electric",
    "wave",
    "top",
    "line",
    "accent",
    "gamer",
  ]),
  mark("firework", "Firework bursts", "҉", "line", [
    "firework",
    "burst",
    "cyrillic",
    "party",
    "top",
  ]),
  mark("vertical-tilde", "Vertical tilde", "̾", "line", [
    "tilde",
    "vertical",
    "stinky",
    "top",
    "accent",
  ]),
  mark("arrow-below", "Arrow below", "͎", "line", ["arrow", "below", "up", "direction", "accent"]),
  mark("x-cross", "X cross", "ͯ", "line", ["x", "cross", "top", "mark", "accent"]),
  mark("dash-below", "Dash below", "̠", "line", ["dash", "below", "minus", "underline", "accent"]),
  mark("cross-above-below", "Cross above below", "͓̽", "line", [
    "cross",
    "x",
    "bandaid",
    "above",
    "below",
  ]),

  // --- FLIP, MIRROR & REVERSE ---
  lut(
    "flip",
    "Upside down",
    "flip",
    "ɐqɔpǝɟᵷɥᴉɾʞlɯuodbɹsʇnʌʍxʎz",
    "0ƖᄅƐᔭϛ9ㄥ86",
    (p) => [...p].reverse().join(""),
    FLIP_PUNCT,
    ["upside down", "reverse", "rotate", "australia", "inverted"],
  ),
  lut(
    "inverted",
    "Inverted",
    "flip",
    "ɐqɔpǝɟᵷɥᴉɾʞlɯuodbɹsʇnʌʍxʎz",
    "0ƖᄅƐᔭϛ9ㄥ86",
    undefined,
    FLIP_PUNCT,
    ["upside down", "rotate", "flip", "forward"],
  ),
  {
    id: "backwards",
    name: "Backwards",
    cat: "flip",
    keywords: ["reverse", "mirror", "backwards", "flip", "order"],
    map: (g) => g,
    join: (p) => (p.length === 0 ? "" : [...p].reverse().join("")),
  },
  {
    id: "backwards-spaced",
    name: "Backwards spaced",
    cat: "flip",
    keywords: ["reverse", "mirror", "backwards", "spaced", "flip", "order"],
    map: (g) => g,
    join: (p) => (p.length === 0 ? "" : [...p].reverse().join(" ")),
  },
  lut(
    "mirrored",
    "Mirrored",
    "flip",
    "AᙠƆᗡƎℲ⅁HIႱʞ⅃MИOꟼϘЯƧTUVWXYƵ",
    "",
    (p) => (p.length === 0 ? "" : [...p].reverse().join("")),
    undefined,
    ["mirror", "reflection", "reverse", "looking glass", "backwards", "horizontal"],
  ),
  lut(
    "mirror-forward",
    "Mirrored forward",
    "flip",
    "AᙠƆᗡƎℲ⅁HIႱʞ⅃MИOꟼϘЯƧTUVWXYƵ",
    "",
    undefined,
    undefined,
    ["mirror", "forward", "reflection", "looking glass", "horizontal"],
  ),
  lut(
    "flip-spaced",
    "Tracked upside down",
    "flip",
    "ɐqɔpǝɟᵷɥᴉɾʞlɯuodbɹsʇnʌʍxʎz",
    "0ƖᄅƐᔭϛ9ㄥ86",
    (p) => (p.length === 0 ? "" : [...p].reverse().join(" ")),
    FLIP_PUNCT,
    ["upside down", "reverse", "rotate", "australia", "inverted", "spaced", "tracking"],
  ),
  lut(
    "mirror-spaced",
    "Tracked mirrored",
    "flip",
    "AᙠƆᗡƎℲ⅁HIႱʞ⅃MИOꟼϘЯƧTUVWXYƵ",
    "",
    (p) => (p.length === 0 ? "" : [...p].reverse().join(" ")),
    undefined,
    ["mirror", "reflection", "reverse", "looking glass", "spaced", "tracking"],
  ),

  // --- GLITCH & ZALGO ---
  {
    id: "zalgo",
    name: "Zalgo glitch",
    cat: "glitch",
    keywords: ["corrupt", "chaos", "cursed", "creepy", "void", "matrix", "glitch"],
    map: (g) => {
      if (/^\s+$/u.test(g)) return g;
      const code = g.codePointAt(0) ?? 0;
      const u = ZALGO_UP[code % ZALGO_UP.length];
      const m = ZALGO_MID[(code * 3) % ZALGO_MID.length];
      const d = ZALGO_DOWN[(code * 7) % ZALGO_DOWN.length];
      return g + u + m + d;
    },
  },
  {
    id: "chaos",
    name: "Chaos void",
    cat: "glitch",
    keywords: ["void", "chaos", "cursed", "creepy", "heavy", "glitch", "abyss", "corrupt"],
    map: (g) => {
      if (/^\s+$/u.test(g)) return g;
      const code = g.codePointAt(0) ?? 0;
      const u1 = ZALGO_UP[code % ZALGO_UP.length];
      const u2 = ZALGO_UP[(code * 2) % ZALGO_UP.length];
      const m = ZALGO_MID[(code * 3) % ZALGO_MID.length];
      const d1 = ZALGO_DOWN[(code * 5) % ZALGO_DOWN.length];
      const d2 = ZALGO_DOWN[(code * 7) % ZALGO_DOWN.length];
      return g + u1 + u2 + m + d1 + d2;
    },
  },
  {
    id: "glitch-static",
    name: "Cyber static",
    cat: "glitch",
    keywords: ["hacker", "noise", "terminal", "cyberpunk", "scanline", "tech"],
    map: (g) => {
      if (/^\s+$/u.test(g)) return g;
      const code = g.codePointAt(0) ?? 0;
      const m1 = STATIC_MARKS[code % STATIC_MARKS.length];
      const m2 = STATIC_MARKS[(code * 2) % STATIC_MARKS.length];
      return g + m1 + m2;
    },
  },
  mark("scanline", "Scanline glitch", "\u0305\u0332", "glitch", [
    "scanline",
    "crt",
    "cyberpunk",
    "terminal",
    "glitch",
    "retro",
    "screen",
  ]),
  {
    id: "redacted",
    name: "Redacted block",
    cat: "glitch",
    keywords: [
      "censored",
      "blackout",
      "classified",
      "scp",
      "cia",
      "spoiler",
      "secret",
      "glitch",
      "redacted",
    ],
    map: (g) => (/^\s+$/u.test(g) ? g : "█"),
  },
  mark("corrupt-bars", "Corrupt strike", "\u0337\u0338", "glitch", [
    "glitch",
    "corrupt",
    "slash",
    "matrix",
    "cyberpunk",
    "bars",
    "error",
  ]),
  mark("vapor-glitch", "Vapor distortion", "\u0334\u033f", "glitch", [
    "glitch",
    "vapor",
    "distortion",
    "cyber",
    "wavy",
    "static",
  ]),
  {
    id: "redacted-shade",
    name: "Shaded redacted",
    cat: "glitch",
    keywords: [
      "censored",
      "shade",
      "classified",
      "spoiler",
      "secret",
      "glitch",
      "redacted",
      "hacker",
    ],
    map: (g) => (/^\s+$/u.test(g) ? g : "▓"),
  },

  // --- ARCHAIC & HISTORIC SCRIPTS ---
  lut("runes", "Runic", "archaic", "ᚨᛒᚲᛞᛖᚠᚷᚺᛁᛃᚲᛚᛗᚾᛟᛈᛩᚱᛊᛏᚢᚡᚹᛉᛇᛉ", "", undefined, undefined, [
    "elder futhark",
    "nordic",
    "viking",
    "norse",
    "magic",
    "archaic",
    "runes",
  ]),
  lut("ogham", "Ogham", "archaic", "ᚐᚁᚉᚇᚓᚃᚌᚆᚔᚔᚉᚂᚋᚅᚑᚚᚊᚏᚄᚈᡠᚃᚅᚎᚓᚎ", "", undefined, undefined, [
    "celtic",
    "irish",
    "trees",
    "druid",
    "archaic",
    "ancient",
  ]),
  lut(
    "gothic-archaic",
    "Gothic script",
    "archaic",
    "𐌰𐌱𐌲𐌳𐌴𐍆𐌲𐌷𐌹𐌾𐌺𐌻𐌼𐌽𐍉𐍀𐌵𐍂𐍃𐍄𐌿𐍅𐍅𐍇𐌹𐌶",
    "",
    undefined,
    undefined,
    ["ulfilas", "visigoth", "ancient", "germanic", "archaic", "gothic", "script"],
  ),
  lut(
    "glagolitic",
    "Glagolitic",
    "archaic",
    "ⰀⰁⰜⰄⰅⰗⰃⰢⰉⰊⰍⰎⰏⰐⰑⰒⰍⰓⰔⰕⰖⰂⰂⰘⰫⰈ",
    "",
    undefined,
    undefined,
    ["slavic", "cyril", "methodius", "ancient", "medieval", "archaic", "script"],
  ),
  lut(
    "phoenician",
    "Phoenician",
    "archaic",
    "𐤀𐤁𐤂𐤃𐤄𐤅𐤂𐤇𐤉𐤉𐤊𐤋𐤌𐤍𐤏𐤐𐤒𐤓𐤔𐤕𐤅𐤅𐤅𐤎𐤉𐤆",
    "",
    undefined,
    undefined,
    ["canaanite", "ancient", "alphabet", "semitic", "archaic", "bronze age"],
  ),

  lut("cherokee", "Cherokee", "archaic", "ᎠᎡᎢᎣᎤᎥᎦᎧᎨᎩᎪᎫᎬᎭᎮᎯᎰᎱᎲᎳᎴᎵᎶᎷᎸᎹ", "", undefined, undefined, [
    "cherokee",
    "syllabary",
    "native",
    "tribal",
    "archaic",
    "script",
  ]),
  lut("syllabics", "Syllabics", "archaic", "ᐃᐄᐅᐆᐇᐈᐉᐊᐋᐌᐍᐎᐏᐐᐑᐒᐓᐔᐕᐖᐗᐘᐙᐚᐛᐜ", "", undefined, undefined, [
    "canadian",
    "inuktitut",
    "cree",
    "syllabary",
    "northern",
    "archaic",
    "script",
  ]),
  lut(
    "greek",
    "Greek lookalike",
    "archaic",
    "ΑΒϹΔΕϜΓΗΙϳΚΛΜΝΟΡϘϱΣΤΥνΩΧγΖ",
    "",
    undefined,
    undefined,
    ["greek", "faux", "fraternity", "sorority", "athens", "archaic", "lookalike"],
  ),
  lut(
    "cyrillic",
    "Cyrillic lookalike",
    "archaic",
    "АВСДЕФҐНІЈКЛМИОРԚЯЅТЦѴШХУЗ",
    "",
    undefined,
    undefined,
    ["russian", "cyrillic", "faux", "soviet", "slavic", "archaic", "lookalike"],
  ),
  lut(
    "coptic",
    "Coptic script",
    "archaic",
    "ⲀⲁⲂⲃⲄⲅⲆⲇⲈⲉⲊⲋⲌⲍⲎⲏⲐⲑⲒⲓⲔⲕⲖⲗⲘⲙ",
    "",
    undefined,
    undefined,
    ["coptic", "egyptian", "alexandria", "gnostic", "ancient", "archaic", "script"],
  ),
  lut(
    "old-italic",
    "Old Italic",
    "archaic",
    "𐌀𐌁𐌂𐌃𐌄𐌅𐌆𐌇𐌈𐌉𐌊𐌋𐌌𐌍𐌎𐌏𐌐𐌑𐌒𐌓𐌔𐌕𐌖𐌗𐌘𐌙",
    "",
    undefined,
    undefined,
    ["old italic", "etruscan", "latin ancestor", "roman", "ancient", "archaic", "script"],
  ),
  lut(
    "tai-viet",
    "Tai Viet script",
    "archaic",
    "ꪖ᥇ᥴᦔꫀᠻᧁꫝ꠸꠹ᛕꪶꪑꪀꪮρꪇ᥅ᦓꪻꪊꪜ᭙᥊ꪗƺ",
    "ᦲ᧒ᒿᗱᔰƼᦆᒣᲖၦ",
    undefined,
    undefined,
    ["tai viet", "tai dam", "lao", "thai", "vietnam", "ancient", "archaic", "script"],
  ),
  lut(
    "yi-nuosu",
    "Yi Nuosu syllables",
    "archaic",
    "ꍏꌃꉓꀸꍟꎇꁅꃅꀤꀭꀘ꒒ꂵꈤꂦꉣꆰꋪꌗ꓄ꀎꃴꅏꊼꌩꁴ",
    "",
    undefined,
    undefined,
    ["yi", "nuosu", "syllables", "sichuan", "tribal", "ancient", "archaic", "script"],
  ),
  lut(
    "asian-stroke",
    "Asian strokes",
    "archaic",
    "卂乃匚ᗪ乇千Ꮆ卄丨ﾌҜㄥ爪几ㄖ卩Ɋ尺丂ㄒㄩᐯ山乂ㄚ乙",
    "",
    undefined,
    undefined,
    ["asian", "japanese", "chinese", "strokes", "kanji", "aesthetic", "archaic", "lookalike"],
  ),
  lut(
    "asian-katakana",
    "Katakana mix",
    "archaic",
    "ﾑ乃ᄃり乇ｷムんﾉﾌズﾚﾶ刀のｱゐ尺丂ｲひ√Wﾒﾘ乙",
    "",
    undefined,
    undefined,
    ["katakana", "hangul", "japanese", "korean", "asian", "ancient", "archaic", "script"],
  ),
  lut(
    "sga",
    "Enchanting table (SGA)",
    "archaic",
    "ᔑʖᓵ↸ᒷ⎓⊣⍑╎⋮ꖌꖎᒲリ𝙹ᖘᑑ∷ᓭℸ⚍⍊∴ᑢ‖⨅",
    "",
    undefined,
    undefined,
    [
      "minecraft",
      "enchanting",
      "sga",
      "galactic",
      "standard galactic",
      "runes",
      "secret",
      "gamer",
      "archaic",
    ],
  ),

  // --- CODE & CIPHERS ---
  {
    id: "regional",
    name: "Regional indicator",
    cat: "code",
    keywords: ["flags", "emoji", "country", "alphabet", "box"],
    map: (g) => {
      if (g.length !== 1) return g;
      const c = g.toUpperCase().charCodeAt(0);
      if (c >= 65 && c <= 90) return `${cp(0x1f1e6 + c - 65)}\u200C`;
      return g;
    },
  },
  {
    id: "morse",
    name: "Morse code",
    cat: "code",
    keywords: ["dots", "dashes", "telegraph", "radio", "signal", "sos"],
    map: (g) => (/^\s+$/u.test(g) ? "/" : (MORSE_MAP[g.toLowerCase()] ?? g)),
    join: (p) => (p.length === 0 ? "" : p.join(" ")),
  },
  lut(
    "braille",
    "Braille",
    "code",
    "⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵",
    "⠚⠁⠃⠉⠙⠑⠋⠛⠓⠊",
    undefined,
    undefined,
    ["dots", "tactile", "blind", "code", "embossed"],
  ),
  {
    id: "rot13",
    name: "ROT13 cipher",
    cat: "code",
    keywords: ["cipher", "caesar", "crypto", "code", "puzzle", "scramble", "shift"],
    map: (g) => {
      if (g.length !== 1) return g;
      const c = g.charCodeAt(0);
      if (c >= 65 && c <= 90) return cp(((c - 65 + 13) % 26) + 65);
      if (c >= 97 && c <= 122) return cp(((c - 97 + 13) % 26) + 97);
      return g;
    },
  },
  {
    id: "binary",
    name: "Binary code",
    cat: "code",
    keywords: ["binary", "01", "bits", "bytes", "computer", "machine", "code"],
    map: (g) => {
      const code = g.codePointAt(0);
      return code !== undefined ? code.toString(2).padStart(8, "0") : g;
    },
    join: (p) => (p.length === 0 ? "" : p.join(" ")),
  },
  {
    id: "hex",
    name: "Hexadecimal",
    cat: "code",
    keywords: ["hex", "hexadecimal", "bytes", "ascii", "developer", "hacker", "code"],
    map: (g) => {
      const code = g.codePointAt(0);
      return code !== undefined ? code.toString(16).toUpperCase().padStart(2, "0") : g;
    },
    join: (p) => (p.length === 0 ? "" : p.join(" ")),
  },
  {
    id: "octal",
    name: "Octal code",
    cat: "code",
    keywords: ["octal", "base8", "bytes", "ascii", "developer", "unix", "chmod", "code"],
    map: (g) => {
      const code = g.codePointAt(0);
      return code !== undefined ? code.toString(8).padStart(3, "0") : g;
    },
    join: (p) => (p.length === 0 ? "" : p.join(" ")),
  },
  {
    id: "decimal",
    name: "Decimal code",
    cat: "code",
    keywords: ["decimal", "ascii", "bytes", "numbers", "developer", "code"],
    map: (g) => {
      const code = g.codePointAt(0);
      return code !== undefined ? code.toString(10).padStart(3, "0") : g;
    },
    join: (p) => (p.length === 0 ? "" : p.join(" ")),
  },
  {
    id: "base64",
    name: "Base64",
    cat: "code",
    keywords: ["base64", "encoding", "data", "bytes", "developer", "transfer", "code"],
    map: (g) => toBase64(g),
    join: (p) => (p.length === 0 ? "" : p.join(" ")),
  },
  {
    id: "base32",
    name: "Base32",
    cat: "code",
    keywords: ["base32", "encoding", "data", "bytes", "developer", "totp", "code"],
    map: (g) => toBase32(g),
    join: (p) => (p.length === 0 ? "" : p.join(" ")),
  },
  {
    id: "url-encode",
    name: "URL encoding",
    cat: "code",
    keywords: ["url", "percent", "encoding", "web", "query", "developer", "code"],
    map: (g) => (/^\s+$/u.test(g) ? "%20" : encodeURIComponent(g)),
    join: (p) => (p.length === 0 ? "" : p.join(" ")),
  },
  {
    id: "html-entity",
    name: "HTML entities",
    cat: "code",
    keywords: ["html", "entity", "ampersand", "web", "escape", "developer", "code"],
    map: (g) =>
      Array.from(g)
        .map((ch) => `&#${ch.codePointAt(0) ?? 0};`)
        .join(""),
    join: (p) => (p.length === 0 ? "" : p.join(" ")),
  },
  {
    id: "unicode-escape",
    name: "Unicode escapes",
    cat: "code",
    keywords: ["unicode", "escape", "backslash", "developer", "debug", "code"],
    map: (g) =>
      Array.from(g)
        .map((ch) => {
          const c = ch.codePointAt(0) ?? 0;
          return c > 0xffff
            ? `\\u{${c.toString(16).toUpperCase()}}`
            : `\\u${c.toString(16).toUpperCase().padStart(4, "0")}`;
        })
        .join(""),
    join: (p) => (p.length === 0 ? "" : p.join(" ")),
  },
  {
    id: "rot47",
    name: "ROT47 cipher",
    cat: "code",
    keywords: ["rot47", "cipher", "rotate", "ascii", "crypto", "code", "puzzle", "scramble"],
    map: (g) => {
      if (g.length !== 1) return g;
      const c = g.charCodeAt(0);
      if (c >= 33 && c <= 126) return String.fromCharCode(33 + ((c - 33 + 47) % 94));
      return g;
    },
  },
  lut("leet", "Leet speak", "code", "48(Ð3ƒ6#1ʝ₭£₥₦0þ9Я57µ√Ш×¥2", "", undefined, undefined, [
    "leet",
    "1337",
    "hacker",
    "gamer",
    "elite",
    "numbers",
  ]),
  {
    id: "atbash",
    name: "Atbash cipher",
    cat: "code",
    keywords: ["atbash", "cipher", "reverse", "hebrew", "crypto", "code", "puzzle", "mirror"],
    map: (g) => {
      if (g.length !== 1) return g;
      const c = g.codePointAt(0) ?? 0;
      if (c >= 65 && c <= 90) return cp(90 - (c - 65));
      if (c >= 97 && c <= 122) return cp(122 - (c - 97));
      return g;
    },
  },
  {
    id: "a1z26",
    name: "A1Z26 numbers",
    cat: "code",
    keywords: ["a1z26", "numbers", "positions", "cipher", "puzzle", "code"],
    map: (g) => {
      if (/^\s+$/u.test(g)) return "/";
      if (g.length !== 1) return g;
      const i = AZ.indexOf(g.toLowerCase());
      return i >= 0 ? String(i + 1) : g;
    },
    join: (p) => (p.length === 0 ? "" : p.join(" ")),
  },
  {
    id: "nato",
    name: "NATO phonetic",
    cat: "code",
    keywords: ["nato", "phonetic", "alpha", "bravo", "radio", "aviation", "military", "spelling"],
    map: (g) => {
      if (/^\s+$/u.test(g)) return "/";
      if (g.length !== 1) return g;
      const w = NATO_WORDS[g.toLowerCase()];
      if (w !== undefined) return w;
      const n = "0123456789".indexOf(g);
      return n >= 0 ? (NATO_DIGITS[n] ?? g) : g;
    },
    join: (p) => (p.length === 0 ? "" : p.join(" ")),
  },
  lut("neon", "Neon signs", "code", "ᗩᗷᑕᗪEᖴGᕼIᒍKᒪᗰᑎOᑭᑫᖇᔕTᑌᐯᗯ᙭Yᘔ", "", undefined, undefined, [
    "neon",
    "sign",
    "glow",
    "syllabics",
    "canadian",
    "gamer",
    "code",
  ]),
  lut(
    "future-alien",
    "Alien glyphs",
    "code",
    "ᗩᗷᑢᕲᘿᖴᘜᕼᓰᒚᖽᒪᘻᘉᓍᕵᕴᖇSᖶᑘᐺᘺ᙭ᖻᗱ",
    "",
    undefined,
    { k: "ᖽᐸ", K: "ᖽᐸ" },
    ["alien", "ufo", "sci-fi", "syllabics", "futuristic", "gamer", "code"],
  ),
  lut(
    "currency",
    "Currency symbols",
    "code",
    "₳฿₵ĐɆ₣₲ⱧłJ₭Ⱡ₥₦Ø₱QⱤ₴₮ɄV₩ӾɎⱫ",
    "",
    undefined,
    undefined,
    ["currency", "money", "forex", "crypto", "cash", "rich", "code"],
  ),
  lut(
    "symbols-latin",
    "Symbol accents",
    "code",
    "åß¢Ðê£ghïjklmñðþqr§†µvwxy¥z",
    "",
    undefined,
    undefined,
    ["symbols", "accents", "latin", "nordic", "metal", "code"],
  ),
  lut(
    "bent",
    "Bent letters",
    "code",
    "ąҍçժҽƒցհìʝҟӀʍղօքզɾʂէմѵա×վՀ",
    "⊘𝟙ϩӠ५ƼϬ7𝟠९",
    undefined,
    undefined,
    ["bent", "armenian", "cyrillic", "twisted", "glitch", "code"],
  ),
  lut(
    "upper-angles",
    "Angular caps",
    "code",
    "ΛBᄃDΣFGΉIJKᄂMПӨPQЯƧƬЦVЩXYZ",
    "",
    undefined,
    undefined,
    ["angular", "angles", "greek", "cyrillic", "sharp", "spartan", "code"],
  ),
  lut("squiggle", "Thai squiggle", "code", "ค๒ς๔єŦﻮђเןкɭ๓ภ๏קợгรՇยשฬאץչ", "", undefined, undefined, [
    "thai",
    "squiggle",
    "hebrew",
    "wiggly",
    "exotic",
    "code",
  ]),
  lut(
    "squiggle2",
    "Euro squiggle",
    "code",
    "αႦƈԃҽϝɠԋιʝƙʅɱɳσρϙɾʂƚυʋɯxყȥ",
    "",
    undefined,
    undefined,
    ["greek", "squiggle", "ipa", "phonetic", "exotic", "code"],
  ),
  lut(
    "squiggle3",
    "Hooked squiggle",
    "code",
    "ǟɮƈɖɛʄɢɦɨʝӄʟʍռօքզʀֆȶʊʋաӼʏʐ",
    "",
    undefined,
    undefined,
    ["hooks", "squiggle", "armenian", "phonetic", "exotic", "code"],
  ),
  lut(
    "squiggle4",
    "Fairytale runes",
    "code",
    "ᏗᏰፈᎴᏋᎦᎶᏂᎥᏠᏦᏝᎷᏁᎧᎮᎤᏒᏕᏖᏬᏉᏇጀᎩፚ",
    "",
    undefined,
    undefined,
    ["fairytale", "cherokee", "ethiopic", "storybook", "squiggle", "code"],
  ),
  lut(
    "squiggle5",
    "Archaic squiggle",
    "code",
    "ąცƈɖɛʄɠɧıʝƙƖɱŋơ℘զཞʂɬų۷ῳҳყʑ",
    "",
    undefined,
    undefined,
    ["georgian", "squiggle", "tibetan", "ancient", "exotic", "code"],
  ),
  lut("squiggle6", "Lao squiggle", "code", "ค๖¢໓ēfງhiวkl๓ຖ໐p๑rŞtนงຟxฯช", "", undefined, undefined, [
    "lao",
    "thai",
    "squiggle",
    "southeast asia",
    "exotic",
    "code",
  ]),
  lut(
    "symbol-per-letter",
    "Symbol alphabet",
    "code",
    "𓂅✦✧⊹⋆⌕ꗃ⋈ഒ·⌯﹅﹆ଘꕤꔛ·ǂ𓍼ᯅꮺ⌗ꉂᨒ๑𐂯",
    "",
    undefined,
    { j: "୨୧", J: "୨୧", q: "𓏲ָ", Q: "𓏲ָ" },
    ["symbols", "hieroglyph", "dingbat", "per letter", "mystic", "code"],
  ),
  {
    id: "cute-dots",
    name: "Dotted scribbles",
    cat: "code",
    keywords: ["dots", "scribble", "cute", "hebrew", "diacritics", "exotic", "code"],
    map: (g) => {
      if (g.length !== 1) return g;
      return CUTEDOTS[g.toLowerCase()] ?? g;
    },
  },
  {
    id: "wingdings",
    name: "Wingdings symbols",
    cat: "code",
    keywords: ["wingdings", "symbols", "dingbats", "icons", "secret", "retro", "code"],
    map: (g) => WINGDINGS[g] ?? WINGDINGS[g.toLowerCase()] ?? g,
  },

  // --- SYMBOLS & TYPOGRAPHIC ORNAMENTS ---
  wrap("stars", "Black stars", "★", "★", "emoji", ["stars", "black", "astronomy", "symbol"]),
  wrap("white-stars", "White stars", "☆", "☆", "emoji", ["stars", "white", "hollow", "astronomy"]),
  wrap("sparkle-star", "Sparkle star", "✧", "✧", "emoji", ["glimmer", "shine", "magic", "star"]),
  wrap("flourish-star", "Four-point star", "✦", "✦", "emoji", [
    "star",
    "flourish",
    "aesthetic",
    "sparkle",
  ]),
  wrap("flower", "Floral dingbat", "✿", "✿", "emoji", ["floral", "blossom", "dingbat", "ornament"]),
  wrap("moon", "Crescent moon", "☽", "☾", "emoji", [
    "lunar",
    "night",
    "celestial",
    "witchy",
    "aesthetic",
  ]),
  wrap("sun-moon", "Sun & moon", "☼", "☽", "emoji", [
    "sun",
    "moon",
    "celestial",
    "astronomy",
    "symbol",
  ]),
  wrap("music", "Music notes", "♫", "♪", "emoji", ["song", "melody", "audio", "sound", "tune"]),
  wrap("infinity", "Infinity", "∞", "∞", "emoji", ["forever", "eternal", "loop", "math", "limit"]),
  wrap("fleuron", "Floral heart", "❦", "❦", "emoji", [
    "fleuron",
    "hedera",
    "ivy",
    "printer",
    "ornament",
  ]),
  wrap("asterism", "Asterism", "⁂", "⁂", "emoji", [
    "asterism",
    "stars",
    "triple",
    "printer",
    "dinkus",
  ]),
  wrap("peace", "Peace symbol", "☮", "☮", "emoji", ["peace", "harmony", "retro", "symbol"]),
  wrap("yin-yang", "Yin Yang", "☯", "☯", "emoji", ["yinyang", "tao", "balance", "zen", "symbol"]),
  {
    id: "hearts-between",
    name: "Hearts between",
    cat: "emoji",
    keywords: ["hearts", "love", "between", "spaced", "cute", "romance"],
    map: (g) => g,
    join: (p) => (p.length === 0 ? "" : p.join("♥")),
  },
  {
    id: "arrow-join",
    name: "Arrow tracking",
    cat: "emoji",
    keywords: ["arrows", "tracking", "spaced", "direction", "forward"],
    map: (g) => g,
    join: (p) => (p.length === 0 ? "" : p.join("»")),
  },
  {
    id: "wavy-join",
    name: "Wavy tracking",
    cat: "emoji",
    keywords: ["wavy", "tilde", "tracking", "spaced", "wave", "aesthetic"],
    map: (g) => g,
    join: (p) => (p.length === 0 ? "" : p.join("≋")),
  },
  {
    id: "dotty-join",
    name: "Dotty tracking",
    cat: "emoji",
    keywords: ["dots", "shade", "tracking", "spaced", "pixel", "retro"],
    map: (g) => g,
    join: (p) => (p.length === 0 ? "" : p.join("░")),
  },
  wrap("kirby-hug", "Kirby hug", "(っ◔◡◔)っ ♥", "♥", "emoji", [
    "kirby",
    "hug",
    "cute",
    "love",
    "kawaii",
  ]),
  wrap("kaomoji-joy", "Kaomoji joy", "(˶ᵔᵕᵔ˶)", "(˶ᵔᵕᵔ˶)", "emoji", [
    "kaomoji",
    "kawaii",
    "cute",
    "happy",
    "face",
    "emoticon",
    "frame",
  ]),
];
