/**
 * Diffs the TypeScript port against frames dumped from the real Rust crate.
 *
 *   cargo run --release --example dump > /tmp/rust-frames.txt
 *   npx tsx scripts/verify-port.ts /tmp/rust-frames.txt
 *
 * Exits non-zero on the first mismatch batch, so a divergence in the port is
 * a hard failure rather than something to eyeball.
 */

import { readFileSync } from "node:fs";

import {
  BAR_PRESETS,
  BAR_SYMBOL_STYLES,
  barCharSize,
  barFrame,
  circleCharSize,
  circleFrame,
  FLUX_FRAMES,
  fluxCharSize,
  fluxFrame,
  LINEAR_STYLES,
  linearFrame,
  squareCharSize,
  squareFrame,
  type BarMotion,
  type BarOrientation,
  type BarPreset,
  type BarStyleName,
  type BarTrack,
  type Centre,
  type Direction,
  type Flow,
  type FluxFrameName,
  type LinearStyleName,
  type Spin,
} from "../src/lib/spinners";

type Case = (tick: number) => string[][];

interface CaseSpec {
  /** Key prefix, e.g. `circle/r4-auto`. */
  key: string;
  /** Ticks the Rust dump covers for this variant. */
  ticks: number[];
  run: Case;
}

const cases: CaseSpec[] = [];
const add = (key: string, ticks: number[], run: Case) =>
  cases.push({ key, ticks, run });

// Every variant is checked at each of these ticks — a full sweep across the
// wrap point of every animation, not just a sample.
const TICKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/* ── Circle ──────────────────────────────────────────────────────────── */

for (const [label, radius, arcLen, spin] of [
  ["r4-auto", 4, 0, "cw"],
  ["r8-auto", 8, 0, "cw"],
  ["r9-len12", 9, 12, "cw"],
  ["r4-ccw", 4, 0, "ccw"],
  ["r1", 1, 0, "cw"],
  ["r2-len1", 2, 1, "cw"],
  ["r5-len99", 5, 99, "cw"],
  ["r6-tps2", 6, 0, "cw"],
] as const) {
  const tps = label === "r6-tps2" ? 2 : 1;
  add(`circle/${label}`, TICKS, (tick) =>
    circleFrame(tick, { radius, arcLen, spin: spin as Spin, ticksPerStep: tps }).map(
      toChars,
    ),
  );
}

/* ── Square ──────────────────────────────────────────────────────────── */

for (const [label, size, centre, spin] of [
  ["s2-filled", 2, "filled", "cw"],
  ["s2-empty", 2, "empty", "cw"],
  ["s3-filled", 3, "filled", "cw"],
  ["s4-filled", 4, "filled", "cw"],
  ["s4-empty", 4, "empty", "cw"],
  ["s5-filled", 5, "filled", "cw"],
  ["s6-ccw", 6, "filled", "ccw"],
  ["s7-empty", 7, "empty", "cw"],
  ["s8-empty", 8, "empty", "cw"],
  ["s8-tps3", 8, "filled", "cw"],
  ["s8-ccw", 8, "filled", "ccw"],
] as const) {
  const tps = label === "s8-tps3" ? 3 : 1;
  add(`square/${label}`, TICKS, (tick) =>
    squareFrame(tick, {
      size,
      centre: centre as Centre,
      spin: spin as Spin,
      ticksPerStep: tps,
    }).map(toChars),
  );
}

/* ── Rect ────────────────────────────────────────────────────────────── */

for (const [label, size, centre, spin] of [
  ["r2-filled", 2, "filled", "cw"],
  ["r3-empty", 3, "empty", "cw"],
  ["r5-ccw", 5, "filled", "ccw"],
  ["r7-ccw-empty", 7, "empty", "ccw"],
] as const) {
  add(`rect/${label}`, TICKS, (tick) =>
    squareFrame(tick, { size, centre: centre as Centre, spin: spin as Spin }).map(toChars),
  );
}

/* ── Flux ────────────────────────────────────────────────────────────── */

for (const [label, frames, width, height, phaseStep, spin] of [
  ["braille-1x1", "braille", 1, 1, 1, "cw"],
  ["braille-6x1", "braille", 6, 1, 1, "cw"],
  ["braille-4x2", "braille", 4, 2, 1, "cw"],
  ["braille-4x2-ccw", "braille", 4, 2, 1, "ccw"],
  ["braille-4x2-p0", "braille", 4, 2, 0, "cw"],
  ["orbit-5x1", "orbit", 5, 1, 2, "cw"],
  ["classic-4x1", "classic", 4, 1, 1, "cw"],
  ["dice-6x1", "dice", 6, 1, 1, "cw"],
  ["pulse-3x1", "pulse", 3, 1, 1, "cw"],
  ["circlefill-5x1", "circleFill", 5, 1, 1, "cw"],
] as const) {
  add(`flux/${label}`, TICKS, (tick) =>
    fluxFrame(tick, {
      frames: frames as FluxFrameName,
      width,
      height,
      phaseStep,
      spin: spin as Spin,
    }).map(toChars),
  );
}

/* ── Linear ──────────────────────────────────────────────────────────── */

for (const [label, direction, flow, style, totalSlots, litSlots] of [
  ["h-classic-3", "horizontal", "forwards", "classic", 3, 2],
  ["h-classic-3b", "horizontal", "backwards", "classic", 3, 2],
  ["h-classic-1", "horizontal", "forwards", "classic", 1, 1],
  ["h-diamond-6", "horizontal", "forwards", "diamond", 6, 3],
  ["h-braille-5", "horizontal", "forwards", "braille", 5, 2],
  ["h-arrow-4", "horizontal", "forwards", "arrow", 4, 2],
  ["h-square-4", "horizontal", "forwards", "square", 4, 2],
  ["h-bar-5", "horizontal", "forwards", "bar", 5, 2],
  // lit > total clamps; the whole row lights up.
  ["h-all-lit", "horizontal", "forwards", "classic", 4, 9],
  // Wrapping window: 2 lit out of 5 steps 3 and 4 wrap past the end.
  ["h-wrap-5", "horizontal", "forwards", "diamond", 5, 3],
  ["v-classic-3", "vertical", "forwards", "classic", 3, 2],
  ["v-classic-1", "vertical", "forwards", "classic", 1, 2],
  ["v-diamond-4b", "vertical", "backwards", "diamond", 4, 2],
  ["v-arrow-5", "vertical", "forwards", "arrow", 5, 2],
  ["v-braille-4", "vertical", "forwards", "braille", 4, 2],
  ["v-bar-6", "vertical", "backwards", "bar", 6, 1],
  ["v-square-3", "vertical", "forwards", "square", 3, 1],
] as const) {
  add(`linear/${label}`, TICKS, (tick) =>
    linearFrame(tick, {
      direction: direction as Direction,
      flow: flow as Flow,
      style: style as LinearStyleName,
      totalSlots,
      litSlots,
    }).map(toChars),
  );
}

/* ── Bar ─────────────────────────────────────────────────────────────── */

for (const [label, motion, style, track, fadeWidth, width, thickness, spin] of [
  ["bounce-braille", "bounce", "braille", "rail", 3, 20, 1, "cw"],
  ["loop-braille", "loop", "braille", "rail", 3, 20, 1, "cw"],
  ["loop-braille-ccw", "loop", "braille", "rail", 3, 20, 1, "ccw"],
  ["squeeze", "squeeze", "braille", "rail", 3, 20, 1, "cw"],
  ["radiate", "radiate", "braille", "rail", 3, 20, 1, "cw"],
  ["fade0", "bounce", "braille", "rail", 0, 20, 1, "cw"],
  ["fade1", "bounce", "braille", "rail", 1, 20, 1, "cw"],
  ["fade5", "bounce", "braille", "rail", 5, 20, 1, "cw"],
  ["thick2", "bounce", "braille", "rail", 3, 20, 2, "cw"],
  ["full", "bounce", "braille", "full", 3, 20, 1, "cw"],
  ["empty", "bounce", "braille", "empty", 3, 20, 1, "cw"],
  ["block", "bounce", "block", "rail", 3, 20, 1, "cw"],
  ["star", "bounce", "star", "rail", 3, 20, 1, "cw"],
  ["heart", "bounce", "heart", "rail", 3, 20, 1, "cw"],
  ["wave", "bounce", "wave", "rail", 3, 20, 1, "cw"],
  ["arrow", "bounce", "arrow", "rail", 3, 20, 1, "cw"],
  ["narrow-arc", "bounce", "braille", "rail", 3, 8, 1, "cw"],
  ["verynarrow", "bounce", "braille", "rail", 3, 4, 1, "cw"],
] as const) {
  add(`bar/${label}`, TICKS, (tick) =>
    barFrame(tick, {
      motion: motion as BarMotion,
      style: style as BarStyleName,
      track: track as BarTrack,
      fadeWidth,
      width,
      thickness,
      spin: spin as Spin,
    }).map(toChars),
  );
}

for (const [label, motion, style, height] of [
  ["v-bounce", "bounce", "braille", 10],
  ["v-loop", "loop", "braille", 10],
  ["v-squeeze", "squeeze", "braille", 10],
  ["v-radiate", "radiate", "braille", 10],
  ["v-block", "bounce", "block", 10],
] as const) {
  add(`bar/${label}`, TICKS, (tick) =>
    barFrame(tick, {
      orientation: "vertical" as BarOrientation,
      motion: motion as BarMotion,
      style: style as BarStyleName,
      width: height,
    }).map(toChars),
  );
}

for (const preset of BAR_PRESETS) {
  add(`preset/${preset}`, TICKS, (tick) =>
    barFrame(tick, { preset: preset as BarPreset, width: 20 }).map(toChars),
  );
}

/* ── Run ─────────────────────────────────────────────────────────────── */

function toChars(row: { char: string }[]) {
  return row.map((c) => c.char);
}

const path = process.argv[2] ?? "/tmp/rust-frames.txt";
const text = readFileSync(path, "utf8");

// Parse `### key` followed by the frame body, with spaces tilde-masked.
const rust = new Map<string, string[][]>();
{
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("### ") || lines[i].startsWith("### char_size")) continue;
    const key = lines[i].slice(4).trim();
    const body: string[] = [];
    for (let j = i + 1; j < lines.length && lines[j] !== ""; j++) {
      body.push(lines[j].replace(/~/g, " "));
    }
    // Trailing blank braille rows are part of the frame; keep them.
    while (body.length && body[body.length - 1].trim() === "") body.pop();
    rust.set(key, body.map((row) => [...row]));
    i += body.length;
  }
}

let checked = 0;
let failed = 0;
const failures: string[] = [];

for (const { key, ticks, run } of cases) {
  for (const tick of ticks) {
    const fullKey = `${key}/t${tick}`;
    const expected = rust.get(fullKey);
    if (!expected) {
      failures.push(`MISSING in rust dump: ${fullKey}`);
      failed += 1;
      continue;
    }

    const actual = run(tick);
    checked += 1;
    if (!sameFrame(expected, actual)) {
      failed += 1;
      failures.push(
        `${fullKey}\n  rust: ${JSON.stringify(expected)}\n  ts:   ${JSON.stringify(actual)}`,
      );
    }
  }
}

function sameFrame(a: string[][], b: string[][]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].join("") !== b[i].join("")) return false;
  }
  return true;
}

/* ── Glyph table parity ──────────────────────────────────────────────── */

// Every hand-transcribed constant in the port, checked against the crate.
const tables = {
  linear: Object.entries(LINEAR_STYLES).map(
    ([name, pair]) => `${name} ${pair[0]} ${pair[1]}`,
  ),
  flux: Object.entries(FLUX_FRAMES).map(
    ([name, seq]) => `${name} ${(seq as readonly string[]).join("")}`,
  ),
  bar: ["braille", ...BAR_SYMBOL_STYLES].map((name) => {
    // Render a rail bar in this style; the row uses exactly two distinct
    // glyphs, in order: the arc character then the track character.
    const frame = barFrame(0, {
      style: name as BarStyleName,
      track: "rail",
      fadeWidth: 0,
      width: 12,
      thickness: 1,
    });
    const row = frame[0].map((c) => c.char);
    const distinct = [...new Set(row)];
    return `${name} ${distinct.join("")}`;
  }),
};

{
  const lines = text.split("\n");
  const start = lines.indexOf("### tables");
  const end = lines.indexOf("### char_size");
  const section = lines.slice(start + 1, end);
  const expected = new Map<string, string>();
  let group = "";
  for (const line of section) {
    if (line === "linear" || line === "flux" || line === "bar") {
      group = line;
    } else if (line.trim()) {
      const [name, ...rest] = line.split(" ");
      expected.set(`${group}/${name}`, rest.join(" "));
    }
  }

  for (const [group, rows] of Object.entries(tables)) {
    for (const row of rows) {
      const name = row.split(" ")[0];
      const key = `${group}/${name}`;
      checked += 1;
      const want = expected.get(key);
      if (want === undefined) {
        failed += 1;
        failures.push(`MISSING in rust tables: ${key}`);
      } else if (want !== row.slice(name.length + 1)) {
        failed += 1;
        failures.push(
          `table ${key}: rust=${JSON.stringify(want)} ts=${JSON.stringify(
            row.slice(name.length + 1),
          )}`,
        );
      }
    }
  }
}

/* ── char_size parity ────────────────────────────────────────────────── */

/**
 * Parsed from the dump rather than hardcoded, so the Rust side is the
 * reference. Values are `(cols, rows)` tuples, except a bar — which is
 * `Option`, and `None` when its width is auto.
 */
const expectedSizes = new Map<string, string>();
{
  // Names contain a space (`circle r4`, `bar 1x1`) and the value is either a
  // bare tuple `(5, 3)`, a wrapped one `Some((20, 1))`, or `None`. So the value
  // is matched off the *end* of the line and the name is whatever precedes it.
  const LINE = /^(.*?)\s+(None|Some\(\((-?\d+),\s*(-?\d+)\)\)|\((\-?\d+),\s*(\-?\d+)\))$/;
  const lines = text.split("\n");
  const start = lines.indexOf("### char_size");
  for (const line of lines.slice(start + 1)) {
    if (!line.trim()) continue;
    const m = line.match(LINE);
    if (!m) {
      failed += 1;
      failures.push(`unparsed char_size line: ${line}`);
      continue;
    }
    const [, name, raw, a1, a2, b1, b2] = m;
    const cols = a1 ?? b1;
    const rows = a2 ?? b2;
    expectedSizes.set(
      name,
      raw === "None" ? "None" : `${cols},${rows}`,
    );
  }
}

const actualSizes = new Map<string, string>([
  ["circle r4", fmt(circleCharSize({ radius: 4 }))],
  ["circle r8", fmt(circleCharSize({ radius: 8 }))],
  ["circle r9", fmt(circleCharSize({ radius: 9 }))],
  ...[2, 3, 4, 5, 6, 7, 8].map((s) => [
    `square s${s}`,
    fmt(squareCharSize(s)),
  ] as [string, string]),
  ["flux 4x2", fmt(fluxCharSize({ width: 4, height: 2 }))],
  ["bar 20x1", fmt(barCharSize({ width: 20, thickness: 1 }))],
  // A bar with auto width has no intrinsic size; the crate returns None.
  ["bar auto", fmt(barCharSize({ width: 0 }))],
  // A bar narrower than 3 is clamped, not shrunk.
  ["bar 1x1", fmt(barCharSize({ width: 1, thickness: 1 }))],
]);

function fmt(size: { cols: number; rows: number } | null) {
  return size === null ? "None" : `${size.cols},${size.rows}`;
}

for (const [key, expected] of expectedSizes) {
  const actual = actualSizes.get(key);
  checked += 1;
  if (actual === undefined) {
    failed += 1;
    failures.push(`char_size ${key}: present in the rust dump, not checked on the TS side`);
  } else if (actual !== expected) {
    failed += 1;
    failures.push(`char_size ${key}: rust=${expected} ts=${actual}`);
  }
}

// A case checked on the TS side but absent from the dump means the dump is
// stale — the comparison above would silently pass.
for (const key of actualSizes.keys()) {
  if (!expectedSizes.has(key)) {
    checked += 1;
    failed += 1;
    failures.push(`char_size ${key}: checked in TS but missing from the rust dump`);
  }
}

if (failures.length) {
  console.error(`\n${failed} mismatch(es) out of ${checked} checks:\n`);
  for (const f of failures) console.error(`  ${f}\n`);
  process.exit(1);
}

console.log(`All ${checked} checks match the real crate.`);
