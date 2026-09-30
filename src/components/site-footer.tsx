import { FooterParticles } from "./footer-particles";
import { Spinner } from "./spinner";

/** Facts read from the crate's own `Cargo.toml` at v0.4.18. */
const CRATE = {
  version: "0.4.18",
  license: "MIT",
  rustVersion: "1.88.0",
  ratatui: "0.30",
  /** `default-features = false` — the crate does not force crossterm on you. */
  defaultFeatures: false,
};

/**
 * Every href here was fetched and answered 200. Two were deliberately removed:
 * the crate's `Cargo.toml` carries `publish = false`, so v0.4.18 has never been
 * published, and the `docs.rs/ratatui-spinner` name is currently held by an
 * unrelated 0.0.0 reservation crate whose docs say it "intentionally exposes no
 * public API yet". Linking them sent readers to a page documenting none of the
 * widgets here, so the two slots are filled with the crate's own README and the
 * full example directory instead — both real, both actually informative.
 */
const COLUMNS = [
  {
    title: "مخزن",
    links: [
      { label: "کد منبع", href: "https://github.com/ratatui/ratatui-spinner" },
      { label: "مسائل و بازخورد", href: "https://github.com/ratatui/ratatui-spinner/issues" },
      { label: "تاریخچهٔ تغییرات", href: "https://github.com/ratatui/ratatui-spinner/blob/main/CHANGELOG.md" },
      { label: "راهنمای مشارکت", href: "https://github.com/ratatui/ratatui-spinner/blob/main/CONTRIBUTING.md" },
    ],
  },
  {
    title: "مستندات",
    links: [
      { label: "راهنمای کریت (README)", href: "https://github.com/ratatui/ratatui-spinner/blob/main/README.md" },
      { label: "مستندات API روی راتاتوی", href: "https://docs.rs/ratatui/latest/ratatui/" },
      { label: "کتابخانهٔ راتاتوی", href: "https://ratatui.rs" },
    ],
  },
  {
    title: "مثال‌ها",
    links: [
      { label: "همهٔ ویجت‌ها", href: "https://github.com/ratatui/ratatui-spinner/blob/main/examples/spinner.rs" },
      { label: "داخل جدول", href: "https://github.com/ratatui/ratatui-spinner/blob/main/examples/table_embed.rs" },
      { label: "نوارِ جهنده", href: "https://github.com/ratatui/ratatui-spinner/blob/main/examples/bar_spinner.rs" },
      { label: "مثال README", href: "https://github.com/ratatui/ratatui-spinner/tree/main/examples" },
    ],
  },
];

/** In-page anchors, so the footer doubles as a table of contents. */
const SECTIONS = [
  { label: "ویجت‌ها", href: "#showcase" },
  { label: "بی‌حالت", href: "#stateless" },
  { label: "استفاده", href: "#usage" },
  { label: "زیرِ کاپوت", href: "#inside" },
  { label: "ویژگی‌ها", href: "#docs" },
  { label: "نصب", href: "#install" },
  { label: "منشأ", href: "#provenance" },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border">
      {/* A slow sweep along the top edge — the same idea as the page
          backdrop, scaled right down, so the footer does not read as a hard
          cut-off from the content above it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-l from-transparent via-accent-hue/60 to-transparent"
      />

      {/* A quiet field of embers behind everything, so the footer reads as
          lit space rather than the page simply running out. */}
      <FooterParticles />

      {/* Positioned, so the field sits behind the copy rather than on top. */}
      <div className="wrap relative z-10 py-16">
        {/* ── Masthead ─────────────────────────────────────────────────── */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <a href="#main" className="group inline-flex items-center gap-2.5">
              <Spinner kind="flux" className="text-lg" />
              <span className="font-mono text-sm font-medium tracking-tight">
                ratatui-spinner
              </span>
              <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors group-hover:border-ring group-hover:text-foreground">
                v{CRATE.version}
              </span>
            </a>

            <p className="mt-5 max-w-md text-sm leading-[1.9] text-muted-foreground">
              ویجت‌های اسپینر بی‌حالت و قابل تنظیم برای راتاتوی. هیچ ساعتی درون
              کریت نیست؛ هر فریم فقط از تیکی که شما می‌دهید ساخته می‌شود.
            </p>

            <p className="mt-4 max-w-md text-sm leading-[1.9] text-muted-foreground">
              پروژه‌ای از طرف تیم راتاتوی، و انشعابی از{" "}
              <a
                href="https://github.com/sorinirimies/tui-spinner"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-accent-hue"
              >
                tui-spinner
              </a>{" "}
              اثر{" "}
              <span className="text-foreground">Sorin Albu-Irimies</span> — با
              تاریخچهٔ کامیت‌ها و مجوز اصلی حفظ‌شده.
            </p>
          </div>

          {/* ── On this page ────────────────────────────────────────────── */}
          <nav aria-label="بخش‌های این صفحه" className="min-w-0">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              در همین صفحه
            </h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-2">
              {SECTIONS.map((section) => (
                <li key={section.href}>
                  <a
                    href={section.href}
                    className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="h-1 w-1 rounded-full bg-border transition-colors group-hover:bg-accent-hue"
                    />
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* ── Link columns ─────────────────────────────────────────────── */}
        <div className="mt-14 grid gap-10 border-t border-border pt-12 sm:grid-cols-2 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="min-w-0">
              <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {col.title}
              </h2>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 rtl:-scale-x-100"
                      >
                        <path
                          d="M7 17 17 7M9 7h8v8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* ── Build facts ──────────────────────────────────────────────── */}
        <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[--radius-card] border border-border bg-border sm:grid-cols-4">
          <Fact label="نسخه" value={CRATE.version} />
          <Fact label="حداقل Rust" value={CRATE.rustVersion} ltr />
          <Fact label="راتاتوی" value={CRATE.ratatui} ltr />
          <Fact
            label="مجوز"
            value={CRATE.license}
            href="https://github.com/ratatui/ratatui-spinner/blob/main/LICENSE"
          />
        </dl>

        {/* ── Bottom bar ───────────────────────────────────────────────── */}
        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Spinner kind="flux" className="text-sm" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              ساخته‌شده برای جامعهٔ راتاتوی
            </p>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground sm:text-end">
            این صفحه یک پروژهٔ مستقل و غیررسمی است و وابسته به هیچ شرکتی
            نیست.
          </p>
        </div>
      </div>
    </footer>
  );
}

function Fact({
  label,
  value,
  href,
  ltr = false,
}: {
  label: string;
  value: string;
  href?: string;
  ltr?: boolean;
}) {
  return (
    <div className="bg-card px-4 py-4">
      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono transition-colors hover:text-accent-hue"
          >
            {value}
          </a>
        ) : (
          <span className={ltr ? "font-mono" : ""}>{value}</span>
        )}
      </dd>
    </div>
  );
}
