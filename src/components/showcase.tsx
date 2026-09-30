import type { ReactNode } from "react";

import {
  BAR_PRESETS,
  BAR_SYMBOL_STYLES,
  FLUX_FRAMES,
  LINEAR_STYLE_NAMES,
  barCharSize,
  circleCharSize,
  fluxCharSize,
  linearCharSize,
  squareCharSize,
} from "@/lib/spinners";

import { Spinner } from "./spinner";
import { Section } from "./ui";

/**
 * A configuration row: the real builder call on the left, the live widget on
 * the right. The code here is the same call the port is running, so the output
 * cannot drift from the snippet.
 */
function Variant({
  code,
  children,
}: {
  code: string;
  children: ReactNode;
}) {
  return (
    /* RTL reading order: the call sits at the start (right), the frame it
       produces immediately beside it. They stay adjacent rather than pushed
       to opposite edges, and wrap together on a narrow card. */
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 py-3 first:border-t-0 first:pt-0">
      <code className="code-ltr min-w-0 max-w-full shrink-0 truncate font-mono text-[11px] text-muted-foreground">
        {code}
      </code>
      <div className="min-w-0 shrink-0">{children}</div>
    </div>
  );
}

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

function toFa(n: number) {
  return String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

interface WidgetCard {
  title: string;
  tag: string;
  desc: string;
  /** Real `char_size()` output for the sizes demonstrated on the card. */
  size: string;
  demo: ReactNode;
}

/** Formats a `{cols, rows}` from `char_size` for display. */
function dims(size: { cols: number; rows: number } | null) {
  // A bar with an automatic width has no intrinsic size, and the crate says so
  // by returning `None` rather than a made-up rectangle.
  return size === null ? "None" : `${toFa(size.cols)}×${toFa(size.rows)}`;
}

const WIDGETS: WidgetCard[] = [
  {
    title: "CircleSpinner",
    tag: "کمانِ برایل",
    desc: "کمانی دنباله‌دار که روی حلقه‌ای از نقاطِ برایل می‌چرخد. الگوریتم دایرهٔ midpoint با گامِ ۱:۱، سپس مرتب‌سازی ساعت‌گرد از ساعت ۱۲.",
    size: `char_size() → r4 ${dims(circleCharSize({ radius: 4 }))} · r9 ${dims(circleCharSize({ radius: 9 }))}`,
    demo: (
      <>
        <Variant code="CircleSpinner::new(tick).radius(9)">
          <Spinner kind="circle" radius={9} className="spin-ascii" />
        </Variant>
        <Variant code=".radius(6).arc_len(9)">
          <Spinner kind="circle" radius={6} arcLen={9} className="spin-ascii" />
        </Variant>
        <Variant code=".radius(4).arc_len(0)   // ¼ خودکار">
          <Spinner kind="circle" radius={4} className="spin-ascii" />
        </Variant>
        <Variant code=".radius(5).spin(CounterClockwise)">
          <Spinner kind="circle" radius={5} spin="ccw" className="spin-ascii" />
        </Variant>
      </>
    ),
  },
  {
    title: "SquareSpinner",
    tag: "مربعِ برایل",
    desc: "همان کمانِ دوار روی قاب مربعی. اندازه بین ۲ تا ۸ محبوس است و مرکز می‌تواند پر یا توخالی باشد.",
    size: `char_size() → s2 ${dims(squareCharSize(2))} · s8 ${dims(squareCharSize(8))}`,
    demo: (
      <>
        <Variant code="SquareSpinner::new(tick).size(8)">
          <Spinner kind="square" size={8} className="spin-ascii" />
        </Variant>
        <Variant code=".size(6).centre(Centre::Empty)">
          <Spinner kind="square" size={6} centre="empty" className="spin-ascii" />
        </Variant>
        <Variant code=".size(4).spin(CounterClockwise)">
          <Spinner kind="square" size={4} spin="ccw" className="spin-ascii" />
        </Variant>
        <Variant code=".size(2).ticks_per_step(6)">
          <Spinner kind="square" size={2} ticksPerStep={6} className="spin-ascii" />
        </Variant>
      </>
    ),
  },
  {
    title: "RectSpinner",
    tag: "همان موتور، شکلِ صریح",
    desc: "مستقل نیست: `RectShape::Square` همان موتور `SquareSpinner` را صدا می‌زند، اما اندازه را در یک enum نگه می‌دارد تا بعداً شکل‌های دیگر اضافه شوند.",
    size: `char_size() → s3 ${dims(squareCharSize(3))} · s5 ${dims(squareCharSize(5))}`,
    demo: (
      <>
        <Variant code="RectSpinner::new(tick).shape(RectShape::Square(5))">
          <Spinner kind="rect" size={5} className="spin-ascii" />
        </Variant>
        <Variant code=".shape(RectShape::Square(3)).centre(Centre::Empty)">
          <Spinner kind="rect" size={3} centre="empty" className="spin-ascii" />
        </Variant>
        <Variant code=".shape(RectShape::Square(4)).spin(CounterClockwise)">
          <Spinner kind="rect" size={4} spin="ccw" className="spin-ascii" />
        </Variant>
      </>
    ),
  },
  {
    title: "BarSpinner",
    tag: "نوارِ جهنده",
    desc: "چهار نوع حرکت و شانزده سبک — پانزده جفتِ نماد به‌علاوهٔ حالت برایل. ریل می‌تواند `Rail`، `Full` یا `Empty` باشد.",
    size: `char_size() → w22 h1 ${dims(barCharSize({ width: 22 }))} · w22 h2 ${dims(barCharSize({ width: 22, thickness: 2 }))}`,
    demo: (["bounce", "loop", "squeeze", "radiate"] as const).map((motion) => (
      <Variant key={motion} code={`BarSpinner::new(tick).motion(BarMotion::${cap(motion)})`}>
        <Spinner kind="bar" motion={motion} width={22} className="spin-line" />
      </Variant>
    )),
  },
  {
    title: "FluxSpinner",
    tag: "موجِ گلیف",
    desc: "بیست‌ودو مجموعه گلیف آماده. هر سلول `phase_step` فریم با سلول قبلی فاصله دارد، پس یک موج می‌سازد.",
    size: `char_size() → 10×1 ${dims(fluxCharSize({ width: 10 }))} · 4×2 ${dims(fluxCharSize({ width: 4, height: 2 }))}`,
    demo: (
      <>
        <Variant code="FluxSpinner::new(tick).frames(BRAILLE).width(10)">
          <Spinner kind="flux" frames="braille" width={10} className="spin-line" />
        </Variant>
        <Variant code=".frames(ORBIT).width(10).phase_step(2)">
          <Spinner kind="flux" frames="orbit" width={10} phaseStep={2} className="spin-line" />
        </Variant>
        <Variant code=".frames(CLASSIC).width(10)">
          <Spinner kind="flux" frames="classic" width={10} className="spin-line" />
        </Variant>
        <Variant code=".frames(PULSE).width(4).height(2)">
          <Spinner kind="flux" frames="pulse" width={4} height={2} className="spin-ascii" />
        </Variant>
      </>
    ),
  },
  {
    title: "LinearSpinner",
    tag: "پنجرهٔ لغزان",
    desc: "شش جفت نماد. افقی یک پنجرهٔ روشن است که دور می‌چرخد؛ عمودی یک نماد که بالا و پایین می‌پرد.",
    size: `char_size() → h ${dims(linearCharSize({ totalSlots: 14 }))} · v ${dims(linearCharSize({ totalSlots: 6, direction: "vertical" }))}`,
    demo: (
      <>
        <Variant code="LinearSpinner::new(tick).total_slots(14).lit_slots(4)">
          <Spinner kind="linear" totalSlots={14} litSlots={4} className="spin-line" />
        </Variant>
        <Variant code=".linear_style(Diamond).flow(Backwards)">
          <Spinner
            kind="linear"
            totalSlots={14}
            litSlots={3}
            style="diamond"
            flow="backwards"
            className="spin-line"
          />
        </Variant>
        <Variant code=".direction(Vertical).total_slots(6)">
          <Spinner kind="linear" direction="vertical" totalSlots={6} className="spin-ascii" />
        </Variant>
      </>
    ),
  },
];

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function Showcase() {
  return (
    <Section
      id="showcase"
      label="۰۱ · ویجت‌ها"
      title={
        <>
          شش ویجت، شش شکلِ متفاوت
          <br />
          از یک تیکِ واحد
        </>
      }
      intro="هرچه اینجا می‌بینید خروجیِ مستقیمِ کدِ crate است — نه یک انیمیشنِ ساختگی. هر فریم با همان الگوریتم و همان اعداد ساخته می‌شود که در Rust اجرا می‌شود."
      className="border-t border-border"
    >
      {/* Two columns: every card carries a stack of call/frame pairs, so a
          third column would squeeze the code and the frame together. */}
      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        {WIDGETS.map((widget) => (
          <WidgetCard key={widget.title} {...widget} />
        ))}
      </div>

      <Catalogue />
    </Section>
  );
}

function WidgetCard({ title, tag, desc, demo, size }: WidgetCard) {
  return (
    <article className="panel reveal group flex min-w-0 flex-col p-5 transition-colors duration-300 hover:border-ring/50">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-mono text-sm font-medium">{title}</h3>
        <span className="shrink-0 rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
          {tag}
        </span>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{desc}</p>

      {/* A block column, not a flex row: several cards pass a fragment of
          `Variant`s, and flex would lay those out side by side. */}
      <div className="mb-4 flex min-h-32 min-w-0 flex-1 items-center overflow-x-auto py-1">
        <div className="w-full">{demo}</div>
      </div>

      <p className="code-ltr border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">
        {size}
      </p>
    </article>
  );
}

/**
 * The full surface of every widget: every FluxFrames preset, every
 * LinearStyle, every BarStyle, and the four BarSpinner presets — each one
 * running live.
 */
function Catalogue() {
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <CataloguePanel
        title="FluxFrames"
        count={Object.keys(FLUX_FRAMES).length}
        note="مجموعهٔ گلیف‌ها؛ هرکدام یک آرایهٔ ثابتِ char است."
      >
        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 sm:grid-cols-3">
          {Object.entries(FLUX_FRAMES).map(([name, seq]) => (
            <div
              key={name}
              className="flex min-w-0 items-center justify-between gap-2"
            >
              <code className="truncate font-mono text-[10px] text-muted-foreground">
                {name}
              </code>
              <Spinner
                kind="flux"
                frames={seq}
                className="spin-line shrink-0"
              />
            </div>
          ))}
        </div>
      </CataloguePanel>

      <CataloguePanel
        title="LinearStyle"
        count={LINEAR_STYLE_NAMES.length}
        note="هر سبک یک جفت (روشن، خاموش) است."
      >
        <div className="space-y-1.5">
          {LINEAR_STYLE_NAMES.map((name) => (
            <div
              key={name}
              className="flex min-w-0 items-center justify-between gap-3"
            >
              <code className="truncate font-mono text-[10px] text-muted-foreground">
                {name}
              </code>
              <Spinner
                kind="linear"
                style={name}
                totalSlots={12}
                litSlots={3}
                className="spin-line shrink-0"
              />
            </div>
          ))}
          <div className="flex min-w-0 items-center justify-between gap-3">
            <code className="truncate font-mono text-[10px] text-muted-foreground">
              arrow (vertical)
            </code>
            <Spinner
              kind="linear"
              direction="vertical"
              style="arrow"
              totalSlots={6}
              className="shrink-0 text-[11px]"
            />
          </div>
        </div>
      </CataloguePanel>

      <CataloguePanel
        title="BarStyle"
        count={BAR_SYMBOL_STYLES.length + 1}
        note="پانزده جفت نماد به‌علاوهٔ حالت برایل که پیش‌فرض است."
      >
        <div className="grid grid-cols-1 gap-x-5 gap-y-1.5 sm:grid-cols-2">
          {(["braille", ...BAR_SYMBOL_STYLES] as const).map((name) => (
            <div
              key={name}
              className="flex min-w-0 items-center justify-between gap-3"
            >
              <code className="truncate font-mono text-[10px] text-muted-foreground">
                {name}
              </code>
              <Spinner
                kind="bar"
                style={name}
                width={14}
                className="spin-line shrink-0"
              />
            </div>
          ))}
        </div>
      </CataloguePanel>

      <CataloguePanel
        title="BarSpinner presets"
        count={BAR_PRESETS.length}
        note="پیکربندی‌های آماده؛ مثل BarSpinner::zed(tick)."
      >
        <div className="space-y-1.5">
          {BAR_PRESETS.map((name) => (
            <div
              key={name}
              className="flex min-w-0 items-center justify-between gap-3"
            >
              <code className="truncate font-mono text-[10px] text-muted-foreground">
                BarSpinner::{name}(tick)
              </code>
              <Spinner
                kind="bar"
                preset={name}
                width={16}
                className="spin-line shrink-0"
              />
            </div>
          ))}
        </div>
      </CataloguePanel>
    </div>
  );
}

function CataloguePanel({
  title,
  count,
  note,
  children,
}: {
  title: string;
  count: number;
  note: string;
  children: ReactNode;
}) {
  return (
    <div className="panel reveal min-w-0 p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-mono text-sm font-medium">{title}</h3>
        <span className="font-mono text-[11px] text-accent-hue">
          {toFa(count)} مورد
        </span>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{note}</p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

