/**
 * Spinner algorithms — a faithful port of `ratatui-spinner` 0.4.18.
 *
 * The crate's contract: a spinner holds no time. You pass it a `tick` and it
 * renders one frame. Every function here keeps that contract — pure in, frame
 * out, and the same tick always produces the same frame.
 *
 * Each builder is a direct translation of the Rust counterpart, keeping its
 * names, its clamping rules and its defaults:
 *
 *   - `SquareEngine`   → src/square_spinner.rs + src/rect_spinner.rs
 *                         (Grid, make_head_map, make_tail_map, step,
 *                          make_centre, centre_bounds, should_switch)
 *   - `CircleEngine`   → src/circle_spinner.rs
 *                         (circle_perimeter, sort_clockwise, arc_len)
 *   - `FluxFrames`     → src/flux_spinner.rs (phase_step wave, 2-D field)
 *   - `LinearSpinner`  → src/linear_spinner.rs (bounce_index, Flow, Direction)
 *   - `BarSpinner`     → src/bar_spinner.rs (RectEngine, VertRectEngine,
 *                         fade_byte, BarTrack, BarStyle)
 *
 * The output is a `Frame`: rows of cells, each cell a glyph plus the tone the
 * crate would paint it in. Colour lives in the view layer so the same frame
 * data can be rendered in any palette.
 */

export const BRAILLE_BASE = 0x2800;

/** Bit index within a braille byte, indexed by `(dotRow % 4, dotCol % 2)`. */
export const BRAILLE_MAP = [
  [0, 3], // row 0: left→0, right→3
  [1, 4], // row 1: left→1, right→4
  [2, 5], // row 2: left→2, right→5
  [6, 7], // row 3: left→6, right→7
] as const;

/* ── Option types — the crate's public enums ─────────────────────────── */

export type Spin = "cw" | "ccw";
export type Centre = "filled" | "empty";
export type Direction = "horizontal" | "vertical";
export type Flow = "forwards" | "backwards";
export type BarMotion = "bounce" | "loop" | "squeeze" | "radiate";
export type BarOrientation = "horizontal" | "vertical";
export type BarTrack = "rail" | "full" | "empty";
/** The two tones every widget paints with: the moving arc and the dim rest. */
export type Tone = "arc" | "dim";

/* ── Frame ───────────────────────────────────────────────────────────── */

/** One terminal cell of a rendered frame. */
export interface Cell {
  /** The glyph to print. */
  char: string;
  /** Which of the widget's two colours paints it. */
  tone: Tone;
}

/** A rendered frame: one array of cells per terminal row. */
export type Frame = Cell[][];

function brailleChar(byte: number): string {
  return String.fromCodePoint(BRAILLE_BASE + byte);
}

function toneCell(char: string, tone: Tone): Cell {
  return { char, tone };
}

/* ── Integer helpers (Rust semantics) ────────────────────────────────── */

/** `usize::div_ceil` — rounds up, for non-negative operands. */
const divCeil = (a: number, b: number) => Math.floor((a + b - 1) / b);

/** `usize` division truncates toward zero. */
const truncDiv = (a: number, b: number) => Math.trunc(a / b);

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(Math.max(n, lo), hi);

const isCounter = (spin: Spin) => spin === "ccw";

/* ── FluxFrames — the 22 built-in glyph sequences ────────────────────── */

/**
 * `FluxFrames` — verbatim from `src/flux_spinner.rs`. Any `'static [char]`
 * slice works; presets are just the convenient ones.
 */
export const FLUX_FRAMES = {
  braille: ["⣾", "⣷", "⣯", "⣟", "⡿", "⢿", "⣽", "⣻"],
  orbit: ["⠁", "⠈", "⠐", "⠠", "⢀", "⡀", "⠄", "⠂"],
  classic: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  line: ["│", "╱", "─", "╲"],
  block: ["▖", "▘", "▝", "▗"],
  arc: ["◜", "◝", "◞", "◟"],
  clock: ["◷", "◶", "◵", "◴"],
  moon: ["◓", "◑", "◒", "◐"],
  triangles: ["▲", "▶", "▼", "◀"],
  pulse: ["⣀", "⣤", "⣶", "⣾", "⣿", "⣾", "⣶", "⣤"],
  bounce: ["⠉", "⠒", "⣀", "⠒"],
  half: ["▀", "▐", "▄", "▌"],
  square: ["◰", "◳", "◲", "◱"],
  dice: ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"],
  bar: ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"],
  corners: ["┌", "┐", "┘", "└"],
  circleFill: ["○", "◔", "◑", "◕", "●"],
  piston: ["▁", "▃", "▅", "▇", "█", "▇", "▅", "▃"],
  star: ["✶", "✷", "✸", "✹"],
  pair: ["⠉", "⠘", "⠰", "⢠", "⣀", "⡄", "⠆", "⠃"],
  diamond: ["◇", "◈", "◆", "◈"],
} as const satisfies Record<string, readonly string[]>;

export type FluxFrameName = keyof typeof FLUX_FRAMES;

/** How many presets `FluxFrames` ships. */
export const FLUX_FRAME_COUNT = Object.keys(FLUX_FRAMES).length;

export interface FluxOptions {
  width?: number;
  height?: number;
  frames?: FluxFrameName | readonly string[];
  /** Frame offset added to each successive cell. `0` synchronises them. */
  phaseStep?: number;
  /** How many ticks each frame is held (default 1; higher = slower). */
  ticksPerStep?: number;
  spin?: Spin;
}

/**
 * `FluxSpinner::build_lines` — each cell is offset by `phase_step` frames from
 * its neighbour, producing a travelling diagonal wave across the field.
 * Counter-clockwise retreats through the frames, which reverses the wave too.
 */
export function fluxFrame(tick: number, options: FluxOptions = {}): Frame {
  const {
    width = 1,
    height = 1,
    frames = FLUX_FRAMES.braille,
    phaseStep = 1,
    ticksPerStep = 1,
    spin = "cw",
  } = options;

  // `frames` is either a preset name or a raw glyph sequence.
  const seq = Array.isArray(frames)
    ? (frames as readonly string[])
    : FLUX_FRAMES[frames as FluxFrameName];
  const n = seq.length;
  if (n === 0) return [];

  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const ccw = isCounter(spin);
  const step = Math.max(1, Math.floor(ticksPerStep));
  const base = Math.max(0, truncDiv(Math.floor(tick), step));

  const rows: Frame = [];
  for (let r = 0; r < h; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < w; c++) {
      // `cell_idx = r * width + c` — the phase runs diagonally, not per-row.
      const phase = (r * w + c) * phaseStep;
      const raw = base + phase;
      const index = ccw ? (n - (raw % n)) % n : raw % n;
      row.push(toneCell(seq[index], "arc"));
    }
    rows.push(row);
  }
  return rows;
}

/** `FluxSpinner::char_size` → `(cols, rows)`. */
export function fluxCharSize(options: FluxOptions = {}) {
  return {
    cols: Math.max(1, options.width ?? 1),
    rows: Math.max(1, options.height ?? 1),
  };
}

/* ── LinearStyle / LinearSpinner ─────────────────────────────────────── */

/** `LinearStyle` — the six `(active, inactive)` symbol pairs. */
export const LINEAR_STYLES = {
  classic: ["●", "·"],
  square: ["■", "□"],
  diamond: ["◆", "◇"],
  bar: ["▰", "▱"],
  braille: ["⣿", "⠀"],
  arrow: ["▶", "▷"],
  arrowVertical: ["▼", "▽"],
} as const satisfies Record<string, readonly [string, string]>;

export type LinearStyleName = Exclude<keyof typeof LINEAR_STYLES, "arrowVertical">;

/** `LinearStyle::symbols` — `Arrow` swaps to point down when vertical. */
export function linearSymbols(
  style: LinearStyleName,
  direction: Direction,
): readonly [string, string] {
  if (style === "arrow") {
    return LINEAR_STYLES[direction === "vertical" ? "arrowVertical" : "arrow"];
  }
  return LINEAR_STYLES[style];
}

/** `LinearStyle::columns_per_slot` — every current style is one column. */
export const LINEAR_COLUMNS_PER_SLOT = 1;

export const LINEAR_STYLE_NAMES: LinearStyleName[] = [
  "classic",
  "square",
  "diamond",
  "bar",
  "braille",
  "arrow",
];

export interface LinearOptions {
  direction?: Direction;
  flow?: Flow;
  style?: LinearStyleName;
  totalSlots?: number;
  litSlots?: number;
  /** How many ticks each step is held (default 3; higher = slower). */
  ticksPerStep?: number;
  spin?: never;
}

/** `LinearSpinner::step` — `tick / ticks_per_step`, truncated. */
function linearStep(tick: number, ticksPerStep: number): number {
  return truncDiv(Math.floor(tick), Math.max(1, ticksPerStep));
}

/** `LinearSpinner::build_horizontal_line` — a lit window that wraps. */
function buildHorizontalLine(
  step: number,
  totalSlots: number,
  litSlots: number,
  style: LinearStyleName,
  flow: Flow,
): Cell[] {
  const total = Math.max(1, totalSlots);
  const lit = Math.max(1, Math.min(litSlots, total));
  const rawStep = step % total;
  const idx = flow === "forwards" ? rawStep : total - 1 - rawStep;
  const [on, off] = linearSymbols(style, "horizontal");

  const row: Cell[] = [];
  for (let i = 0; i < total; i++) {
    const isLit =
      idx + lit <= total
        ? i >= idx && i < idx + lit
        : i >= idx || i < (idx + lit) % total;
    row.push(toneCell(isLit ? on : off, isLit ? "arc" : "dim"));
  }
  return row;
}

/**
 * `LinearSpinner::bounce_index` — for `total_slots = n` the forwards sequence
 * is `0, 1, …, n-1, n-2, …, 1`. `Flow::Backwards` mirrors it.
 */
export function bounceIndex(
  step: number,
  totalSlots: number,
  flow: Flow,
): number {
  const n = Math.max(1, totalSlots);
  if (n === 1) return 0;
  const cycle = 2 * (n - 1);
  const pos = step % cycle;
  const idx = pos < n ? pos : cycle - pos;
  return flow === "forwards" ? idx : n - 1 - idx;
}

/** `LinearSpinner::build_lines`. */
export function linearFrame(tick: number, options: LinearOptions = {}): Frame {
  const {
    direction = "horizontal",
    flow = "forwards",
    style = "classic",
    totalSlots = 3,
    litSlots = 2,
    ticksPerStep = 3,
  } = options;

  const step = linearStep(tick, ticksPerStep);

  if (direction === "horizontal") {
    return [buildHorizontalLine(step, totalSlots, litSlots, style, flow)];
  }

  const n = Math.max(1, totalSlots);
  const active = bounceIndex(step, n, flow);
  const [on, off] = linearSymbols(style, "vertical");

  const rows: Frame = [];
  for (let i = 0; i < n; i++) {
    const isLit = i === active;
    rows.push([toneCell(isLit ? on : off, isLit ? "arc" : "dim")]);
  }
  return rows;
}

/** `LinearSpinner` occupies 1 row when horizontal, `total_slots` when vertical. */
export function linearCharSize(options: LinearOptions = {}) {
  const slots = Math.max(1, options.totalSlots ?? 3);
  return options.direction === "vertical"
    ? { cols: 1, rows: slots }
    : { cols: slots, rows: 1 };
}

/* ── CircleSpinner ───────────────────────────────────────────────────── */

export interface Dot {
  row: number;
  col: number;
}

const coordKey = (c: Dot) => `${c.row},${c.col}`;

/**
 * `circle_perimeter` — the midpoint circle algorithm at 1:1 dot pitch, then
 * `sort_clockwise` from 12 o'clock.
 *
 * Terminal cells are ~2× taller than wide, so a 1:1 dot pitch (2 dot-cols and
 * 4 dot-rows per braille cell) cancels out and the ring looks round.
 */
export function circlePerimeter(radius: number): Dot[] {
  if (radius <= 0) return [{ row: 0, col: 0 }];

  const seen = new Set<number>();
  const dots: Dot[] = [];
  let x = 0;
  let y = radius;
  let d = 1 - radius;

  while (x <= y) {
    // All 8 octant reflections — no column scaling, pure 1:1 pitch.
    const octants: ReadonlyArray<readonly [number, number]> = [
      [x, -y], [y, -x], [y, x], [x, y],
      [-x, y], [-y, x], [-y, -x], [-x, -y],
    ];
    for (const [px, py] of octants) {
      const row = py;
      const col = px;
      const key = row * 4096 + col;
      if (!seen.has(key)) {
        seen.add(key);
        dots.push({ row, col });
      }
    }
    if (d < 0) d += 2 * x + 3;
    else {
      d += 2 * (x - y) + 5;
      y -= 1;
    }
    x += 1;
  }

  // `sort_clockwise` — angle 0 at the top, increasing clockwise.
  const n = dots.length;
  let cr = 0;
  let cc = 0;
  for (const p of dots) {
    cr += p.row;
    cc += p.col;
  }
  cr /= n;
  cc /= n;

  return dots
    .map((p) => {
      const dr = -(p.row - cr);
      const dc = p.col - cc;
      let angle = Math.atan2(dc, dr);
      if (angle < 0) angle += Math.PI * 2;
      return { angle, row: p.row, col: p.col };
    })
    .sort((a, b) => a.angle - b.angle)
    // `angle` has done its job as the sort key; only the coords go on.
    .map((p) => ({ row: p.row, col: p.col }));
}

export interface CircleOptions {
  /** Radius in braille dots (minimum 1). */
  radius?: number;
  /** Bright-arc length in perimeter dots. `0` = automatic quarter. */
  arcLen?: number;
  /** How many ticks each arc position is held (default 1; higher = slower). */
  ticksPerStep?: number;
  spin?: Spin;
}

/** `CircleSpinner::char_size` — radius 4 → 5×3, radius 8 → 9×5. */
export function circleCharSize(options: CircleOptions = {}) {
  const dotDim = Math.max(1, options.radius ?? 4) * 2 + 1;
  return { cols: divCeil(dotDim, 2), rows: divCeil(dotDim, 4) };
}

/**
 * `CircleEngine` — a boolean dot-grid over the ring's bounding box. Only the
 * perimeter is ever lit; the head sets its dot, the tail clears its dot, which
 * is what produces the travelling comet.
 */
export function circleFrame(tick: number, options: CircleOptions = {}): Frame {
  const {
    radius = 4,
    arcLen: arcOverride = 0,
    ticksPerStep = 1,
    spin = "cw",
  } = options;
  const perimeter = circlePerimeter(radius);
  const n = perimeter.length;

  const rows = perimeter.map((d) => d.row);
  const cols = perimeter.map((d) => d.col);
  const rowOffset = -Math.min(...rows);
  const colOffset = -Math.min(...cols);
  const dotRows = Math.max(...rows) - Math.min(...rows) + 1;
  const dotCols = Math.max(...cols) - Math.min(...cols) + 1;

  const charRows = divCeil(dotRows, 4);
  const charCols = divCeil(dotCols, 2);

  const arcLen =
    arcOverride > 0 ? Math.min(arcOverride, n) : Math.max(Math.floor(n / 4), 1);

  // Head starts at the top of the ring. The tail trails `arc_len` behind it.
  const ccw = isCounter(spin);
  let head = 0;
  let tail = ccw ? arcLen % n : (n - arcLen) % n;

  const steps = Math.max(
    0,
    truncDiv(Math.floor(tick), Math.max(1, ticksPerStep)) % n,
  );
  for (let s = 0; s < steps; s++) {
    head = ccw ? (head + n - 1) % n : (head + 1) % n;
    tail = ccw ? (tail + n - 1) % n : (tail + 1) % n;
  }

  // Which perimeter dots are currently lit? The arc starts at `tail` and wraps.
  const lit = new Set<string>();
  for (let i = 0; i < arcLen; i++) {
    const d = perimeter[(tail + i) % n];
    lit.add(coordKey(d));
  }

  // Pack into braille cells, then compose bright over dim.
  const bright = new Uint8Array(charRows * charCols);
  const dim = new Uint8Array(charRows * charCols);
  for (let i = 0; i < n; i++) {
    const d = perimeter[i];
    const r = d.row + rowOffset;
    const c = d.col + colOffset;
    const cell = truncDiv(r, 4) * charCols + truncDiv(c, 2);
    const bit = 1 << BRAILLE_MAP[r % 4][c % 2];
    if (lit.has(coordKey(d))) bright[cell] |= bit;
    else dim[cell] |= bit;
  }

  const frame: Frame = [];
  for (let r = 0; r < charRows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < charCols; c++) {
      const cell = r * charCols + c;
      const b = bright[cell];
      const d = dim[cell];
      row.push(toneCell(brailleChar(b || d), b !== 0 ? "arc" : "dim"));
    }
    frame.push(row);
  }
  return frame;
}

/* ── SquareSpinner / RectSpinner — the shared bool-grid engine ───────── */

interface Coord {
  row: number;
  col: number;
}

function makeHeadMap(width: number, height: number, size: number) {
  const m = new Map<string, Coord>();
  const endCol = width - 1;
  const endRow = height - 1;

  for (let n = 0; n < size; n++) {
    m.set(`${n},${endCol}`, { row: size, col: endCol - n });
  }
  for (let n = 0; n < size; n++) {
    m.set(`${endRow},${endCol - n}`, { row: endRow - n, col: endCol - size });
  }
  for (let n = 0; n < size; n++) {
    m.set(`${endRow - n},0`, { row: endCol - size, col: n });
  }
  for (let n = 0; n < size; n++) {
    m.set(`0,${n}`, { row: n, col: size });
  }
  return m;
}

function makeTailMap(width: number, height: number, size: number) {
  const m = new Map<string, Coord>();
  const endCol = width - 1;
  const endRow = height - 1;

  for (let n = 0; n < size; n++) {
    m.set(`${size},${n}`, { row: n, col: 0 });
  }
  for (let n = 0; n < size; n++) {
    m.set(`${n},${endCol - size}`, { row: 0, col: endCol - n });
  }
  for (let n = 0; n < size; n++) {
    m.set(`${endRow - size},${endCol - n}`, { row: endRow - n, col: endCol });
  }
  for (let n = 0; n < size; n++) {
    m.set(`${endRow - n},${size}`, { row: endRow, col: n });
  }
  return m;
}

function rotateNodes(
  nodes: Coord[],
  rotation: Map<string, Coord>,
): Coord[] | null {
  const out: Coord[] = [];
  for (const pos of nodes) {
    const next = rotation.get(coordKey(pos));
    if (!next) return null;
    out.push(next);
  }
  return out;
}

const xDir = (nodes: Coord[]) => (nodes.some((p) => p.row === 0) ? 1 : -1);
const yDir = (nodes: Coord[]) => (nodes.some((p) => p.col === 0) ? -1 : 1);
const traversingX = (nodes: Coord[]) =>
  nodes.slice(1).every((n) => n.col === nodes[0].col);
const traversingY = (nodes: Coord[]) =>
  nodes.slice(1).every((n) => n.row === nodes[0].row);

/**
 * `step` — rotate the key nodes around a corner when the map covers them,
 * otherwise translate them along whichever axis they are traversing. Note the
 * two `if`s are separate in the original, not `if / else if`.
 */
function stepNodes(nodes: Coord[], rotate: Map<string, Coord>) {
  const next = rotateNodes(nodes, rotate);
  if (next) {
    for (let i = 0; i < nodes.length; i++) {
      nodes[i] = next[i];
    }
    return;
  }
  if (traversingX(nodes)) {
    const dir = xDir(nodes);
    for (const n of nodes) n.col += dir;
  }
  if (traversingY(nodes)) {
    const dir = yDir(nodes);
    for (const n of nodes) n.row += dir;
  }
}

/** `calc_dimension` — the dot-grid side length for a given square size. */
export const calcDimension = (size: number) => 8 + 5 * Math.max(0, size - 2);

/** `vertical_offset` — size 2 needs two extra dot-rows to stay square. */
export const verticalOffset = (size: number) => (size === 2 ? 2 : 0);

function makeCentre(size: number, width: number) {
  const mid = truncDiv(width, 2);
  const off = truncDiv(size, 2);
  const start = { row: mid - off, col: mid - off };
  const cells: Coord[] = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      cells.push({ row: start.row + i, col: start.col + j });
    }
  }
  const end = { row: start.row + size - 1, col: start.col + size - 1 };
  return { cells, start, end };
}

/** `should_switch` — where the colour flips between the ring and the centre. */
function shouldSwitch(
  bounds: [[number, number], [number, number]],
  row: number,
  col: number,
): boolean {
  if (row >= bounds[0][0] && row <= bounds[1][0]) {
    return col === bounds[0][1] || col === bounds[1][1];
  }
  return false;
}

interface SquareState {
  cells: Uint8Array;
  totalRows: number;
  totalCols: number;
  offset: number;
  head: Coord[];
  tail: Coord[];
  headMap: Map<string, Coord>;
  tailMap: Map<string, Coord>;
  centreBounds: [[number, number], [number, number]];
  hasCentre: boolean;
}

function buildSquare(size: number, centre: Centre): SquareState {
  const sz = clamp(size, 2, 8);
  const dm = calcDimension(sz);
  const offset = verticalOffset(sz);
  const totalRows = dm + offset;
  const totalCols = dm;
  const cells = new Uint8Array(totalRows * totalCols);

  const set = (row: number, col: number, value: 0 | 1) => {
    const r = row + offset;
    if (r >= 0 && r < totalRows && col >= 0 && col < totalCols) {
      cells[r * totalCols + col] = value;
    }
  };

  /** `Grid.fill` — walk an L-shaped path from `start` to `end`. */
  const fill = (start: Coord, end: Coord) => {
    const x = end.col < start.col ? -1 : 1;
    const y = end.row < start.row ? -1 : 1;
    let row = start.row;
    let col = start.col;
    set(row, col, 1);
    while (row !== end.row) {
      row += y;
      set(row, col, 1);
    }
    while (col !== end.col) {
      col += x;
      set(row, col, 1);
    }
  };

  const { cells: centreCells, start, end } = makeCentre(sz, dm);
  const centreBounds: [[number, number], [number, number]] = [
    [truncDiv(start.row + offset, 4), truncDiv(start.col, 2) - 1],
    [truncDiv(end.row + offset, 4), truncDiv(end.col, 2)],
  ];

  const rem = (dm % 2) + Math.floor((sz - 2) / 2);
  const mid = truncDiv(dm, 2) + rem;
  const head: Coord[] = [];
  const tail: Coord[] = [];
  for (let n = 0; n < sz; n++) {
    head.push({ row: n, col: mid });
    tail.push({ row: mid, col: n });
  }
  for (let i = 0; i < sz; i++) fill(tail[i], head[i]);

  const hasCentre = centre === "filled";
  if (hasCentre) {
    for (const c of centreCells) set(c.row, c.col, 1);
  }

  return {
    cells,
    totalRows,
    totalCols,
    offset,
    head,
    tail,
    headMap: makeHeadMap(dm, dm, sz),
    tailMap: makeTailMap(dm, dm, sz),
    centreBounds,
    hasCentre,
  };
}

function walkSquare(s: SquareState) {
  const set = (row: number, col: number, value: 0 | 1) => {
    const r = row + s.offset;
    if (r >= 0 && r < s.totalRows && col >= 0 && col < s.totalCols) {
      s.cells[r * s.totalCols + col] = value;
    }
  };

  stepNodes(s.head, s.headMap);
  for (const p of s.head) set(p.row, p.col, 1);
  for (const p of s.tail) set(p.row, p.col, 0);
  stepNodes(s.tail, s.tailMap);
}

/** `render_frame` — pack the dot-grid, then flip colour at the centre bounds. */
function renderSquare(s: SquareState, spin: Spin): Frame {
  const charRows = divCeil(s.totalRows, 4);
  const charCols = divCeil(s.totalCols, 2);
  const screen = new Uint8Array(charRows * charCols);

  for (let row = 0; row < s.totalRows; row++) {
    for (let col = 0; col < s.totalCols; col++) {
      if (!s.cells[row * s.totalCols + col]) continue;
      const i = truncDiv(row, 4);
      const j = truncDiv(col, 2);
      screen[i * charCols + j] |= 1 << BRAILLE_MAP[row % 4][col % 2];
    }
  }

  const frame: Frame = [];
  let active: Tone = "arc";
  for (let i = 0; i < charRows; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < charCols; j++) {
      const byte = screen[i * charCols + j];
      row.push(toneCell(byte ? brailleChar(byte) : "⠀", active));
      if (s.hasCentre && shouldSwitch(s.centreBounds, i, j)) {
        active = active === "arc" ? "dim" : "arc";
      }
    }
    if (isCounter(spin)) row.reverse();
    frame.push(row);
  }
  return frame;
}

export interface SquareOptions {
  /** Arc thickness / square size, clamped to `2..=8`. */
  size?: number;
  centre?: Centre;
  /** How many ticks each arc position is held (default 1; higher = slower). */
  ticksPerStep?: number;
  spin?: Spin;
}

/** `SquareSpinner` and `RectSpinner` share this engine and these dimensions. */
export function squareFrame(tick: number, options: SquareOptions = {}): Frame {
  const { size = 2, centre = "filled", ticksPerStep = 1, spin = "cw" } =
    options;
  const engine = new SquareRenderer(size, centre);
  const steps = Math.max(
    0,
    truncDiv(Math.floor(tick), Math.max(1, ticksPerStep)),
  );
  return engine.frame(steps, spin);
}

/** `char_size` — size 2 renders 4×3, growing to 19×10 at size 8. */
export function squareCharSize(size = 2) {
  const sz = clamp(size, 2, 8);
  const dm = calcDimension(sz);
  const offset = verticalOffset(sz);
  return { cols: divCeil(dm, 2), rows: divCeil(dm + offset, 4) };
}

/**
 * A stateful square engine. The walk is inherently sequential, so frames are
 * produced by advancing from the last requested step — O(1) amortised, and
 * re-derivable from any earlier tick.
 */
class SquareRenderer {
  private state: SquareState;
  private at = 0;

  constructor(
    private readonly size: number,
    private readonly centre: Centre,
  ) {
    this.state = buildSquare(size, centre);
  }

  frame(step: number, spin: Spin): Frame {
    if (step < this.at) {
      this.state = buildSquare(this.size, this.centre);
      this.at = 0;
    }
    while (this.at < step) {
      walkSquare(this.state);
      this.at += 1;
    }
    return renderSquare(this.state, spin);
  }
}

/* ── BarSpinner ──────────────────────────────────────────────────────── */

/**
 * `FADE` — the arc-edge density ramp. `⠉` top row only, `⠛` top two,
 * `⠿` top three, `⣿` full.
 */
const FADE = [0x09, 0x1b, 0x3f, 0xff];

/** `DIM_BYTE` — `⣀`, the bottom-two-dot rail behind the arc. */
const DIM_BYTE = 0xc0;

const TRACK_BYTES: Record<BarTrack, number> = {
  rail: DIM_BYTE,
  full: 0xff,
  empty: 0x00,
};

/** `fade_byte` — map an edge distance to the ramp, or straight to `arcByte`. */
function fadeByte(fromEdge: number, fadeWidth: number, arcByte: number): number {
  if (fadeWidth === 0 || fromEdge >= fadeWidth) return arcByte;
  return FADE[Math.min(divCeil(fromEdge * 3, fadeWidth), 2)];
}

/**
 * `BarStyle` — the 16 variants. `braille` is not a symbol pair: it is the
 * default braille rendering, which is what makes the density ramp possible.
 */
export const BAR_STYLES = {
  block: ["█", "░"],
  shade: ["▓", "░"],
  dot: ["●", "·"],
  diamond: ["◆", "◇"],
  square: ["■", "□"],
  star: ["★", "☆"],
  heart: ["♥", "♡"],
  arrow: ["▶", "▷"],
  circle: ["◉", "○"],
  spark: ["✦", "✧"],
  cross: ["✚", "✛"],
  progress: ["▰", "▱"],
  thick: ["━", "─"],
  wave: ["≈", "˜"],
  pip: ["▪", "·"],
} as const satisfies Record<string, readonly [string, string]>;

export type BarSymbolStyle = keyof typeof BAR_STYLES;
export type BarStyleName = "braille" | BarSymbolStyle;

export const BAR_SYMBOL_STYLES: BarSymbolStyle[] = Object.keys(
  BAR_STYLES,
) as BarSymbolStyle[];

/** The four named constructors. */
export const BAR_PRESETS = ["zed", "claude", "minimal", "solid"] as const;
export type BarPreset = (typeof BAR_PRESETS)[number];

export interface BarOptions {
  /** Bar length in character columns. */
  width?: number;
  /** Cross-axis thickness: rows when horizontal, columns when vertical. */
  thickness?: number;
  /** Arc length in cells. `0` = automatic ~⅓ of the bar. */
  arcWidth?: number;
  orientation?: BarOrientation;
  motion?: BarMotion;
  style?: BarStyleName;
  track?: BarTrack;
  /** Braille density-ramp width. `0` disables the ramp. */
  fadeWidth?: number;
  /** Braille byte for the fully-lit arc centre. */
  arcByte?: number;
  spin?: Spin;
  preset?: BarPreset;
}

type RectState = {
  charW: number;
  charH: number;
  arcCols: number;
  anchor: number;
  goingForward: boolean;
  motion: BarMotion;
};

function buildRect(
  charW: number,
  charH: number,
  arcWidth: number,
  spin: Spin,
  motion: BarMotion,
): RectState {
  const w = Math.max(3, charW);
  const h = Math.max(1, charH);
  const arcCols =
    arcWidth > 0
      ? Math.min(arcWidth, Math.max(0, w - 1))
      : Math.max(divCeil(w, 3), 4);

  // Squeeze always converges first; radiate always starts from the centre.
  const goingForward =
    motion === "squeeze" || motion === "radiate" ? true : !isCounter(spin);
  const anchor =
    motion === "squeeze" || motion === "radiate"
      ? 0
      : goingForward
        ? 0
        : Math.max(0, w - arcCols);

  return { charW: w, charH: h, arcCols, anchor, goingForward, motion };
}

/** `RectEngine::walk` — advance, reverse or wrap at each edge. */
function walkRect(s: RectState) {
  switch (s.motion) {
    case "bounce": {
      const maxAnchor = Math.max(0, s.charW - s.arcCols);
      if (s.goingForward) {
        if (s.anchor < maxAnchor) s.anchor += 1;
        else s.goingForward = false;
      } else if (s.anchor > 0) s.anchor -= 1;
      else s.goingForward = true;
      break;
    }
    case "loop": {
      s.anchor = s.goingForward
        ? (s.anchor + 1) % s.charW
        : (s.anchor + s.charW - 1) % s.charW;
      break;
    }
    case "squeeze": {
      const half = Math.floor(Math.max(0, s.charW - s.arcCols) / 2);
      if (s.goingForward) {
        if (s.anchor < half) s.anchor += 1;
        else s.goingForward = false;
      } else if (s.anchor > 0) s.anchor -= 1;
      else s.goingForward = true;
      break;
    }
    case "radiate": {
      const half = Math.floor(Math.max(0, s.charW - s.arcCols) / 2);
      s.anchor = (s.anchor + 1) % (half + 1);
      break;
    }
  }
}

function renderRect(
  s: RectState,
  trackByte: number,
  arcByte: number,
  fadeWidth: number,
  symbols: readonly [string, string] | null,
): Frame {
  const { charW, charH, arcCols, anchor } = s;
  const frame: Frame = [];

  for (let r = 0; r < charH; r++) {
    const row: Cell[] = [];
    for (let ci = 0; ci < charW; ci++) {
      let inArc = false;
      let fromEdge = 0;

      switch (s.motion) {
        case "bounce": {
          const arcEnd = anchor + arcCols;
          if (ci >= anchor && ci < arcEnd) {
            inArc = true;
            fromEdge = Math.min(ci - anchor, arcEnd - 1 - ci);
          }
          break;
        }
        case "loop": {
          // Modular offset: how far past `anchor` is this column?
          const offset = (ci + charW - anchor) % charW;
          if (offset < arcCols) {
            inArc = true;
            fromEdge = Math.min(offset, arcCols - 1 - offset);
          }
          break;
        }
        case "squeeze": {
          const leftStart = anchor;
          const leftEnd = leftStart + arcCols;
          const rightEnd = Math.max(0, charW - anchor);
          const rightStart = Math.max(0, rightEnd - arcCols);
          if (ci >= leftStart && ci < leftEnd) {
            inArc = true;
            fromEdge = Math.min(ci - leftStart, leftEnd - 1 - ci);
          } else if (ci >= rightStart && ci < rightEnd) {
            inArc = true;
            fromEdge = Math.min(ci - rightStart, rightEnd - 1 - ci);
          }
          break;
        }
        case "radiate": {
          const centre = Math.floor(charW / 2);
          const rightStart = centre + anchor;
          const rightEnd = rightStart + arcCols;
          const leftEnd = Math.max(0, centre - anchor);
          const leftStart = Math.max(0, leftEnd - arcCols);
          if (ci >= rightStart && ci < Math.min(rightEnd, charW)) {
            inArc = true;
            fromEdge = Math.min(ci - rightStart, Math.min(rightEnd, charW) - 1 - ci);
          } else if (ci >= leftStart && ci < leftEnd) {
            inArc = true;
            fromEdge = Math.min(ci - leftStart, leftEnd - 1 - ci);
          }
          break;
        }
      }

      if (symbols) {
        row.push(toneCell(inArc ? symbols[0] : symbols[1], inArc ? "arc" : "dim"));
      } else if (inArc) {
        row.push(toneCell(brailleChar(fadeByte(fromEdge, fadeWidth, arcByte)), "arc"));
      } else {
        row.push(toneCell(brailleChar(trackByte), "dim"));
      }
    }
    frame.push(row);
  }
  return frame;
}

type VertState = {
  charW: number;
  charH: number;
  arcRows: number;
  anchor: number;
  goingForward: boolean;
  motion: BarMotion;
};

function buildVert(
  charW: number,
  charH: number,
  arcHeight: number,
  spin: Spin,
  motion: BarMotion,
): VertState {
  const w = Math.max(1, charW);
  const h = Math.max(3, charH);
  const arcRows =
    arcHeight > 0
      ? Math.min(arcHeight, Math.max(0, h - 1))
      : Math.max(divCeil(h, 3), 2);

  const goingForward =
    motion === "squeeze" || motion === "radiate" ? true : !isCounter(spin);
  const anchor =
    motion === "squeeze" || motion === "radiate"
      ? 0
      : goingForward
        ? 0
        : Math.max(0, h - arcRows);

  return { charW: w, charH: h, arcRows, anchor, goingForward, motion };
}

function walkVert(s: VertState) {
  switch (s.motion) {
    case "bounce": {
      const maxAnchor = Math.max(0, s.charH - s.arcRows);
      if (s.goingForward) {
        if (s.anchor < maxAnchor) s.anchor += 1;
        else s.goingForward = false;
      } else if (s.anchor > 0) s.anchor -= 1;
      else s.goingForward = true;
      break;
    }
    case "loop": {
      s.anchor = s.goingForward
        ? (s.anchor + 1) % s.charH
        : (s.anchor + s.charH - 1) % s.charH;
      break;
    }
    case "squeeze": {
      const half = Math.floor(Math.max(0, s.charH - s.arcRows) / 2);
      if (s.goingForward) {
        if (s.anchor < half) s.anchor += 1;
        else s.goingForward = false;
      } else if (s.anchor > 0) s.anchor -= 1;
      else s.goingForward = true;
      break;
    }
    case "radiate": {
      const half = Math.floor(Math.max(0, s.charH - s.arcRows) / 2);
      s.anchor = (s.anchor + 1) % (half + 1);
      break;
    }
  }
}

function renderVert(
  s: VertState,
  trackByte: number,
  arcByte: number,
  symbols: readonly [string, string] | null,
): Frame {
  const { charW, charH, arcRows, anchor } = s;
  const frame: Frame = [];

  for (let row = 0; row < charH; row++) {
    let inArc = false;
    switch (s.motion) {
      case "bounce":
        inArc = row >= anchor && row < anchor + arcRows;
        break;
      case "loop":
        inArc = (row + charH - anchor) % charH < arcRows;
        break;
      case "squeeze": {
        const topStart = anchor;
        const topEnd = topStart + arcRows;
        const botEnd = Math.max(0, charH - anchor);
        const botStart = Math.max(0, botEnd - arcRows);
        inArc = (row >= topStart && row < topEnd) || (row >= botStart && row < botEnd);
        break;
      }
      case "radiate": {
        const centre = Math.floor(charH / 2);
        const downStart = centre + anchor;
        const downEnd = downStart + arcRows;
        const upEnd = Math.max(0, centre - anchor);
        const upStart = Math.max(0, upEnd - arcRows);
        inArc =
          (row >= downStart && row < Math.min(downEnd, charH)) ||
          (row >= upStart && row < upEnd);
        break;
      }
    }

    const char = symbols
      ? inArc
        ? symbols[0]
        : symbols[1]
      : brailleChar(inArc ? arcByte : trackByte);

    const rowCells: Cell[] = [];
    for (let c = 0; c < charW; c++) rowCells.push(toneCell(char, inArc ? "arc" : "dim"));
    frame.push(rowCells);
  }
  return frame;
}

/** The four named `BarSpinner` constructors, verbatim. */
const PRESET_DEFAULTS: Record<
  BarPreset,
  Partial<BarOptions> & { thickness: number }
> = {
  // 1 row, cyan arc, subtle Rail track, clockwise.
  zed: { thickness: 1, track: "rail", fadeWidth: 3, spin: "cw" },
  // 2 rows, warm-orange arc, Rail track, clockwise.
  claude: { thickness: 2, track: "rail", fadeWidth: 3, spin: "cw" },
  // 1 row, white arc, Empty track — the arc floats on blank space.
  minimal: { thickness: 1, track: "empty", fadeWidth: 3, spin: "cw" },
  // 1 row, cyan arc, Full track, sharp zero-fade edges.
  solid: { thickness: 1, track: "full", fadeWidth: 0, spin: "cw" },
};

/**
 * `BarSpinner::build_lines` — the same walk for the horizontal and vertical
 * engines, dispatched on orientation. Multi-row bars disable the braille fade
 * because stacked gradients step visibly.
 */
export function barFrame(tick: number, options: BarOptions = {}): Frame {
  const {
    width = 20,
    orientation = "horizontal",
    motion = "bounce",
    spin = "cw",
    style = "braille",
    track = "rail",
    fadeWidth = 3,
    arcByte = 0xff,
    arcWidth = 0,
    preset,
  } = options;

  const thickness = preset
    ? PRESET_DEFAULTS[preset].thickness
    : (options.thickness ?? 1);
  const effTrack = preset ? PRESET_DEFAULTS[preset].track! : track;
  const effFade = preset ? PRESET_DEFAULTS[preset].fadeWidth! : fadeWidth;
  const effSpin = preset ? PRESET_DEFAULTS[preset].spin! : spin;

  const trackByte = TRACK_BYTES[effTrack];
  const symbols = style === "braille" ? null : BAR_STYLES[style];
  const step = Math.max(0, Math.floor(tick));

  if (orientation === "vertical") {
    const charH = Math.max(3, width);
    const s = buildVert(thickness, charH, arcWidth, effSpin, motion);
    for (let i = 0; i < step; i++) walkVert(s);
    return renderVert(s, trackByte, arcByte, symbols);
  }

  const charW = Math.max(3, width);
  // Graduated braille dots step diagonally when stacked, so a thick bar
  // switches to a hard edge.
  const fade = thickness > 1 ? 0 : effFade;
  const s = buildRect(charW, thickness, arcWidth, effSpin, motion);
  for (let i = 0; i < step; i++) walkRect(s);
  return renderRect(s, trackByte, arcByte, fade, symbols);
}

/**
 * `BarSpinner::char_size` — `None` when the width is auto (`0`), because a
 * bar has no intrinsic size until it is given one. Otherwise
 * `(width.max(3), height.max(1))`, with the axes swapped for a vertical bar.
 */
export function barCharSize(
  options: BarOptions = {}
): { cols: number; rows: number } | null {
  const { width = 20, orientation = "horizontal", preset } = options;
  if (width === 0) return null;
  const thickness = preset
    ? PRESET_DEFAULTS[preset].thickness
    : (options.thickness ?? 1);
  return orientation === "vertical"
    ? { cols: Math.max(1, thickness), rows: Math.max(3, width) }
    : { cols: Math.max(3, width), rows: Math.max(1, thickness) };
}

/* ── Frame helpers ───────────────────────────────────────────────────── */

/** Join a frame into a plain string, for `aria-label`s and text fallbacks. */
export function frameToString(frame: Frame): string {
  return frame.map((row) => row.map((c) => c.char).join("")).join("\n");
}

/** Every distinct glyph in a frame, in order — handy for asserting a preset. */
export function frameGlyphs(frame: Frame): string[] {
  const out: string[] = [];
  for (const row of frame) for (const cell of row) out.push(cell.char);
  return out;
}
