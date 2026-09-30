/**
 * A tiny, dependency-free highlighter for the two languages this site shows.
 *
 * It is a scanner, not a parser: it walks the source once and emits tokens,
 * matching each construct with an ordered list of rules. That is enough for
 * the short, hand-written snippets on the page, and it keeps a syntax
 * highlighting dependency out of the bundle for what amounts to a dozen lines
 * of code per block.
 *
 * `scan` returns `{ text, kind }` pairs covering the *entire* input — no
 * character is ever dropped, so joining the tokens back reproduces the source
 * exactly. `verify()` asserts that, and `verify-highlight.ts` checks it
 * against every snippet the site renders.
 */

export type CodeLanguage = "rust" | "toml" | "plain";

export type TokenKind =
  | "text"
  | "keyword"
  | "type"
  | "fn"
  | "string"
  | "number"
  | "comment"
  | "punct"
  | "attr";

export interface Token {
  text: string;
  kind: TokenKind;
}

interface Rule {
  kind: TokenKind;
  /** Non-global, anchored by `exec` position rather than by `^`. */
  re: RegExp;
}

const KEYWORDS_RS = new Set([
  "as", "async", "await", "break", "const", "continue", "crate", "dyn",
  "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in",
  "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return",
  "self", "Self", "static", "struct", "super", "trait", "true", "type",
  "unsafe", "use", "where", "while",
]);

/**
 * Rust: comments, strings, lifetimes, attributes, numbers, paths, keywords.
 *
 * Order matters — the first rule that matches at the cursor wins, so `//` must
 * precede the punctuation class that also contains `/`, and the string rules
 * must precede the bare-identifier fallback.
 */
const RUST_RULES: Rule[] = [
  { kind: "comment", re: /\/\/[^\n]*/ },
  { kind: "string", re: /"(?:\\.|[^"\\])*"/ },
  { kind: "attr", re: /#!?\[[^\]\n]*\]/ },
  { kind: "string", re: /'(?:\\.|[^'\\])'/ },
  // A lifetime is `'a` — a quote followed by an identifier, no closing quote.
  { kind: "text", re: /'[A-Za-z_][A-Za-z0-9_]*/ },
  { kind: "number", re: /\b0x[0-9A-Fa-f_]+\b|\b\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?\b/ },
  // `CircleSpinner::new` / `ratatui::style::Color` — the `::` separators are
  // folded in so a whole path reads as one token.
  { kind: "type", re: /\b[A-Z][A-Za-z0-9_]*(?:::[A-Za-z0-9_]+)*\b/ },
  { kind: "fn", re: /\b[a-z_][A-Za-z0-9_]*(?=\s*(?:\(|::))/ },
  { kind: "punct", re: /[{}()[\];,.:=><+\-*/%&|!?'#@]+/ },
  { kind: "text", re: /\s+/ },
];

/** TOML: comments, strings, tables, booleans, numbers, keys, punctuation. */
const TOML_RULES: Rule[] = [
  { kind: "comment", re: /#[^\n]*/ },
  { kind: "string", re: /"""[\s\S]*?"""|"(?:\\.|[^"\\])*"/ },
  { kind: "string", re: /'[^'\n]*'/ },
  { kind: "attr", re: /\[\[[^\]\n]*\]\]|\[[^\]\n]*\]/ },
  { kind: "number", re: /\b\d[\d_]*(?:\.\d[\d_]*)?\b/ },
  { kind: "punct", re: /[=,.]+/ },
  { kind: "text", re: /\s+/ },
];

/**
 * Scans `src`, falling back to a single-character text token for anything
 * unmatched so no input is ever silently lost.
 */
function scan(src: string, rules: Rule[]): Token[] {
  const out: Token[] = [];
  let i = 0;

  const push = (text: string, kind: TokenKind) => {
    // Merge with the previous token when the kind is unchanged, so a run of
    // plain text does not fragment into one span per character.
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.text += text;
    else out.push({ text, kind });
  };

  while (i < src.length) {
    let matched = false;

    for (const rule of rules) {
      const m = rule.re.exec(src.slice(i));
      if (m && m.index === 0 && m[0].length > 0) {
        push(m[0], rule.kind);
        i += m[0].length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      push(src[i], "text");
      i += 1;
    }
  }

  return out;
}

/**
 * Reclassifies bare identifiers as keywords.
 *
 * The scanner merges adjacent same-kind runs, so by this point a keyword often
 * shares a `text` token with its leading indentation (`"    let"`). Split each
 * text token on word boundaries and mark the words that are keywords, leaving
 * the whitespace between them as its own token.
 */
function keywordize(tokens: Token[], keywords: Set<string>): Token[] {
  const out: Token[] = [];

  for (const t of tokens) {
    // A token made only of separators cannot contain a keyword, so skip the
    // split entirely for pure-whitespace runs.
    if (t.kind !== "text" || !/[A-Za-z_]/.test(t.text)) {
      out.push(t);
      continue;
    }

    const parts = t.text.split(/(\s+)/).filter((p) => p !== "");
    for (const part of parts) {
      out.push(
        keywords.has(part) ? { text: part, kind: "keyword" } : { text: part, kind: "text" }
      );
    }
  }

  return out;
}

/** Highlights Rust source. */
export function highlightRust(src: string): Token[] {
  return keywordize(scan(src, RUST_RULES), KEYWORDS_RS);
}

/** Highlights TOML source. */
export function highlightToml(src: string): Token[] {
  return scan(src, TOML_RULES);
}

/** Highlights any supported language; `plain` passes the source through. */
export function highlight(src: string, language: CodeLanguage): Token[] {
  switch (language) {
    case "rust":
      return highlightRust(src);
    case "toml":
      return highlightToml(src);
    default:
      return [{ text: src, kind: "text" }];
  }
}

/**
 * Re-joins the tokens and compares against the input — used by the test to
 * prove the highlighter never drops or mangles a character.
 */
export function verify(src: string, language: CodeLanguage): boolean {
  return highlight(src, language)
    .map((t) => t.text)
    .join("") === src;
}
