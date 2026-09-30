/**
 * The code samples the install section renders, kept apart from the component
 * so `scripts/verify-highlight.ts` can check the exact strings that ship.
 *
 * Every snippet is copied from the real crate — the two `Cargo.toml` blocks
 * and `main.rs` are the README's "Installation" and "First spinner" sections
 * verbatim, and the loop is from `examples/spinner.rs`.
 */

/** The crate is not on crates.io yet — the README specifies a git dependency. */
export const CARGO_GIT = `[dependencies]
ratatui-spinner = { git = "https://github.com/ratatui/ratatui-spinner" }`;

export const CARGO_PATH = `[dependencies]
ratatui-spinner = { path = "../ratatui-spinner" }`;

/**
 * The README's "First spinner", unchanged. Lines 7–8 are the whole
 * integration: build the widget with an application-owned `tick` and hand it
 * to `Frame::render_widget`. `FluxSpinner::new` defaults to `1 × 1`,
 * clockwise, cyan, one tick per frame, and the built-in braille frame set.
 */
export const FIRST_SPINNER = `use ratatui::layout::Rect;
use ratatui::style::Color;
use ratatui::Frame;
use ratatui_spinner::FluxSpinner;

fn render(frame: &mut Frame, area: Rect, tick: u64) {
    let spinner = FluxSpinner::new(tick).color(Color::Cyan);
    frame.render_widget(spinner, area);
}`;

/**
 * The tick belongs to the application, not the widget. This is the loop from
 * `examples/spinner.rs`: measure the delta, convert it to whole steps, and let
 * the counter wrap rather than grow without bound.
 */
export const TICK_LOOP = `let now = Instant::now();
let delta = now.duration_since(app.last_tick);
app.last_tick = now;

// 80 ms per step — one frame of the animation
let steps = (delta.as_millis() / 80).max(1) as u64;
app.tick = app.tick.wrapping_add(steps);

terminal.draw(|frame| render(frame, app))?;`;

/**
 * Embedding a frame in a text widget. The crate implements `From<&T>` and
 * `From<T>` for `Text` on Flux, Circle, Square, Rect and Linear, so a
 * `Cell` accepts a spinner directly. These two rows are from
 * `examples/table_embed.rs` — one by reference, one by value.
 */
export const EMBED = `use ratatui::widgets::{Cell, Row, Table};
use ratatui_spinner::{CircleSpinner, FluxSpinner};

let rows = vec![
    // by reference
    Row::new([
        Cell::from("Downloading"),
        Cell::from(&FluxSpinner::new(tick).width(8)),
    ]),
    // by value
    Row::new([
        Cell::from("Indexing"),
        Cell::from(CircleSpinner::new(tick).radius(1)),
    ]),
    // three rows tall, for the 3-row circle frame
]
.height(3);`;
