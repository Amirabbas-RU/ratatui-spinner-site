//! Dumps canonical frames from every widget so the TypeScript port can be
//! diffed against the real thing. Not part of the crate's own examples.

use ratatui::text::Text;
use ratatui_spinner::{
    BarMotion, BarOrientation, BarSpinner, BarStyle, BarTrack, Centre, CircleSpinner, Direction,
    Flow, FluxFrames, FluxSpinner, LinearSpinner, LinearStyle, RectShape, RectSpinner, Spin,
    SquareSpinner,
};

/// Flattens a rendered frame to one line per terminal row so the layout is
/// unambiguous even when a row is only a braille blank.
fn dump<T: Into<Text<'static>>>(spinner: T) -> String {
    let text: Text<'static> = spinner.into();
    text.lines
        .iter()
        .map(|line| {
            line.spans
                .iter()
                .map(|s| s.content.as_ref())
                .collect::<Vec<_>>()
                .join("")
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// Substitutes `~` for spaces so row structure survives the text dump. `~` is
/// not a glyph any of these widgets can emit, so the round-trip is lossless
/// (unlike `·`, which `LinearStyle::Classic` uses as its inactive symbol).
fn section(name: &str, body: String) {
    println!("### {name}");
    println!("{}", body.replace(' ', "~"));
    println!();
}

/// `BarSpinner` has no `Into<Text>`, so render it into a `TestBackend` and
/// read the cells back.
fn dump_bar(spinner: &BarSpinner<'_>, width: u16, height: u16) -> String {
    use ratatui::backend::TestBackend;
    use ratatui::layout::Rect;
    use ratatui::widgets::Widget;
    use ratatui::Terminal;

    let area = Rect::new(0, 0, width, height);
    let mut terminal = Terminal::new(TestBackend::new(width, height)).unwrap();
    terminal
        .draw(|frame| frame.render_widget(spinner, area))
        .unwrap();

    let buffer = terminal.backend().buffer().clone();
    (0..height)
        .map(|y| {
            (0..width)
                .map(|x| buffer[(x, y)].symbol().to_string())
                .collect::<String>()
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn main() {
    const TICKS: [u64; 12] = [0,1,2,3,4,5,6,7,8,9,10,11];

    // ── CircleSpinner ─────────────────────────────────────────────────────
    for (label, radius, arc_len, spin) in [
        ("r4-auto", 4usize, 0usize, Spin::Clockwise),
        ("r8-auto", 8, 0, Spin::Clockwise),
        ("r9-len12", 9, 12, Spin::Clockwise),
        ("r4-ccw", 4, 0, Spin::CounterClockwise),
        ("r1", 1, 0, Spin::Clockwise),
        ("r2-len1", 2, 1, Spin::Clockwise),
        ("r5-len99", 5, 99, Spin::Clockwise),
        ("r6-tps2", 6, 0, Spin::Clockwise),
    ] {
        for tick in TICKS {
            let tps = if label == "r6-tps2" { 2 } else { 1 };
            section(
                &format!("circle/{label}/t{tick}"),
                dump(
                    CircleSpinner::new(tick)
                        .radius(radius)
                        .arc_len(arc_len)
                        .ticks_per_step(tps)
                        .spin(spin),
                ),
            );
        }
    }

    // ── SquareSpinner ────────────────────────────────────────────────────
    for (label, size, centre, spin) in [
        ("s2-filled", 2usize, Centre::Filled, Spin::Clockwise),
        ("s2-empty", 2, Centre::Empty, Spin::Clockwise),
        ("s3-filled", 3, Centre::Filled, Spin::Clockwise),
        ("s4-filled", 4, Centre::Filled, Spin::Clockwise),
        ("s4-empty", 4, Centre::Empty, Spin::Clockwise),
        ("s5-filled", 5, Centre::Filled, Spin::Clockwise),
        ("s6-ccw", 6, Centre::Filled, Spin::CounterClockwise),
        ("s7-empty", 7, Centre::Empty, Spin::Clockwise),
        ("s8-empty", 8, Centre::Empty, Spin::Clockwise),
        ("s8-tps3", 8, Centre::Filled, Spin::Clockwise),
        ("s8-ccw", 8, Centre::Filled, Spin::CounterClockwise),
    ] {
        for tick in TICKS {
            let tps = if label == "s8-tps3" { 3 } else { 1 };
            section(
                &format!("square/{label}/t{tick}"),
                dump(
                    SquareSpinner::new(tick)
                        .size(size)
                        .centre(centre)
                        .ticks_per_step(tps)
                        .spin(spin),
                ),
            );
        }
    }

    // ── RectSpinner ──────────────────────────────────────────────────────
    for (label, size, centre, spin) in [
        ("r2-filled", 2usize, Centre::Filled, Spin::Clockwise),
        ("r3-empty", 3, Centre::Empty, Spin::Clockwise),
        ("r5-ccw", 5, Centre::Filled, Spin::CounterClockwise),
        ("r7-ccw-empty", 7, Centre::Empty, Spin::CounterClockwise),
    ] {
        for tick in TICKS {
            section(
                &format!("rect/{label}/t{tick}"),
                dump(
                    RectSpinner::new(tick)
                        .shape(RectShape::Square(size))
                        .centre(centre)
                        .spin(spin),
                ),
            );
        }
    }

    // ── FluxSpinner ──────────────────────────────────────────────────────
    for (label, frames, width, height, phase, spin) in [
        ("braille-1x1", FluxFrames::BRAILLE, 1usize, 1usize, 1u8, Spin::Clockwise),
        ("braille-6x1", FluxFrames::BRAILLE, 6, 1, 1, Spin::Clockwise),
        ("braille-4x2", FluxFrames::BRAILLE, 4, 2, 1, Spin::Clockwise),
        ("braille-4x2-ccw", FluxFrames::BRAILLE, 4, 2, 1, Spin::CounterClockwise),
        ("braille-4x2-p0", FluxFrames::BRAILLE, 4, 2, 0, Spin::Clockwise),
        ("orbit-5x1", FluxFrames::ORBIT, 5, 1, 2, Spin::Clockwise),
        ("classic-4x1", FluxFrames::CLASSIC, 4, 1, 1, Spin::Clockwise),
        ("dice-6x1", FluxFrames::DICE, 6, 1, 1, Spin::Clockwise),
        ("pulse-3x1", FluxFrames::PULSE, 3, 1, 1, Spin::Clockwise),
        ("circlefill-5x1", FluxFrames::CIRCLE_FILL, 5, 1, 1, Spin::Clockwise),
    ] {
        for tick in TICKS {
            section(
                &format!("flux/{label}/t{tick}"),
                dump(
                    FluxSpinner::new(tick)
                        .frames(frames)
                        .width(width)
                        .height(height)
                        .phase_step(phase)
                        .spin(spin),
                ),
            );
        }
    }

    // ── LinearSpinner ────────────────────────────────────────────────────
    for (label, dir, flow, style, total, lit) in [
        ("h-classic-3", Direction::Horizontal, Flow::Forwards, LinearStyle::Classic, 3usize, 2usize),
        ("h-classic-3b", Direction::Horizontal, Flow::Backwards, LinearStyle::Classic, 3, 2),
        ("h-diamond-6", Direction::Horizontal, Flow::Forwards, LinearStyle::Diamond, 6, 3),
        ("h-braille-5", Direction::Horizontal, Flow::Forwards, LinearStyle::Braille, 5, 2),
        ("h-arrow-4", Direction::Horizontal, Flow::Forwards, LinearStyle::Arrow, 4, 2),
        ("h-square-4", Direction::Horizontal, Flow::Forwards, LinearStyle::Square, 4, 2),
        ("h-bar-5", Direction::Horizontal, Flow::Forwards, LinearStyle::Bar, 5, 2),
        ("h-classic-1", Direction::Horizontal, Flow::Forwards, LinearStyle::Classic, 1, 1),
        ("h-all-lit", Direction::Horizontal, Flow::Forwards, LinearStyle::Classic, 4, 9),
        ("h-wrap-5", Direction::Horizontal, Flow::Forwards, LinearStyle::Diamond, 5, 3),
        ("v-classic-3", Direction::Vertical, Flow::Forwards, LinearStyle::Classic, 3, 2),
        ("v-classic-1", Direction::Vertical, Flow::Forwards, LinearStyle::Classic, 1, 2),
        ("v-diamond-4b", Direction::Vertical, Flow::Backwards, LinearStyle::Diamond, 4, 2),
        ("v-arrow-5", Direction::Vertical, Flow::Forwards, LinearStyle::Arrow, 5, 2),
        ("v-braille-4", Direction::Vertical, Flow::Forwards, LinearStyle::Braille, 4, 2),
        ("v-bar-6", Direction::Vertical, Flow::Backwards, LinearStyle::Bar, 6, 1),
        ("v-square-3", Direction::Vertical, Flow::Forwards, LinearStyle::Square, 3, 1),
    ] {
        for tick in TICKS {
            section(
                &format!("linear/{label}/t{tick}"),
                dump(
                    LinearSpinner::new(tick)
                        .direction(dir)
                        .flow(flow)
                        .linear_style(style)
                        .total_slots(total)
                        .lit_slots(lit),
                ),
            );
        }
    }

    // ── BarSpinner ───────────────────────────────────────────────────────
    for (label, motion, style, track, fade, width, thick, spin) in [
        ("bounce-braille", BarMotion::Bounce, BarStyle::Braille, BarTrack::Rail, 3usize, 20usize, 1usize, Spin::Clockwise),
        ("loop-braille", BarMotion::Loop, BarStyle::Braille, BarTrack::Rail, 3, 20, 1, Spin::Clockwise),
        ("loop-braille-ccw", BarMotion::Loop, BarStyle::Braille, BarTrack::Rail, 3, 20, 1, Spin::CounterClockwise),
        ("squeeze", BarMotion::Squeeze, BarStyle::Braille, BarTrack::Rail, 3, 20, 1, Spin::Clockwise),
        ("radiate", BarMotion::Radiate, BarStyle::Braille, BarTrack::Rail, 3, 20, 1, Spin::Clockwise),
        ("fade0", BarMotion::Bounce, BarStyle::Braille, BarTrack::Rail, 0, 20, 1, Spin::Clockwise),
        ("fade1", BarMotion::Bounce, BarStyle::Braille, BarTrack::Rail, 1, 20, 1, Spin::Clockwise),
        ("fade5", BarMotion::Bounce, BarStyle::Braille, BarTrack::Rail, 5, 20, 1, Spin::Clockwise),
        ("thick2", BarMotion::Bounce, BarStyle::Braille, BarTrack::Rail, 3, 20, 2, Spin::Clockwise),
        ("full", BarMotion::Bounce, BarStyle::Braille, BarTrack::Full, 3, 20, 1, Spin::Clockwise),
        ("empty", BarMotion::Bounce, BarStyle::Braille, BarTrack::Empty, 3, 20, 1, Spin::Clockwise),
        ("block", BarMotion::Bounce, BarStyle::Block, BarTrack::Rail, 3, 20, 1, Spin::Clockwise),
        ("star", BarMotion::Bounce, BarStyle::Star, BarTrack::Rail, 3, 20, 1, Spin::Clockwise),
        ("heart", BarMotion::Bounce, BarStyle::Heart, BarTrack::Rail, 3, 20, 1, Spin::Clockwise),
        ("wave", BarMotion::Bounce, BarStyle::Wave, BarTrack::Rail, 3, 20, 1, Spin::Clockwise),
        ("arrow", BarMotion::Bounce, BarStyle::Arrow, BarTrack::Rail, 3, 20, 1, Spin::Clockwise),
        ("narrow-arc", BarMotion::Bounce, BarStyle::Braille, BarTrack::Rail, 3, 8, 1, Spin::Clockwise),
        ("verynarrow", BarMotion::Bounce, BarStyle::Braille, BarTrack::Rail, 3, 4, 1, Spin::Clockwise),
    ] {
        for tick in TICKS {
            let s = BarSpinner::new(tick)
                .width(width)
                .height(thick)
                .motion(motion)
                .bar_style(style)
                .track(track)
                .fade_width(fade)
                .spin(spin);
            section(
                &format!("bar/{label}/t{tick}"),
                dump_bar(&s, width as u16, thick as u16),
            );
        }
    }

    // Vertical bars.
    for (label, motion, style, height) in [
        ("v-bounce", BarMotion::Bounce, BarStyle::Braille, 10usize),
        ("v-loop", BarMotion::Loop, BarStyle::Braille, 10),
        ("v-squeeze", BarMotion::Squeeze, BarStyle::Braille, 10),
        ("v-radiate", BarMotion::Radiate, BarStyle::Braille, 10),
        ("v-block", BarMotion::Bounce, BarStyle::Block, 10),
    ] {
        for tick in TICKS {
            let s = BarSpinner::new(tick)
                .orientation(BarOrientation::Vertical)
                .width(height)
                .motion(motion)
                .bar_style(style);
            section(
                &format!("bar/{label}/t{tick}"),
                dump_bar(&s, 1, height as u16),
            );
        }
    }

    // ── Presets ──────────────────────────────────────────────────────────
    for (label, make) in [
        ("zed", BarSpinner::zed as fn(u64) -> BarSpinner<'static>),
        ("claude", BarSpinner::claude),
        ("minimal", BarSpinner::minimal),
        ("solid", BarSpinner::solid),
    ] {
        for tick in TICKS {
            let s = make(tick).width(20);
            section(&format!("preset/{label}/t{tick}"), dump_bar(&s, 20, 2));
        }
    }

    // ── Glyph tables ─────────────────────────────────────────────────────
    // Every hand-transcribed constant in the TS port is checked verbatim.
    println!("### tables");
    println!("linear");
    for (name, (on, off)) in [
        ("classic", LinearStyle::Classic.symbols(Direction::Horizontal)),
        ("square", LinearStyle::Square.symbols(Direction::Horizontal)),
        ("diamond", LinearStyle::Diamond.symbols(Direction::Horizontal)),
        ("bar", LinearStyle::Bar.symbols(Direction::Horizontal)),
        ("braille", LinearStyle::Braille.symbols(Direction::Horizontal)),
        ("arrow", LinearStyle::Arrow.symbols(Direction::Horizontal)),
        (
            "arrowVertical",
            LinearStyle::Arrow.symbols(Direction::Vertical),
        ),
    ] {
        println!("{name} {on} {off}");
    }

    println!("flux");
    for (name, seq) in [
        ("braille", FluxFrames::BRAILLE),
        ("orbit", FluxFrames::ORBIT),
        ("classic", FluxFrames::CLASSIC),
        ("line", FluxFrames::LINE),
        ("block", FluxFrames::BLOCK),
        ("arc", FluxFrames::ARC),
        ("clock", FluxFrames::CLOCK),
        ("moon", FluxFrames::MOON),
        ("triangles", FluxFrames::TRIANGLES),
        ("pulse", FluxFrames::PULSE),
        ("bounce", FluxFrames::BOUNCE),
        ("half", FluxFrames::HALF),
        ("square", FluxFrames::SQUARE),
        ("dice", FluxFrames::DICE),
        ("bar", FluxFrames::BAR),
        ("corners", FluxFrames::CORNERS),
        ("circleFill", FluxFrames::CIRCLE_FILL),
        ("piston", FluxFrames::PISTON),
        ("star", FluxFrames::STAR),
        ("pair", FluxFrames::PAIR),
        ("diamond", FluxFrames::DIAMOND),
    ] {
        println!("{name} {}", seq.iter().collect::<String>());
    }

    println!("bar");
    for (name, style) in [
        ("block", BarStyle::Block),
        ("shade", BarStyle::Shade),
        ("dot", BarStyle::Dot),
        ("diamond", BarStyle::Diamond),
        ("square", BarStyle::Square),
        ("star", BarStyle::Star),
        ("heart", BarStyle::Heart),
        ("arrow", BarStyle::Arrow),
        ("circle", BarStyle::Circle),
        ("spark", BarStyle::Spark),
        ("cross", BarStyle::Cross),
        ("progress", BarStyle::Progress),
        ("thick", BarStyle::Thick),
        ("wave", BarStyle::Wave),
        ("pip", BarStyle::Pip),
        ("braille", BarStyle::Braille),
    ] {
        // `BarStyle::chars` is crate-private, so the pair is read off a real
        // frame: the arc cell and the trailing track cell.
        let s = BarSpinner::new(0)
            .width(12)
            .height(1)
            .bar_style(style)
            .fade_width(0)
            .track(BarTrack::Rail);
        let row = dump_bar(&s, 12, 1).replace(' ', "~");
        // The row uses exactly two distinct glyphs, in order: arc then track.
        let mut seen: Vec<char> = Vec::new();
        for ch in row.chars() {
            if !seen.contains(&ch) {
                seen.push(ch);
            }
        }
        let glyphs: String = seen.iter().collect::<String>().replace('~', " ");
        println!("{name} {glyphs}");
    }

    // ── char_size ────────────────────────────────────────────────────────
    println!("### char_size");
    println!(
        "circle r4 {:?}\ncircle r8 {:?}\ncircle r9 {:?}",
        CircleSpinner::new(0).radius(4).char_size(),
        CircleSpinner::new(0).radius(8).char_size(),
        CircleSpinner::new(0).radius(9).char_size()
    );
    for size in 2..=8usize {
        println!("square s{size} {:?}", SquareSpinner::new(0).size(size).char_size());
    }
    println!("flux 4x2 {:?}", FluxSpinner::new(0).width(4).height(2).char_size());
    println!("bar 20x1 {:?}", BarSpinner::new(0).width(20).height(1).char_size());
    println!("bar auto {:?}", BarSpinner::new(0).char_size());
}
