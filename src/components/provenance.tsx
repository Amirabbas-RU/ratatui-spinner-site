import { Section } from "./ui";

const LINEAGE = [
  {
    name: "tui-spinner",
    by: "Sorin Albu-Irimies",
    href: "https://github.com/sorinirimies/tui-spinner",
    role: "خاستگاه",
    note: "کتابخانهٔ اصلی اسپینرهای ترمینال در Rust.",
  },
  {
    name: "ratatui-spinner",
    by: "Ratatui Project",
    href: "https://github.com/ratatui/ratatui-spinner",
    role: "امروز",
    note: "انتقال به اکوسیستم راتاتوی، با تاریخچهٔ کامیت‌ها و انتساب نویسنده حفظ شده.",
  },
];

const NOTES = [
  "کد اصلی همچنان با مجوز MIT منتشر می‌شود.",
  "تاریخچهٔ کامیت‌ها و انتساب نویسنده دست‌نخورده باقی مانده است.",
  "نگهداری زیر چتر پروژهٔ راتاتوی انجام می‌شود.",
];

export function Provenance() {
  return (
    <Section
      id="provenance"
      label="۰۷ · منشأ"
      title={
        <>
          از یک کتابخانهٔ
          <br />
          کوچک، تا خانوادهٔ راتاتوی
        </>
      }
      intro="این پروژه یک انشعه از tui-spinner است که اکنون زیر نگهداری پروژهٔ راتاتوی توسعه می‌یابد — با حفظ کامل انتساب و تاریخچه."
      className="border-t border-border"
    >
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {LINEAGE.map((node, i) => (
          <div key={node.name} className="relative">
            {i < LINEAGE.length - 1 && (
              <div
                aria-hidden="true"
                className="absolute -end-1/4 top-1/2 hidden h-px w-1/2 bg-border md:block"
              />
            )}
            <a
              href={node.href}
              target="_blank"
              rel="noopener noreferrer"
              className="panel reveal group block h-full p-6 transition-colors duration-300 hover:border-ring/50"
            >
              <span className="font-mono text-[11px] text-muted-foreground">
                {node.role}
              </span>
              <h3 className="mt-2 font-mono text-base font-medium transition-colors group-hover:text-accent-hue">
                {node.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{node.by}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {node.note}
              </p>
            </a>
          </div>
        ))}
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {NOTES.map((note) => (
          <li
            key={note}
            className="panel reveal flex items-start gap-2.5 p-4 text-sm leading-relaxed text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-hue"
            />
            {note}
          </li>
        ))}
      </ul>
    </Section>
  );
}
