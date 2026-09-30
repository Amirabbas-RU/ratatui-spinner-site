import {
  BAR_PRESETS,
  BAR_SYMBOL_STYLES,
  FLUX_FRAME_COUNT,
  LINEAR_STYLE_NAMES,
} from "@/lib/spinners";

import { Spinner } from "./spinner";
import { Section } from "./ui";

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

function toFa(n: number) {
  return String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/**
 * Counted from the port rather than typed by hand, so the strip cannot drift
 * away from the crate it is describing. `BarStyle` has 15 symbol pairs plus
 * the braille default — the same 16 the catalogue renders.
 */
const STATS = [
  { k: FLUX_FRAME_COUNT, v: "مجموعهٔ گلیف" },
  { k: BAR_SYMBOL_STYLES.length + 1, v: "سبک نوار" },
  { k: LINEAR_STYLE_NAMES.length, v: "سبک ردیف" },
  { k: BAR_PRESETS.length, v: "پیکربندی آماده" },
  { k: 6, v: "خانوادهٔ ویجت" },
  { k: 0, v: "وابستگی اضافی" },
];

/**
 * Each feature renders the widget that demonstrates it. A card that claims
 * "real braille" while showing no braille is the kind of claim this whole
 * site exists to avoid, so the proof sits inside the card.
 */
const FEATURES = [
  {
    n: "۰۱",
    h: "بی‌حالت، واقعاً",
    p: "هیچ تایمر، رشته یا وضعیت پنهانی در کار نیست. تیک می‌دهید، فریم می‌گیرید.",
    demo: <Spinner kind="flux" frames="braille" width={6} className="spin-line" />,
    code: "tick => frame",
  },
  {
    n: "۰۲",
    h: "شش خانوادهٔ ویجت",
    p: "حلقه، مربع، نوار، موج، ردیف و گلیف — هر کدام با پارامترهای خودش.",
    demo: <Spinner kind="square" size={4} centre="empty" className="spin-ascii" />,
    code: "enum RectShape",
  },
  {
    n: "۰۳",
    h: "برایل واقعی",
    p: "نقاط برایل با هندسهٔ درست روی حلقه می‌نشینند، نه فقط چند گلیف پراکنده.",
    demo: <Spinner kind="circle" radius={5} className="spin-ascii" />,
    code: "BRAILLE_MAP",
  },
  {
    n: "۰۴",
    h: "کاملاً قابل تنظیم",
    p: "شعاع، طول کمان، مرکز، اندازه، سبک، جهت و ضخامت — همه با سازنده‌های fluent.",
    demo: <Spinner kind="bar" motion="squeeze" width={18} className="spin-line" />,
    code: "fn radius(self, n)",
  },
  {
    n: "۰۵",
    h: "ساعت‌گرد یا پادساعت‌گرد",
    p: "جهت چرخش را برگردانید؛ اگر متن رابط راست‌به‌چپ است، اسپینر هم همان‌سمت می‌چرخد.",
    demo: <Spinner kind="circle" radius={4} arcLen={7} spin="ccw" className="spin-ascii" />,
    code: "Spin::CounterClockwise",
  },
  {
    n: "۰۶",
    h: "جاسازی در متن",
    p: "پنج خانواده از آخر با From پیاده شده‌اند، پس Cell::from(&spinner) مستقیم کار می‌کند. BarSpinner جداگانه to_text(w, h) و to_lines(w, h) می‌دهد، چون اندازه‌اش باید صریح باشد.",
    demo: <Spinner kind="linear" totalSlots={7} litSlots={3} className="spin-line" />,
    code: "impl From<&T> for Text",
  },
];

export function Features() {
  return (
    <Section
      id="docs"
      label="۰۵ · ویژگی‌ها"
      title={
        <>
          آنچه این کریت
          <br />
          به شما می‌دهد
        </>
      }
      intro="یک crate کوچک با یک قرارداد روشن. این‌ها چیزهایی هستند که واقعاً در کد هستند — و هر کدام را ویجتِ خودش نشان می‌دهد."
      className="border-t border-border"
    >
      {/* Not a card grid: a numbered ledger, because these are claims with
          evidence rather than tiles to browse. Each row pairs the claim, a
          live widget, and the API symbol that backs it. */}
      <div className="mt-12 overflow-hidden rounded-[--radius-card] border border-border bg-card">
        {FEATURES.map((f, i) => (
          <article
            key={f.n}
            className={`reveal group relative flex flex-col gap-5 p-5 transition-colors duration-300 hover:bg-accent/5 sm:flex-row sm:items-center sm:gap-8 sm:p-6 ${
              i === 0 ? "" : "border-t border-border"
            }`}
          >
            {/* A hairline that fills with the accent on hover — the row reads
                as interactive without a card border to shout with. */}
            <span
              aria-hidden="true"
              className="absolute inset-y-0 start-0 w-px scale-y-0 bg-accent-hue transition-transform duration-300 group-hover:scale-y-100"
            />

            <p className="font-mono text-xs text-muted-foreground sm:w-8 sm:shrink-0">
              {f.n}
            </p>

            <div className="min-w-0 flex-1">
              <h3 className="mb-1.5 text-sm font-medium">{f.h}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {f.p}
              </p>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-4 sm:w-40 sm:flex-col sm:items-end sm:justify-center sm:gap-1.5">
              <div className="flex min-h-10 items-center justify-center sm:justify-end">
                {f.demo}
              </div>
              <code className="code-ltr text-[10px] text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100">
                {f.code}
              </code>
            </div>
          </article>
        ))}
      </div>

      <div className="panel reveal mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 p-6">
        {STATS.map((s) => (
          <div key={s.v} className="text-center">
            <p className="font-mono text-2xl">{toFa(s.k)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.v}</p>
          </div>
        ))}
        <Spinner kind="flux" className="spin-line" />
      </div>
    </Section>
  );
}
