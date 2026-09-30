import type { ReactNode } from "react";

import { highlight, type CodeLanguage, type TokenKind } from "@/lib/highlight";
import { cn } from "@/lib/utils";

import { CopyButton } from "./ui/copy-button";

/** Section wrapper: consistent rhythm, anchor offset, and heading slot. */
export function Section({
  id,
  label,
  title,
  intro,
  children,
  className = "",
  tone = "flat",
}: {
  id?: string;
  label?: string;
  title?: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  className?: string;
  /**
   * The band's surface treatment. `flat` is the page's own colour; `raised`
   * lifts the section off the page with a gradient and a hairline on both
   * edges. Alternating the two down a long page is what stops the section
   * rhythm reading as one undifferentiated black field.
   */
  tone?: "flat" | "raised";
}) {
  return (
    <section
      id={id}
      className={`relative py-20 sm:py-24 ${
        tone === "raised" ? "section-raised" : ""
      } ${className}`}
    >
      <div className="wrap relative">
        {(label || title || intro) && (
          <div className="reveal">
            {label && <SectionLabel value={label} />}
            {title && <h2 className="section-title">{title}</h2>}
            {intro && <p className="section-intro text-pretty">{intro}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/** Labels arrive as "۰۱ · heading"; only the numeral is emphasised. */
function SectionLabel({ value }: { value: string }) {
  const [num, ...rest] = value.split("·");
  return (
    <p className="section-label">
      <span className="section-label-num">{num.trim()}</span>
      {rest.length > 0 && (
        <span className="text-muted-foreground">{rest.join("·").trim()}</span>
      )}
    </p>
  );
}

/** Primary call-to-action. */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  external?: boolean;
}) {
  const base =
    "inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors duration-200";
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "border border-border bg-transparent text-foreground hover:bg-accent";

  return (
    <a
      href={href}
      className={`${base} ${styles}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span>{children}</span>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 rtl:-scale-x-100">
        {variant === "primary" ? (
          <path
            d="M19 12H5M11 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M7 17 17 7M9 7h8v8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </a>
  );
}

/**
 * A real code surface: a title bar carrying the filename, a language badge
 * and a copy button, then a line-numbered gutter beside syntax-highlighted
 * source. Highlighting runs on the server — `highlight` is pure and returns
 * spans, so the block stays a Server Component and ships no highlighter to the
 * browser.
 */
export function CodeBlock({
  code,
  filename,
  language = "plain",
  caption,
  showLineNumbers = true,
  highlightLines = [],
  className = "",
}: {
  code: string;
  filename?: string;
  language?: CodeLanguage;
  /** Right-aligned note in the title bar, opposite the filename. */
  caption?: ReactNode;
  showLineNumbers?: boolean;
  /** 1-based line numbers to mark, e.g. the one that does the interesting work. */
  highlightLines?: number[];
  className?: string;
}) {
  const lines = code.split("\n");
  const marked = new Set(highlightLines);
  const gutterWidth = `${lines.length}`.length;

  return (
    <figure className={cn("panel min-w-0 overflow-hidden", className)}>
      {(filename || caption) && (
        <figcaption className="flex items-center justify-between gap-3 border-b border-border bg-card px-3.5 py-2">
          {filename && (
            <span className="code-ltr truncate font-mono text-xs text-muted-foreground">
              {filename}
            </span>
          )}
          <span className="flex shrink-0 items-center gap-2">
            {caption && (
              <span className="truncate font-mono text-[11px] text-muted-foreground">
                {caption}
              </span>
            )}
            {language !== "plain" && (
              <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {language}
              </span>
            )}
            <CopyButton
              code={code}
              className="border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
            />
          </span>
        </figcaption>
      )}

      <div className="code-ltr min-w-0 overflow-x-auto py-2 text-[13px] leading-[1.7]">
        {lines.map((line, i) => (
          <HighlightedLine
            key={i}
            line={line}
            language={language}
            number={i + 1}
            gutterWidth={gutterWidth}
            showLineNumbers={showLineNumbers}
            marked={marked.has(i + 1)}
          />
        ))}
      </div>
    </figure>
  );
}

function HighlightedLine({
  line,
  language,
  number,
  gutterWidth,
  showLineNumbers,
  marked,
}: {
  line: string;
  language: CodeLanguage;
  number: number;
  gutterWidth: number;
  showLineNumbers: boolean;
  marked: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-max items-baseline",
        marked && "bg-accent-hue/[0.07] shadow-[inset_2px_0_0_0_var(--color-accent-hue)]"
      )}
    >
      {showLineNumbers && (
        <span
          aria-hidden="true"
          className="code-gutter sticky start-0 shrink-0 select-none border-e border-border/60 bg-card pr-3 text-end tabular-nums"
          style={{ width: `calc(${gutterWidth}ch + 1.5rem)` }}
        >
          {number}
        </span>
      )}
      <code className="block flex-1 px-4">
        {highlight(line, language).map((token, i) => (
          <span key={i} className={TOKEN_CLASS[token.kind]}>
            {token.text}
          </span>
        ))}
      </code>
    </div>
  );
}

const TOKEN_CLASS: Record<TokenKind, string> = {
  text: "tok-text",
  keyword: "tok-keyword",
  type: "tok-type",
  fn: "tok-fn",
  string: "tok-string",
  number: "tok-number",
  comment: "tok-comment",
  punct: "tok-punct",
  attr: "tok-attr",
};
