import { Spinner } from "./spinner";
import { CodeBlock, Section } from "./ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

/**
 * Five integration shapes. Every snippet compiles against the crate's real
 * API — the argument types, the method names and the `0`-means-auto
 * conventions are all taken from the published source, not invented. `highlight`
 * is the line the reader should land on; it is marked in the gutter.
 */
const TABS = [
  {
    value: "first",
    label: "اولین ویجت",
    caption:
      "تیک را نگه دارید، ویجت را بسازید، و در هر فریم رندر کنید. برنامهٔ شما تنها منبع زمان است.",
    code: `use ratatui::layout::Rect;
use ratatui::style::Color;
use ratatui::Frame;
use ratatui_spinner::FluxSpinner;

fn render(frame: &mut Frame, area: Rect, tick: u64) {
    let spinner = FluxSpinner::new(tick).color(Color::Cyan);
    frame.render_widget(spinner, area);
}`,
    /** Line the reader should land on, marked in the gutter. */
    highlight: 7,
    demo: <Spinner kind="flux" className="text-3xl" />,
  },
  {
    value: "clock",
    label: "ساختِ تیک",
    caption:
      "ویجت تایمر ندارد، پس خودتان می‌سازید. این همان کدی است که در مثال‌های رسمی crate اجرا می‌شود: هر ۸۰ میلی‌ثانیه چند گام جلو بروید.",
    code: `struct App {
    tick: u64,
    last_tick: Instant,
}

// در حلقهٔ اصلی، پیش از هر draw:
let steps = (Instant::now()
    .duration_since(app.last_tick)
    .as_millis() / 80)
    .max(1) as u64;
app.last_tick = Instant::now();
app.tick = app.tick.wrapping_add(steps);`,
    /** Line the reader should land on, marked in the gutter. */
    highlight: 6,
    demo: <Spinner kind="flux" frames="orbit" width={8} className="text-2xl" />,
  },
  {
    value: "slow",
    label: "کند کردن",
    caption:
      "به‌جای دست‌زدن به تایمر، خودِ ویجت هر فریم را N تیک نگه می‌دارد. این‌طوری سرعت با تنظیم ویجت عوض می‌شود، نه با حلقهٔ رندر.",
    code: `use ratatui_spinner::CircleSpinner;

let spinner = CircleSpinner::new(tick)
    .radius(6)
    .ticks_per_step(4);   // هر فریم ۴ تیک نگه داشته می‌شود`,
    /** Line the reader should land on, marked in the gutter. */
    highlight: 4,
    demo: <Spinner kind="circle" radius={6} ticksPerStep={4} className="text-xl" />,
  },
  {
    value: "geometry",
    label: "هندسه و اندازه",
    caption:
      "شعاع را بدهید تا اندازهٔ دقیق ترمینال از char_size() برمی‌گردد. طول کمان صفر یعنی «خودکار» — یک‌چهارمِ دور.",
    code: `use ratatui_spinner::CircleSpinner;

let auto = CircleSpinner::new(tick)
    .radius(9)
    .arc_len(0);          // ۰ = یک‌چهارمِ خودکار

let (w, h) = auto.char_size();   // (۱۰, ۵) سلول ترمینال`,
    /** Line the reader should land on, marked in the gutter. */
    highlight: 4,
    demo: <Spinner kind="circle" radius={9} className="text-xl" />,
  },
  {
    value: "spin",
    label: "جهت چرخش",
    caption:
      "کریت خودش دربارهٔ جهت متن تصمیمی نمی‌گیرد — هر دو حالت در اختیار شماست. اگر رابط کاربری‌تان راست‌به‌چپ است، برعکس کردن چرخش باعث می‌شود اسپینر با همان جهتی بچرخد که متن حرکت می‌کند.",
    code: `use ratatui_spinner::{CircleSpinner, Spin};

let cw = CircleSpinner::new(tick).radius(8);
let ccw = CircleSpinner::new(tick)
    .radius(8)
    .spin(Spin::CounterClockwise);`,
    /** Line the reader should land on, marked in the gutter. */
    highlight: 4,
    demo: (
      <div className="flex items-center gap-6 text-xl">
        <Spinner kind="circle" radius={6} spin="cw" />
        <Spinner kind="circle" radius={6} spin="ccw" />
      </div>
    ),
  },
];

export function Usage() {
  return (
    <Section
      id="usage"
      label="۰۳ · استفاده"
      title={
        <>
          پنج گام تا
          <br />
          اولین اسپینر
        </>
      }
      intro="هر تب یک الگوی واقعی از کدِ کریت را نشان می‌دهد، در کنار همان ویجت در حال اجرا. همهٔ قطعه‌کدها از مخزن رسمی گرفته شده‌اند."
      className="border-t border-border"
    >
      <div className="mt-12">
        <Tabs defaultValue="first">
          <TabsList className="mb-5 flex-wrap justify-start">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <CodeBlock
                  code={tab.code}
                  filename="main.rs"
                  language="rust"
                  highlightLines={[tab.highlight]}
                />

                <div className="panel flex min-w-0 flex-col p-5">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {tab.caption}
                  </p>
                  <div className="flex min-h-32 flex-1 items-center justify-center py-8">
                    {tab.demo}
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Section>
  );
}
