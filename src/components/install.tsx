import { ButtonLink, CodeBlock, Section } from "./ui";
import { Spinner } from "./spinner";
import {
  CARGO_GIT,
  CARGO_PATH,
  EMBED,
  FIRST_SPINNER,
  TICK_LOOP,
} from "./install.snippets";

const STEPS = [
  {
    n: "۰۱",
    title: "کریت را اضافه کنید",
    body: "کریت هنوز روی crates.io منتشر نشده است، پس فعلاً از مخزن گیت نصب می‌شود. اگر یک چک‌اوت محلی دارید، مسیر محلی همان وابستگی است.",
  },
  {
    n: "۰۲",
    title: "تیک را نگه دارید",
    body: "ویجت هیچ حالت داخلی ندارد؛ تنها ورودی‌اش یک عدد است. همان عدد را در اپ خودتان نگه دارید و در هر باز redraw به آن بدهید.",
  },
  {
    n: "۰۳",
    title: "در فریم رندر کنید",
    body: "ویجت را بسازید و به `render_widget` بدهید. همین. `Styled` هم پیاده شده، پس `style()` و `with_style()` هم کار می‌کنند.",
  },
];

export function Install() {
  return (
    <Section
      id="install"
      label="۰۶ · نصب"
      title={
        <>
          یک خط تا اولین
          <br />
          اسپینر
        </>
      }
      intro="این کریت هنوز روی crates.io منتشر نشده است، پس فعلاً از طریق مخزن گیت نصب می‌شود."
      tone="raised"
    >
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n} className="panel reveal min-w-0 p-5">
            <span className="font-mono text-xs text-accent-hue">{step.n}</span>
            <h3 className="mt-2 text-sm font-medium">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </div>
        ))}
      </div>

      {/* The two dependency forms, then the two Rust snippets. Code and
          annotation sit side by side; on a phone the annotation drops below. */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <CodeBlock
          code={CARGO_GIT}
          filename="Cargo.toml"
          language="toml"
          caption="از راه دور"
          highlightLines={[2]}
        />
        <CodeBlock
          code={CARGO_PATH}
          filename="Cargo.toml"
          language="toml"
          caption="نسخهٔ محلی"
          highlightLines={[2]}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <CodeBlock
          code={FIRST_SPINNER}
          filename="main.rs"
          language="rust"
          caption="از README"
          highlightLines={[7, 8]}
        />

        {/* The exact call, running — so the snippet's output is not asserted,
            it is shown. */}
        <div className="panel reveal flex min-w-0 flex-col p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-muted-foreground">خروجیِ زنده</span>
            <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              live
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center py-6">
            <Spinner kind="flux" frames="braille" width={1} className="text-4xl" />
          </div>

          <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
            همان <span className="font-mono">FluxSpinner</span> با پیش‌فرض‌های خودش:
            ۱×۱، ساعت‌گرد، فیروزه‌ای، یک تیک در هر فریم.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <CodeBlock
          code={TICK_LOOP}
          filename="main.rs"
          language="rust"
          caption="از examples/spinner.rs"
          highlightLines={[6, 7]}
        />
        <CodeBlock
          code={EMBED}
          filename="main.rs"
          language="rust"
          caption="از examples/table_embed.rs"
          highlightLines={[6, 11]}
        />
      </div>

      <div className="panel reveal mt-4 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-medium">ادامه بدهید</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            راهنمای کریت، فهرست کامل API و مثال‌های اجراشدنی هر خانواده در
            مخزن و مستندات.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row">
          <ButtonLink
            href="https://github.com/ratatui/ratatui-spinner"
            external
          >
            مخزن گیت‌هاب
          </ButtonLink>
          <ButtonLink
            href="https://docs.rs/ratatui-spinner"
            variant="ghost"
            external
          >
            مستندات API
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
