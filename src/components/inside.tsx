import {
  BRAILLE_BASE,
  BRAILLE_MAP,
  barCharSize,
  calcDimension,
  circleCharSize,
  circlePerimeter,
  FLUX_FRAMES,
  fluxCharSize,
  fluxFrame,
  squareCharSize,
} from "@/lib/spinners";

import { CodeBlock, Section } from "./ui";
import { Frame } from "./spinner";

const toFa = (n: number | string) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

/* ── Facts, derived from the port rather than typed in ─────────────────── */

const BRAILLE_CELLS = Array.from(
  { length: 4 },
  (_, r) => BRAILLE_MAP[r]
);

/** Cell (col 0, row 0) + the one cell whose four lowest dots are all set. */
const BRAILLE_SAMPLES = [
  { label: "بدون نقطه", code: BRAILLE_BASE },
  { label: "۴ نقطهٔ پایین", code: BRAILLE_BASE + 0b01111000 },
];

const R8 = circlePerimeter(8);

/**
 * The same wave at three phase steps, rendered by the port itself rather than
 * assembled from the glyph table — `fluxFrame` is one of the functions
 * verify-port.ts diffs against real Rust frames, so these strings are the
 * crate's, not a transcription of it.
 */
const WAVES = [
  { label: "phase ۰", phaseStep: 0 },
  { label: "phase ۱", phaseStep: 1 },
  { label: "phase ۲", phaseStep: 2 },
  { label: "phase ۴", phaseStep: 4 },
].map((w) => ({
  ...w,
  frame: fluxFrame(0, { frames: "braille", width: 6, phaseStep: w.phaseStep }),
}));

/** Perimeter dots for a handful of radii — the growth is quadratic, not linear. */
const PERIMETER_ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => ({
  radius: r,
  dots: circlePerimeter(r).length,
  cols: circleCharSize({ radius: r }).cols,
  rows: circleCharSize({ radius: r }).rows,
}));

/* ── Rust excerpts, verbatim from the crate ───────────────────────────── */

const BRAILLE_RS = `const BRAILLE_BASE: u32 = 0x2800;

/// Bit index within a braille byte, indexed by \`(dot_row % 4, dot_col % 2)\`.
const BRAILLE_MAP: [[u8; 2]; 4] = [
    [0, 3], // row 0: left→bit 0,  right→bit 3
    [1, 4], // row 1: left→bit 1,  right→bit 4
    [2, 5], // row 2: left→bit 2,  right→bit 5
    [6, 7], // row 3: left→bit 6,  right→bit 7
];`;

const PACK_RS = `let ci = r / 4;
let cj = c / 2;
if ci >= char_rows || cj >= char_cols {
    continue;
}
let bit = BRAILLE_MAP[r % 4][c % 2];
if arc_set.contains(&(dot.row, dot.col)) {
    bright[ci][cj] |= 1 << bit;
} else {
    dim[ci][cj] |= 1 << bit;
}`;

const PERIMETER_RS = `fn circle_perimeter(r: usize) -> Vec<Dot> {
    let mut points: HashSet<(isize, isize)> = HashSet::new();
    let mut x: isize = 0;
    let mut y: isize = r as isize;
    let mut d: isize = 1 - r as isize;

    while x <= y {
        // All 8 octant reflections — no column scaling, pure 1:1 pitch.
        for &(px, py) in &[(x, -y), (y, -x), (y, x), (x, y),
                            (-x, y), (-y, x), (-y, -x), (-x, -y)] {
            points.insert((py, px)); // (row, col) — no ×2
        }
        if d < 0 { d += 2 * x + 3; }
        else { d += 2 * (x - y) + 5; y -= 1; }
        x += 1;
    }
    sort_clockwise(points.into_iter().collect())
}`;

const SORT_RS = `// The centroid, not the origin, so an off-centre ring still sorts right.
let cr = dots.iter().map(|&(r, _)| r as f64).sum::<f64>() / n;
let cc = dots.iter().map(|&(_, c)| c as f64).sum::<f64>() / n;

dots.into_iter().map(|(r, c)| {
    let dr = -(r as f64 - cr);
    let dc = c as f64 - cc;
    let raw = dc.atan2(dr); // 0 = top, increases clockwise
    let angle = if raw < 0.0 { raw + 2.0 * std::f64::consts::PI } else { raw };
    (angle, r, c)
})
// sorted ascending → 12 o'clock first, then clockwise`;

const FLUX_RS = `let cell_idx = r * self.width + c;
let phase = cell_idx * usize::from(self.phase_step);
let raw = base.wrapping_add(phase);
let frame_idx = if ccw { (n - raw % n) % n } else { raw % n };
let ch = self.frames[frame_idx];`;

const CLAMP_RS = `pub fn char_size(&self) -> Option<(usize, usize)> {
    if self.width == 0 {
        None
    } else {
        Some((self.width.max(3), self.height.max(1)))
    }
}`;

const SQ_RS = `pub fn char_size(&self) -> (u16, u16) {
    let dm = calc_dimension(self.size);
    let offset = vertical_offset(self.size) as usize;
    let total_rows = dm + offset;
    let char_cols = dm.div_ceil(2);
    let char_rows = total_rows.div_ceil(4);
    (char_cols as u16, char_rows as u16)
}`;

/* ── Section ──────────────────────────────────────────────────────────── */

export function Inside() {
  return (
    <Section
      id="inside"
      label="۰۴ · زیرِ کاپوت"
      title={
        <>
          هر فریم، پیش از آنکه
          <br />
          روی صفحه بیفتد
        </>
      }
      intro="این بخش توضیح نمی‌دهد که ویجت‌ها چه شکلی دارند — بخش ویجت‌ها همین را نشان می‌دهد. اینجا سراغ این است که هر فریم *واقعاً* چطور ساخته می‌شود. تمام اعداد این صفحه از همان پورتی گرفته می‌شوند که در برابر خروجی واقعی کریت diff شده است، پس نمی‌توانند از خودِ کتابخانه جدا بیفتند."
      tone="raised"
    >
      <div className="mt-12 space-y-4">
        <Dots />
        <CircleMath />
        <WaveMath />
        <Sizes />
      </div>
    </Section>
  );
}

/* ── ۰۱ · نقطه‌های برایل ──────────────────────────────────────────────── */

function Dots() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="panel min-w-0 p-5 sm:p-6">
        <h3 className="font-display text-lg font-medium">
          هر کاراکتر، هشت نقطه
        </h3>
        <p className="mt-2 text-sm leading-8 text-muted-foreground">
          کریت روی گلیف <span className="font-mono text-foreground">⠿</span> و
          هم‌خانواده‌هایش ساخته می‌شود. یک سلول ترمینال{" "}
          <b className="font-medium text-foreground">۲ ستون نقطه</b> در کنار{" "}
          <b className="font-medium text-foreground">۴ ردیف نقطه</b> را در خود
          جا می‌دهد — یعنی هشت بیت، دقیقاً همان چیزی که یک بایت نگه می‌دارد.
        </p>
        <p className="mt-2 text-sm leading-8 text-muted-foreground">
          اما ترتیب بیت‌ها شماره‌گذاری ساده نیست. جدول زیر همان چیزی است که در
          <span className="font-mono text-foreground"> circle_spinner.rs</span>{" "}
          نوشته شده — ستون چپ و راست هر ردیف، و شمارهٔ بیتی که روشن می‌کنند.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[22rem] border-collapse text-center font-mono text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="p-2 text-start font-normal">ردیف نقطه</th>
                <th className="p-2 font-normal">ستون چپ</th>
                <th className="p-2 font-normal">ستون راست</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              {BRAILLE_CELLS.map((pair, r) => (
                <tr key={r} className="border-t border-border">
                  <td className="p-2 text-start text-muted-foreground">
                    {toFa(r)}
                  </td>
                  <td className="p-2">
                    <span className="text-accent-hue">{toFa(pair[0])}</span>
                  </td>
                  <td className="p-2">
                    <span className="text-accent-hue">{toFa(pair[1])}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          سه ردیف اول یک الگو را ادامه می‌دهند (ستون چپ: ۰، ۱، ۲). ردیف چهارم
          الگو را نمی‌شکند بلکه به انتهای جدول می‌پرد — ۶ و ۷، نه ۳ و ۶ — و
          همین است که به برایل استاندارد یونیکد می‌رسد.
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <CodeBlock code={BRAILLE_RS} filename="src/circle_spinner.rs" language="rust" />
        <div className="panel p-5 sm:p-6">
          <h4 className="text-sm font-medium">پایهٔ یک بایت</h4>
          <p className="mt-1.5 text-sm leading-8 text-muted-foreground">
            عدد{" "}
            <span className="font-mono text-foreground">
              0x2800 = {toFa(0x2800)}
            </span>{" "}
            یعنی خودِ کاراکتر «برایلِ خالی» در یونیکد. هر نقطهٔ روشن، یک بیت به
            آن اضافه می‌کند — و کریت دو صفحه نگه می‌دارد، یکی برای قوسِ
            روشن و یکی برای بقیهٔ حلقه:
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {BRAILLE_SAMPLES.map((s) => (
              <div
                key={s.code}
                className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2.5"
              >
                <span className="spin text-2xl">{String.fromCodePoint(s.code)}</span>
                <span className="min-w-0">
                  <span className="block text-xs text-foreground">{s.label}</span>
                  <span className="block font-mono text-[11px] text-muted-foreground">
                    0x{s.code.toString(16).toUpperCase()}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <CodeBlock
            code={PACK_RS}
            filename="src/circle_spinner.rs"
            language="rust"
            className="mt-4"
            highlightLines={[1, 2, 6]}
          />
        </div>
      </div>
    </div>
  );
}

/* ── ۰۲ · ریاضیِ حلقه ─────────────────────────────────────────────────── */

function CircleMath() {
  return (
    <div className="panel min-w-0 p-5 sm:p-6">
      <h3 className="font-display text-lg font-medium">دایره با الگوریتم نقطهٔ میانی</h3>
      <p className="mt-2 text-sm leading-8 text-muted-foreground">
        برای ساختن حلقه، کریت شعاع را{" "}
        <span className="font-mono text-foreground">r</span> می‌گیرد و الگوریتم
        نقطهٔ میانی را در <b className="font-medium text-foreground">گامِ نقطه‌ای
        ۱:۱</b> اجرا می‌کند — یعنی نه در مختصات پیکسل، بلکه مستقیم در مختصات
        نقطه. هر تصمیم الگوریتم یک هشت‌ضلعی کامل را می‌سازد و{" "}
        <span className="font-mono text-foreground">HashSet</span> تکراری‌ها را
        حذف می‌کند.
      </p>
      <p className="mt-2 text-sm leading-8 text-muted-foreground">
        چرا ۱:۱؟ چون هر سلول ترمینال{" "}
        <b className="font-medium text-foreground">۲ برابر بلندتر از عرضش</b>{" "}
        است. یک ستون نقطه = نصف عرض سلول، و یک ردیف نقطه = یک‌چهارم ارتفاع
        سلول = نصف عرض سلول. دو ضریب دقیقاً همدیگر را خنثی می‌کنند و نتیجه
        دایره‌ای است که در ترمینال واقعاً گرد دیده می‌شود.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <CodeBlock
          code={PERIMETER_RS}
          filename="src/circle_spinner.rs"
          language="rust"
          highlightLines={[9, 10]}
        />
        <CodeBlock code={SORT_RS} filename="src/circle_spinner.rs" language="rust" />
      </div>

      <p className="mt-5 text-sm leading-8 text-muted-foreground">
        مرتب‌سازی ساعت‌گرد از ساعت دوازده شروع می‌شود: زاویه با{" "}
        <span className="font-mono text-foreground">atan2</span> حساب می‌شود و
        منفی‌ها با افزودن ۲π به بازهٔ صفر تا ۲π می‌آیند. نقطه‌هایی که دقیقاً
        هم‌ارتفاع‌اند با هم مقایسه می‌شوند و ترتیبشان بین{" "}
        <span className="font-mono text-foreground">cw</span> و{" "}
        <span className="font-mono text-foreground">ccw</span> برعکس می‌شود.
        نتیجه یک فهرست بسته است که هر فریم فقط سر و دمش را جلو می‌برد.
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-center font-mono text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="p-2 text-start font-normal">شعاع</th>
              {PERIMETER_ROWS.map((r) => (
                <th key={r.radius} className="p-2 font-normal">
                  {toFa(r.radius)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="p-2 text-start text-muted-foreground">نقطه‌ها</td>
              {PERIMETER_ROWS.map((r) => (
                <td key={r.radius} className="p-2 text-accent-hue">
                  {toFa(r.dots)}
                </td>
              ))}
            </tr>
            <tr className="border-t border-border">
              <td className="p-2 text-start text-muted-foreground">سلول</td>
              {PERIMETER_ROWS.map((r) => (
                <td key={r.radius} className="p-2 text-foreground">
                  {toFa(r.cols)}×{toFa(r.rows)}
                </td>
              ))}
            </tr>
            <tr className="border-t border-border">
              <td className="p-2 text-start text-muted-foreground">طول قوس پیش‌فرض</td>
              {PERIMETER_ROWS.map((r) => (
                <td key={r.radius} className="p-2 text-foreground">
                  {toFa(Math.max(1, Math.floor(r.dots / 4)))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 font-mono text-[11px] leading-6 text-muted-foreground">
        تعداد نقطه‌ها رشد کوادراتیک دارد: شعاع {toFa(1)} →{" "}
        {toFa(PERIMETER_ROWS[0].dots)} نقطه، شعاع {toFa(8)} → {toFa(R8.length)}{" "}
        نقطه. به همین دلیل arc_len پیش‌فرض هم{" "}
        <span className="font-mono">n/4</span> است تا کمانِ دنباله‌دار نسبتِ
        ثابتی از محیط بماند.
      </p>
    </div>
  );
}

/* ── ۰۳ · موجِ فاز ────────────────────────────────────────────────────── */

function WaveMath() {
  const braille = FLUX_FRAMES.braille as readonly string[];
  const n = braille.length;
  const steps = [0, 1, 2, 3];
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="panel min-w-0 p-5 sm:p-6">
        <h3 className="font-display text-lg font-medium">
          فاز، موج می‌سازد
        </h3>
        <p className="mt-2 text-sm leading-8 text-muted-foreground">
          در{" "}
          <span className="font-mono text-foreground">FluxSpinner</span> هر سلول
          مستقل نیست. اندیسِ سلول در فاز ضرب می‌شود، پس سلولِ چهارم{" "}
          <span className="font-mono text-foreground">phase_step</span> فریم عقب‌تر
          از سلول اول است. نتیجه یک موج است، نه یک انیمیشنِ تکراری.
        </p>
        <p className="mt-2 text-sm leading-8 text-muted-foreground">
          نکتهٔ ظریف: جمع با{" "}
          <span className="font-mono text-foreground">wrapping_add</span> انجام
          می‌شود، نه با باقیماندهٔ ساده. برای همین یک{" "}
          <span className="font-mono text-foreground">tick</span> خیلی بزرگ هم
          هرگز سرریز نمی‌کند و دقیقاً همان فریمی را می‌دهد که{" "}
          <span className="font-mono text-foreground">tick % n</span> می‌داد.
        </p>
        <p className="mt-2 text-sm leading-8 text-muted-foreground">
          چون فرمول فقط به{" "}
          <span className="font-mono text-foreground">raw % n</span> نگاه می‌کند،
          حتی <span className="font-mono text-foreground">phase_step</span>{" "}
          بزرگ‌تر از طول مجموعه هم بی‌خطر است. کریت خودش این را تست دارد:
          مجموعهٔ <span className="font-mono text-foreground">braille</span>{" "}
          با گام {toFa(n)} دقیقاً همان خروجی گام صفر را می‌دهد.
        </p>

        {/* The rows below are the port's own output, not a hand-typed copy —
            the same frames this site renders everywhere else, so they cannot
            drift from what the crate produces. Each cell keeps the tone the
            widget painted it with, so the lit head of the wave is the accent
            colour and the empty tail is dim — the difference is legible at a
            glance, which is the entire point of the block. */}
        <div className="mt-5 space-y-2">
          {WAVES.map((w) => (
            <div
              key={w.phaseStep}
              className="grid grid-cols-[4.5rem_1fr] items-center gap-3 rounded-md border border-border/60 bg-background px-3 py-2.5"
            >
              <span className="font-mono text-[11px] text-muted-foreground">
                {w.label}
              </span>
              <Frame
                frame={w.frame}
                label={`موج بریل با گام فاز ${w.phaseStep}`}
                className="spin-ascii justify-self-start"
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          هر سطر بالا خروجیِ واقعی همان پورتی است که این صفحه با آن رندر
          می‌شود — پس دقیقاً همان چیزی است که کریت برمی‌گرداند. سلول‌های روشن
          (رنگِ لهجه) سرِ موج‌اند و سلول‌های کم‌رنگ دنبالهٔ آن. مجموعهٔ{" "}
          <span className="font-mono text-foreground">braille</span>{" "}
          {toFa(n)} فریم دارد و{" "}
          <span className="font-mono text-foreground">width(۶)</span> فقط شش
          سلول از آن موج را نشان می‌دهد.
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <CodeBlock
          code={FLUX_RS}
          filename="src/flux_spinner.rs"
          language="rust"
          highlightLines={[2, 3, 4]}
        />
        <div className="panel p-5 sm:p-6">
          <h4 className="text-sm font-medium">اندیسِ گلیف در هر سلول</h4>
          <p className="mt-1.5 text-sm leading-8 text-muted-foreground">
            فرمول دقیقاً{" "}
            <span className="font-mono text-foreground">
              (base + cell × step) % n
            </span>{" "}
            است. جدول زیر شمارهٔ گلیفی است که هر سلول واقعاً از آن می‌خواند،
            در تیک صفر:
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[20rem] border-collapse text-center font-mono text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="p-2 text-start font-normal">سلول</th>
                  {steps.map((s) => (
                    <th key={s} className="p-2 font-normal">
                      step {toFa(s)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-foreground">
                {steps.map((_, c) => (
                  <tr key={c} className="border-t border-border">
                    <td className="p-2 text-start text-muted-foreground">
                      {toFa(c)}
                    </td>
                    {steps.map((s) => {
                      const idx = (c * s) % n;
                      return (
                        <td key={s} className="p-2">
                          <span className="block text-[10px] text-accent-hue">
                            {toFa(idx)}
                          </span>
                          {/* One braille cell needs room to resolve into its
                              eight dots; at body size it is a grey box. */}
                          <span className="spin spin-lg mt-1 block text-center">
                            {braille[idx]}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            ستون{" "}
            <span className="font-mono text-foreground">step ۰</span> همه‌جا{" "}
            {toFa(0)} است — همهٔ سلول‌ها یک گلیف، یعنی موجی وجود ندارد. در{" "}
            <span className="font-mono text-foreground">step ۱</span> هر سلول
            یک خانه جلوتر از سلول قبلی است.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── ۰۴ · اندازه ──────────────────────────────────────────────────────── */

function Sizes() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="panel min-w-0 p-5 sm:p-6">
        <h3 className="font-display text-lg font-medium">
          اندازه، از روی فریم
        </h3>
        <p className="mt-2 text-sm leading-8 text-muted-foreground">
          هر ویجت یک متد <span className="font-mono text-foreground">char_size</span>{" "}
          دارد که می‌گوید برای رندر چند ستون و چند ردیف سلول لازم است. این عدد{" "}
          <b className="font-medium text-foreground">محاسبه می‌شود</b>، ثابت
          نیست — و در جدول زیر مستقیم از همان توابع گرفته شده.
        </p>
        <div className="mt-5 space-y-2 font-mono text-xs">
          {[
            ["دایره r=۴", `${circleCharSize({ radius: 4 }).cols}×${circleCharSize({ radius: 4 }).rows}`],
            ["دایره r=۹", `${circleCharSize({ radius: 9 }).cols}×${circleCharSize({ radius: 9 }).rows}`],
            ["مربع s=۲", `${squareCharSize(2).cols}×${squareCharSize(2).rows}`],
            ["مربع s=۸", `${squareCharSize(8).cols}×${squareCharSize(8).rows}`],
            ["شارژ ۴×۲", `${fluxCharSize({ width: 4, height: 2 }).cols}×${fluxCharSize({ width: 4, height: 2 }).rows}`],
            ["نوار ۲۰×۱", `${barCharSize({ width: 20 })?.cols}×${barCharSize({ width: 20 })?.rows}`],
            ["نوار ۱×۰", `${barCharSize({ width: 1, thickness: 0 })?.cols}×${barCharSize({ width: 1, thickness: 0 })?.rows}`],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2"
            >
              <span className="text-muted-foreground">{k}</span>
              <span className="text-accent-hue">{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2">
            <span className="text-muted-foreground">نوار (عرضِ خودکار)</span>
            <span className="text-muted-foreground">None</span>
          </div>
        </div>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          دو نکته که فقط با خواندن کد معلوم می‌شود: مربع، ابعادش را با{" "}
          <span className="font-mono text-foreground">div_ceil</span> گرد می‌کند
          نه گردِ معمولی — یعنی همیشه به بالا. و نوار، وقتی عرضش صفر باشد (یعنی
          خودکار)، اصلاً اندازه‌ای ندارد و{" "}
          <span className="font-mono text-foreground">None</span> برمی‌گرداند.
        </p>
        <CodeBlock code={SQ_RS} filename="src/square_spinner.rs" language="rust" className="mt-4" />
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="panel p-5 sm:p-6">
          <h4 className="text-sm font-medium">کلمپ، نه برش</h4>
          <p className="mt-1.5 text-sm leading-8 text-muted-foreground">
            نوار کوچک‌تر از سه خانه، سه خانه می‌شود — کوتاه نمی‌شود. این یعنی
            <span className="font-mono text-foreground"> width(۱)</span> هرگز
            نوارِ تک‌خانه‌ای نمی‌سازد؛ کفِ سه خانه همیشه برقرار است.
          </p>
          <CodeBlock
            code={CLAMP_RS}
            filename="src/bar_spinner.rs"
            language="rust"
            highlightLines={[3, 4]}
            className="mt-4"
          />
        </div>
        <div className="panel p-5 sm:p-6">
          <h4 className="text-sm font-medium">چرا مربع ۱:۱ نیست</h4>
          <p className="mt-1.5 text-sm leading-8 text-muted-foreground">
            <span className="font-mono text-foreground">calc_dimension</span>{" "}
            اندازهٔ فیزیکی را می‌دهد ({" "}
            {toFa(calcDimension(2))} نقطه برای s=۲، {toFa(calcDimension(8))} برای
            s=۸)، بعد{" "}
            <span className="font-mono text-foreground">div_ceil</span> آن را به{" "}
            <span className="font-mono text-foreground">۲ ستون × ۴ ردیف</span> تقسیم
            می‌کند. اندازهٔ نهایی، بالا به بالا گرد می‌شود تا هیچ نقطه‌ای بیرون
            نیفتد.
          </p>
        </div>
      </div>
    </div>
  );
}
