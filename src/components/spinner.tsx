"use client";

/**
 * Spinner — renders one real frame of any `ratatui-spinner` widget.
 *
 * The crate's contract is that a spinner holds no time: you hand it a `tick`
 * and it renders a frame. This component does the same. `useSpinnerTick()`
 * supplies the page-owned tick, the frame builders in `@/lib/spinners` return
 * the exact cells the Rust widget would emit, and the tones map onto the two
 * colours each widget paints with.
 *
 * Props mirror the Rust builders one-for-one — `radius`/`arcLen`,
 * `size`/`centre`, `totalSlots`/`litSlots`, `motion`/`style`/`track` — so a
 * snippet shown on the page is the snippet that produces what is on screen.
 */

import { useMemo } from "react";

import { cn } from "@/lib/utils";

import {
  BAR_PRESETS,
  barFrame,
  circleFrame,
  fluxFrame,
  linearFrame,
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
  type Frame,
  type LinearStyleName,
  type Spin,
} from "@/lib/spinners";

import { useSpinnerTick } from "./spinner-engine";

interface BaseProps {
  className?: string;
  /** `spin()` — which way the arc travels. */
  spin?: Spin;
  /**
   * `ticks_per_step` — how many ticks each frame is held. The crate's default
   * is 1, except `LinearSpinner`, which defaults to 3.
   */
  ticksPerStep?: number;
}

interface CircleProps extends BaseProps {
  kind: "circle";
  /** `radius()` — the ring radius in braille dots. */
  radius?: number;
  /** `arc_len()` — bright-arc length in perimeter dots. `0` = automatic quarter. */
  arcLen?: number;
}

interface SquareProps extends BaseProps {
  kind: "square" | "rect";
  /** `size()` / `RectShape::Square(n)` — clamped to `2..=8`. */
  size?: number;
  /** `centre()` — filled or empty. */
  centre?: Centre;
}

interface FluxProps extends BaseProps {
  kind: "flux";
  /** `frames()` — one of the 22 `FluxFrames` presets, or a raw glyph sequence. */
  frames?: FluxFrameName | readonly string[];
  /** `width()` — cells across. */
  width?: number;
  /** `height()` — cells down. */
  height?: number;
  /** `phase_step()` — frame offset per cell. `0` synchronises them. */
  phaseStep?: number;
}

interface LinearProps extends BaseProps {
  kind: "linear";
  direction?: Direction;
  flow?: Flow;
  style?: LinearStyleName;
  /** `total_slots()` — the spinner length. */
  totalSlots?: number;
  /** `lit_slots()` — the moving window width, horizontal only. */
  litSlots?: number;
}

interface BarProps extends BaseProps {
  kind: "bar";
  /** A ready-made configuration: `zed`, `claude`, `minimal`, `solid`. */
  preset?: BarPreset;
  orientation?: BarOrientation;
  /** `width()` — bar length in cells. */
  width?: number;
  /** `height()` — the crate's cross-axis size: rows when horizontal. */
  thickness?: number;
  /** `arc_width()` — arc length in cells. `0` = automatic ~⅓ of the bar. */
  arcWidth?: number;
  motion?: BarMotion;
  style?: BarStyleName;
  /** `track()` — rail, full, or empty. */
  track?: BarTrack;
  /** `fade_width()` — the density ramp trailing the arc. */
  fadeWidth?: number;
}

export type SpinnerProps =
  | CircleProps
  | SquareProps
  | FluxProps
  | LinearProps
  | BarProps;

/** `BAR_PRESETS` is re-exported so demos can enumerate them. */
export const SPINNER_PRESETS = BAR_PRESETS;

/**
 * Renders a `Frame` — one grid cell per terminal cell, coloured by tone.
 *
 * `grid` is used instead of a `<pre>` so each cell can take its own colour
 * without the browser's monospace spacing drift; the glyphs stay the crate's.
 *
 * Both `gridRow` *and* `gridColumn` are set on every cell. Pinning only the
 * row leaves the column to auto-placement, and with every cell claiming an
 * explicit row the placement algorithm no longer fills each row in order — the
 * glyphs drift sideways and the shape is lost. A frame has to land on the grid
 * the terminal would print, or it is not the crate's output any more.
 */
function FrameGrid({
  frame,
  className,
  label,
}: {
  frame: Frame;
  className?: string;
  /** Rendered to assistive tech; the glyph grid itself is decorative. */
  label?: string;
}) {
  return (
    <span
      className={cn("spin inline-grid", className)}
      style={{ gridTemplateColumns: `repeat(${frame[0]?.length ?? 1}, auto)` }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      {frame.flatMap((row, r) =>
        row.map((cell, c) => (
          <span
            key={`${r}-${c}`}
            className={cell.tone === "arc" ? "spin-arc" : "spin-dim"}
            style={{ gridRow: r + 1, gridColumn: c + 1 }}
          >
            {cell.char}
          </span>
        )),
      )}
    </span>
  );
}

/**
 * A single frame, rendered at a size where the glyphs are actually readable.
 *
 * A braille dot occupies a fraction of the em box, so a frame set in body-size
 * mono collapses into a smudge — the characters are present and correct, but
 * the shape is lost. This renders the real `Frame` with its per-cell tones
 * intact instead of dumping the flattened string, so a frozen frame reads as
 * the spinner it is.
 */
export function Frame({
  frame,
  className,
  label,
}: {
  frame: Frame;
  className?: string;
  label?: string;
}) {
  return <FrameGrid frame={frame} className={cn("spin-lg", className)} label={label} />;
}

/* ── Public component ───────────────────────────────────────────────────── */

export function Spinner(props: SpinnerProps) {
  const tick = useSpinnerTick();

  const frame = useMemo(() => {
    switch (props.kind) {
      case "circle": {
        const {
          radius = 4,
          arcLen = 0,
          ticksPerStep = 1,
          spin = "cw",
        } = props;
        return circleFrame(tick, { radius, arcLen, ticksPerStep, spin });
      }

      case "square":
      case "rect": {
        const {
          size = 2,
          centre = "filled",
          ticksPerStep = 1,
          spin = "cw",
        } = props;
        return squareFrame(tick, { size, centre, ticksPerStep, spin });
      }

      case "flux": {
        const {
          frames = "braille",
          width = 1,
          height = 1,
          phaseStep = 1,
          ticksPerStep = 1,
          spin = "cw",
        } = props;
        return fluxFrame(tick, {
          frames,
          width,
          height,
          phaseStep,
          ticksPerStep,
          spin,
        });
      }

      case "linear": {
        const {
          direction = "horizontal",
          flow = "forwards",
          style = "classic",
          totalSlots = 3,
          litSlots = 2,
          ticksPerStep = 3,
        } = props;
        return linearFrame(tick, {
          direction,
          flow,
          style,
          totalSlots,
          litSlots,
          ticksPerStep,
        });
      }

      case "bar": {
        const {
          preset,
          orientation = "horizontal",
          width = 20,
          thickness = 1,
          arcWidth = 0,
          motion = "bounce",
          style = "braille",
          track = "rail",
          fadeWidth = 3,
          spin = "cw",
        } = props;
        return barFrame(tick, {
          preset,
          orientation,
          width,
          thickness,
          arcWidth,
          motion,
          style,
          track,
          fadeWidth,
          spin,
        });
      }
    }
  }, [tick, props]);

  return <FrameGrid frame={frame} className={props.className} />;
}
