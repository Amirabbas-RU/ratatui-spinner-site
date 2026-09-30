/**
 * Proves the highlighter is lossless.
 *
 *   npx tsx scripts/verify-highlight.ts
 *
 * Every snippet the site renders is fed through the highlighter twice: once
 * whole, once line by line (which is what `CodeBlock` actually does). Both
 * must rejoin to the exact input, and the two token streams must agree. A
 * character dropped in the highlighter would silently corrupt a code sample,
 * so this fails loudly instead.
 */

import {
  CARGO_GIT,
  CARGO_PATH,
  EMBED,
  FIRST_SPINNER,
  TICK_LOOP,
} from "../src/components/install.snippets";
import { highlight, verify, type CodeLanguage } from "../src/lib/highlight";

const SNIPPETS: { name: string; language: CodeLanguage; code: string }[] = [
  { name: "CARGO_GIT", language: "toml", code: CARGO_GIT },
  { name: "CARGO_PATH", language: "toml", code: CARGO_PATH },
  { name: "FIRST_SPINNER", language: "rust", code: FIRST_SPINNER },
  { name: "TICK_LOOP", language: "rust", code: TICK_LOOP },
  { name: "EMBED", language: "rust", code: EMBED },
];

let failures = 0;

const fail = (msg: string) => {
  console.error(`  ✗ ${msg}`);
  failures++;
};

console.log("Highlighting is lossless:\n");

for (const { name, language, code } of SNIPPETS) {
  const notes: string[] = [];

  if (!verify(code, language)) {
    fail(`${name}: whole-block tokens do not rejoin to the source`);
  }

  const lines = code.split("\n");
  const perLine = lines.map((line) => highlight(line, language));

  const rejoined = perLine
    .map((tokens) => tokens.map((t) => t.text).join(""))
    .join("\n");
  if (rejoined !== code) {
    fail(`${name}: per-line tokens do not rejoin to the source`);
  }

  // Per-line scanning must colour identically to whole-block scanning, or a
  // block would look different depending on how it happened to be wrapped.
  // Token *boundaries* legitimately differ — whole-block scanning merges two
  // same-kind runs across a newline — so compare the kind of every character
  // rather than the shape of the token list.
  const kindPerChar = (tokens: { text: string; kind: string }[]) =>
    tokens.flatMap((t) => Array<string>(t.text.length).fill(t.kind));

  // Re-insert the newlines that per-line scanning split on, so both streams
  // are indexed against the same source.
  const perLineChars = perLine.flatMap((tokens, i) =>
    i === 0 ? kindPerChar(tokens) : ["text", ...kindPerChar(tokens)]
  );
  const wholeChars = kindPerChar(highlight(code, language));

  if (perLineChars.length !== wholeChars.length) {
    fail(`${name}: per-line scan covered ${perLineChars.length} chars, whole-block ${wholeChars.length}`);
  } else if (perLineChars.some((kind, i) => kind !== wholeChars[i])) {
    fail(`${name}: per-line and whole-block colouring differs`);
  }

  const flat = perLine.flat();

  const kinds = new Set(flat.map((t) => t.kind));
  notes.push(`${code.split("\n").length} lines`, `${kinds.size} kinds`);

  console.log(`  ✓ ${name.padEnd(14)} ${notes.join(", ")}`);
}

// The highlighter must survive input that has no rule at all, rather than
// dropping it — the fallback path is the one that keeps output honest.
const EDGE_CASES: { name: string; language: CodeLanguage; code: string }[] = [
  { name: "empty", language: "rust", code: "" },
  { name: "emoji", language: "rust", code: "let s = \"⠿⠿\"; 🌀" },
  { name: "nested quotes", language: "rust", code: 'let s = "a \\" b";' },
  { name: "raw char", language: "rust", code: "let c = 'x'; let l = &'a y;" },
  { name: "unterminated", language: "toml", code: 'key = "no end' },
  { name: "multiline", language: "toml", code: 'k = """\na\nb\n"""' },
  { name: "tabs + crlf", language: "rust", code: "fn a() {\r\n\tlet x = 1;\r\n}" },
];

console.log("\nEdge cases:\n");
for (const { name, language, code } of EDGE_CASES) {
  if (verify(code, language)) console.log(`  ✓ ${name}`);
  else fail(`${name}: input was not preserved`);
}

// Losing a token is invisible in a losslessness check — the text still
// rejoins — so assert the classification of individual words directly.
console.log("\nClassification:\n");
const CASES: { word: string; kind: string }[] = [
  { word: "let", kind: "keyword" },
  { word: "fn", kind: "keyword" },
  { word: "use", kind: "keyword" },
  { word: "return", kind: "keyword" },
  { word: "Frame", kind: "type" },
  { word: "Color::Cyan", kind: "type" },
  // A lowercase identifier is only a call when something follows it, so a
  // bare name stays plain text.
  { word: "render_widget(x)", kind: "fn" },
  { word: "spinner.tick", kind: "text" },
  { word: "64", kind: "number" },
  { word: "// a comment", kind: "comment" },
  { word: '"a string"', kind: "string" },
];

for (const { word, kind } of CASES) {
  const tokens = highlight(`    ${word}`, "rust");
  // The token under test is the first one carrying any non-whitespace — the
  // leading indent is a `text` run that would otherwise match first.
  const hit = tokens.find((t) => /\S/.test(t.text));
  if (hit?.kind === kind) {
    console.log(`  ✓ ${JSON.stringify(word)} → ${kind}`);
  } else {
    fail(`${JSON.stringify(word)} → ${hit?.kind ?? "nothing"}, expected ${kind}`);
  }
}

console.log(
  failures === 0
    ? `\nAll ${SNIPPETS.length + EDGE_CASES.length + CASES.length} checks passed.`
    : `\n${failures} failure(s).`
);
process.exit(failures === 0 ? 0 : 1);
