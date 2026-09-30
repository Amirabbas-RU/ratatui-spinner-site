"use client";

import { useEffect, useState } from "react";
import { Spinner } from "./spinner";

/**
 * The section index, shared by the desktop bar, the mobile sheet, and the
 * footer table of contents. Each entry carries a `blurb` so the sheet can say
 * what a section holds rather than offering six bare nouns to guess from — the
 * same reasoning as the numbered ledger in the features section.
 */
export const LINKS = [
  {
    href: "#showcase",
    label: "ویجت‌ها",
    num: "۰۱",
    blurb: "شش خانواده، هرکدام زنده",
  },
  {
    href: "#stateless",
    label: "بی‌حالت",
    num: "۰۲",
    blurb: "تیک از شما، فریم از کریت",
  },
  {
    href: "#usage",
    label: "استفاده",
    num: "۰۳",
    blurb: "از افزودن تا رندر در حلقه",
  },
  {
    href: "#inside",
    label: "زیرِ کاپوت",
    num: "۰۴",
    blurb: "هندسه و بیت‌های برایل",
  },
  {
    href: "#docs",
    label: "ویژگی‌ها",
    num: "۰۵",
    blurb: "ادعاها، هرکدام با شاهد",
  },
  {
    href: "#install",
    label: "نصب",
    num: "۰۶",
    blurb: "کریت، ویژگی‌ها، قفل نسخه",
  },
];

const REPO = "https://github.com/ratatui/ratatui-spinner";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the sheet is open, and remember where the reader
  // was so the sheet does not reopen scrolled away from them.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /**
   * Scroll-spy. Reads positions on the scroll event rather than in a loop, and
   * picks the last section whose top has passed the header line — so the
   * highlight tracks where the reader actually is, including when they stop
   * between two sections. The button is unused when no section is under the
   * header, which is the state at the very top of the page.
   */
  useEffect(() => {
    const els = LINKS.map((l) => document.getElementById(l.href.slice(1)));
    if (!els.some(Boolean)) return;

    const measure = () => {
      const line = 80;
      let current: string | null = null;
      for (const el of els) {
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = `#${el.id}`;
      }
      setActive(current);
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-colors duration-300 ${
          scrolled || open
            ? "border-b border-border bg-background/80 backdrop-blur-md"
            : "border-b border-transparent"
        }`}
      >
        <div className="wrap flex h-[var(--header-height)] items-center justify-between gap-6">
          <a href="#main" className="flex items-center gap-2.5">
            <Spinner kind="flux" className="text-base" />
            <span className="font-mono text-sm font-medium tracking-tight">
              ratatui-spinner
            </span>
          </a>

          <nav
            aria-label="ناوبری اصلی"
            className="hidden items-center gap-1 md:flex"
          >
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-foreground ${
                  active === link.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </a>
            ))}
            {/* Labelled for what it does, not "نصب" — the list above already
                links to the install section under that name. */}
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="ms-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              گیت‌هاب
            </a>
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            className="group relative z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/60 backdrop-blur transition-colors duration-300 hover:border-ring/60 hover:bg-accent/40 active:scale-95 md:hidden"
          >
            {/*
              Two bars that meet on the wrap's centre line and cross as an X.

              Both bars sit at `top: 50%` in *every* state, and the hamburger is
              just the two being offset ±3.5px along the CSS `translate`
              property. Opening sets both offsets to 0, so the arms are
              guaranteed to land on the same line: the X is centred by
              construction. An earlier version pinned them at fixed `top`
              offsets and hand-computed a 7px travel for each, which
              over-shot the 3.25px/3.75px the box actually needed and threw
              the crossing off-centre.

              `translate` and `rotate` are separate properties here on purpose.
              Tailwind's `translate-x-*` and `rotate-*` both write to
              `transform`, so using them together silently overwrites one with
              the other. Centring is physical `left-1/2` rather than `start-1/2`
              for the same reason — the bars must land on the wrap's centre
              whichever direction the page is laid out.

              A per-bar `transition-delay` was tried first and made it visibly
              worse: the delay applies to the state change as well as the
              return trip, so the arms reach the middle at different times and
              the X assembles in two visible steps.
            */}
            <span aria-hidden="true" className="relative block h-4 w-[18px]">
              {[0, 1].map((i) => (
                <span
                  key={i}
                  style={
                    {
                      // The leading `-50%` on each axis pulls the bar's own
                      // centre onto the wrap's centre line; the extra pixels
                      // are the only thing the open state takes away.
                      translate: open
                        ? "-50% -50%"
                        : i === 0
                          ? "-50% calc(-50% - 3.5px)"
                          : "-50% calc(-50% + 3.5px)",
                      rotate: open ? (i === 0 ? "45deg" : "-45deg") : "0deg",
                    } as React.CSSProperties
                  }
                  className={`absolute left-1/2 top-1/2 h-[1.5px] w-[18px] origin-center rounded-full bg-foreground transition-[translate,rotate,scale] duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] ${
                    open ? "scale-x-100" : "group-hover:scale-x-90"
                  }`}
                />
              ))}
            </span>
          </button>
        </div>
      </header>

      {/* Backdrop. A gradient rather than a flat scrim, so the page behind
          recedes from its edges instead of dimming uniformly. */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-gradient-to-b from-background/80 via-background/90 to-background backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sheet — measured with grid-rows so it animates open *and* shut.
          `dvh` rather than `vh`: on mobile browsers the visible height shrinks
          when the URL bar collapses, and a vh-tall sheet would be clipped. */}
      <nav
        id="mobile-nav"
        aria-label="ناوبری موبایل"
        aria-hidden={!open}
        className={`fixed inset-x-0 top-[var(--header-height)] z-40 grid max-h-[calc(100dvh-var(--header-height))] transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="max-h-[calc(100dvh-var(--header-height))] overflow-y-auto overscroll-contain border-b border-border bg-card/95 backdrop-blur-xl">
            <div className="wrap pb-4 pt-2">
              {/* A section index, not a list of nouns: each row states what
                  the section holds, and the accent rail marks where the
                  reader currently is. */}
              <ul className="flex flex-col">
                {LINKS.map((link, i) => {
                  const isActive = active === link.href;
                  return (
                    <li key={link.href} className="border-b border-border/60 last:border-b-0">
                      <a
                        href={link.href}
                        onClick={() => setOpen(false)}
                        tabIndex={open ? 0 : -1}
                        style={{
                          transitionDelay: open ? `${60 + i * 45}ms` : "0ms",
                        }}
                        className={`group relative flex items-center gap-3 py-3.5 ps-3 pe-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:bg-accent ${
                          open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                        } ${
                          isActive
                            ? "bg-accent/5"
                            : "hover:bg-accent/40 active:bg-accent/70"
                        }`}
                      >
                        {/* The rail: always seated, filled only when active.
                            `start-0` is the right edge in RTL, which is where
                            a reader's eye returns. */}
                        <span
                          data-rail=""
                          aria-hidden="true"
                          className={`absolute inset-y-0 start-0 w-0.5 origin-top bg-accent-hue transition-transform duration-300 ${
                            isActive
                              ? "scale-y-100"
                              : "scale-y-0 group-hover:scale-y-100"
                          }`}
                        />

                        <span
                          className={`code-ltr w-7 shrink-0 text-[11px] transition-colors ${
                            isActive
                              ? "text-accent-hue"
                              : "text-ring/70 group-hover:text-accent-hue"
                          }`}
                        >
                          {link.num}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-[15px] leading-tight transition-colors ${
                              isActive
                                ? "text-foreground"
                                : "text-foreground/80 group-hover:text-foreground"
                            }`}
                          >
                            {link.label}
                          </span>
                          <span className="mt-0.5 block truncate text-xs leading-relaxed text-muted-foreground">
                            {link.blurb}
                          </span>
                        </span>

                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                          className="h-3.5 w-3.5 shrink-0 -scale-x-100 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                        >
                          <path
                            d="M7 17 17 7M9 7h8v8"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                    </li>
                  );
                })}
              </ul>

              {/* Actions live in the sheet, not behind a second tap: on a
                  phone the repo link is the only thing most readers want. */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  href={REPO}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={open ? 0 : -1}
                  style={{ transitionDelay: open ? "330ms" : "0ms" }}
                  className={`flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-xs font-medium transition-all duration-300 hover:border-ring/60 hover:bg-accent ${
                    open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  گیت‌هاب
                </a>
                <a
                  href="#install"
                  onClick={() => setOpen(false)}
                  tabIndex={open ? 0 : -1}
                  style={{ transitionDelay: open ? "375ms" : "0ms" }}
                  className={`flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-medium text-primary-foreground transition-all duration-300 ${
                    open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                  }`}
                >
                  <code className="code-ltr">cargo add</code>
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
