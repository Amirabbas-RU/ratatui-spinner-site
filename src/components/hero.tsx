import { Spinner } from "./spinner";
import AnimatedButton from "./ui/animated-button";
import { ButtonLink, CodeBlock } from "./ui";

/**
 * The README's "First spinner", with `Color::Cyan` split onto the builder
 * chain the way a reader would actually type it. Same code as the install
 * section shows in full — here it is the headline, not the lesson.
 */
const HERO_CODE = `use ratatui::layout::Rect;
use ratatui::style::Color;
use ratatui::Frame;
use ratatui_spinner::FluxSpinner;

fn render(frame: &mut Frame, area: Rect, tick: u64) {
    let spinner = FluxSpinner::new(tick)
        .color(Color::Cyan);
    frame.render_widget(spinner, area);
}`;

const FACTS = [
  { term: "وابستگی", desc: "فقط ratatui" },
  { term: "خانوادهٔ ویجت", desc: "۶" },
  { term: "مجوز", desc: "MIT" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 lg:py-32">
      {/* A single soft accent glow, kept far below the text's contrast floor. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-96 bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,rgba(51,105,255,0.09),transparent_70%)]"
      />

      <div className="wrap">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20">
          {/* ── Copy ── */}
          <div className="reveal">
            <p className="mb-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <Spinner kind="flux" className="text-sm" />
              <span>Ratatui · v0.4.18 · MIT</span>
            </p>

            <h1 className="font-display text-[clamp(2.25rem,6.5vw,4rem)] font-medium leading-[1.1] tracking-[-0.03em]">
              اسپینرهای بی‌حالت
              <br />
              برای ترمینال
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
              ویجت‌های انیمیشنی، دقیق و کاملاً قابل تنظیم برای{" "}
              <bdi className="font-mono text-foreground">Ratatui</bdi>. زمان در آن‌ها
              ذخیره نمی‌شود؛ خودِ برنامه ساعت را در اختیار دارد و هر فریم، یک تیک
              است.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <AnimatedButton as="a" href="#install" className="h-10 px-5">
                افزودن به پروژه
              </AnimatedButton>
              <ButtonLink href="#showcase" variant="ghost">
                دیدن ویجت‌ها
              </ButtonLink>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-6">
              {FACTS.map((item) => (
                <div key={item.term}>
                  <dt className="font-mono text-[11px] text-muted-foreground">
                    {item.term}
                  </dt>
                  <dd className="mt-1 font-mono text-sm">{item.desc}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ── Live terminal ── */}
          <div className="reveal min-w-0">
            <TerminalDemo />
          </div>
        </div>
      </div>
    </section>
  );
}

function TerminalDemo() {
  return (
    <div className="min-w-0">
      <CodeBlock
        code={HERO_CODE}
        filename="main.rs"
        language="rust"
        caption="خروجی ترمینال"
        highlightLines={[7, 9]}
      />

      {/* The two spinners the snippet above is capable of producing, each in
          the context a real app would show it. */}
      <div className="panel mt-4 p-4 sm:p-5">
        <p className="mb-4 font-mono text-[11px] text-muted-foreground">
          همان فریم، در دو جای واقعی
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Spinner kind="flux" className="text-base" />
            <span className="text-sm">
              در حال بارگذاری{" "}
              <bdi className="font-mono text-xs text-muted-foreground">
                crates.io
              </bdi>
              …
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Spinner kind="bar" preset="zed" width={12} className="text-sm" />
            <span className="text-sm text-muted-foreground">
              کامپایل crate{" "}
              <bdi className="font-mono text-xs">ratatui-spinner</bdi>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
