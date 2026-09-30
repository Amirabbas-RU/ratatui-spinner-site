import { circleFrame, frameToString } from "@/lib/spinners";
import { Frame } from "./spinner";

import { Section } from "./ui";

/**
 * The crate's central claim: a spinner stores no time. The app owns the tick.
 *
 * The middle panel proves it rather than asserting it — the two panes render
 * from the same frozen tick, and the panel prints the exact frame string each
 * one produced so the two can be compared character by character.
 */
export function Stateless() {
  return (
    <Section
      id="stateless"
      label="۰۲ · بی‌حالت"
      title={
        <>
          ویجت، زمان را در خودش
          <br />
          نگه نمی‌دارد
        </>
      }
      intro="در بیشتر کتابخانه‌های اسپینر، ویجت یک تایمر داخلی دارد و خودش تصمیم می‌گیرد چه چیزی کِی رندر شود. اینجا برعکس است: شما تیک را می‌دهید، ویجت فقط یک فریم برمی‌گرداند."
      tone="raised"
    >
      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        <TickPanel
          title="تیک یکسان ⇒ فریم یکسان"
          caption="دو رندرِ کاملاً مستقل، هر دو روی همان تیکِ ثابت. خروجی‌شان نه تنها یکسان است، بلکه از دو فراخوانی جداگانهٔ تابعِ فریم آمده — نه از یک مقدار ذخیره‌شده."
          ticksPerStep={[1, 1]}
          proof={{
            same: SAME[0].hash === SAME[1].hash,
            lines: [
              { a: "frame_a(17)", b: SAME[0].hash, verdict: "" },
              { a: "frame_b(17)", b: SAME[1].hash, verdict: "" },
              {
                a: "مقایسه",
                b: `${SAME[0].cells} سلول · ${SAME[0].arc} سلولِ کمان`,
                verdict: "چاپِ بایتیِ یکسان ⇒ فریمِ یکسان",
              },
            ],
          }}
        />

        <TickPanel
          title="ticks_per_step فریم را کند می‌کند"
          caption="سرعت انیمیشن فاصلهٔ میان دو رندر است، نه چیزی درون ویجت. با ticks_per_step بزرگ‌تر، هر فریم تیک‌های بیشتری نگه داشته می‌شود — اینجا هر دو روی همان تیکِ ۱۷، اما با گام‌های متفاوت."
          ticksPerStep={[1, 4]}
          proof={{
            same: SLOW[0].hash === SLOW[1].hash,
            lines: [
              { a: "ticks_per_step = 1", b: SLOW[0].hash, verdict: "" },
              { a: "ticks_per_step = 4", b: SLOW[1].hash, verdict: "" },
              {
                a: "سلول‌های متفاوت",
                b: SLOW_DIFF.length
                  ? SLOW_DIFF.map((d) => d.split(":")[0]).join("، ")
                  : "هیچ",
                verdict:
                  SLOW_DIFF.length === 0
                    ? "در این تیک، تفاوتی دیده نمی‌شود"
                    : `${SLOW_DIFF.length} سلول جابه‌جا شده — گامِ بلندتر، همان نتیجه`,
              },
            ],
          }}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          {
            n: "۰۱",
            h: "تست‌پذیر",
            p: "به‌جای منتظر ماندن برای انیمیشن، فریام دلخواه را مستقیم رندر کنید. برای اسنپ‌شات و تستِ رگرسیون عالی است.",
          },
          {
            n: "۰۲",
            h: "بدون تایمر",
            p: "هیچ رشتهٔ پس‌زمینه‌ای در کار نیست؛ کنترل کامل با حلقهٔ رندر شماست، نه با ویجت.",
          },
          {
            n: "۰۳",
            h: "همگام با وضعیت",
            p: "مکث، تندکردن و بازنشانیِ انیمیشن، همگی دستِ خودتان است — و هر کدام یک خط کد.",
          },
        ].map((item) => (
          <div key={item.n} className="panel reveal p-5">
            <p className="mb-2 font-mono text-xs text-muted-foreground">
              {item.n}
            </p>
            <h3 className="mb-1.5 text-sm font-medium">{item.h}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.p}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** A fixed tick, so the frame underneath provably cannot drift. */
const FROZEN_TICK = 17;

/**
 * The exact frame the crate prints for this tick and these options — a pure
 * function of `tick`, which is the whole claim of this section.
 */
function frameFor(ticksPerStep: number) {
  return circleFrame(FROZEN_TICK, {
    radius: 7,
    arcLen: 0,
    ticksPerStep,
    spin: "cw",
  });
}

/**
 * Renders the exact frame the crate would print for this tick, and nothing
 * else. The cells keep the tones the widget paints them with, so the arc is
 * visibly the arc rather than a row of identical characters.
 */
/**
 * A fingerprint of the frame the builder actually returned: the same short
 * FNV-1a hash any implementation would compute over the printed characters.
 * The point is not the digest's value but that it is *derived* — it can only
 * match if the two builders returned identical cells, and it can only differ
 * if they did not. The panes above can be compared by eye; this is the same
 * comparison the crate's own tests would do.
 */
function fingerprint(f: ReturnType<typeof frameFor>) {
  const text = frameToString(f);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return {
    hash: (h >>> 0).toString(16).padStart(8, "0"),
    cells: f.reduce((n, row) => n + row.length, 0),
    arc: f.reduce(
      (n, row) => n + row.filter((c) => c.tone === "arc").length,
      0,
    ),
  };
}

/** The cells that differ between two frames, with their coordinates. */
function diff(a: ReturnType<typeof frameFor>, b: ReturnType<typeof frameFor>) {
  const out: string[] = [];
  for (let r = 0; r < a.length; r++) {
    for (let c = 0; c < a[r].length; c++) {
      if (a[r][c].char !== b[r][c].char) {
        out.push(`r${r}c${c}: ${a[r][c].char} → ${b[r][c].char}`);
      }
    }
  }
  return out;
}

const SAME = [fingerprint(frameFor(1)), fingerprint(frameFor(1))];
const SLOW = [fingerprint(frameFor(1)), fingerprint(frameFor(4))];
const SLOW_DIFF = diff(frameFor(1), frameFor(4));

function TickPanel({
  title,
  caption,
  ticksPerStep,
  proof,
}: {
  title: string;
  caption: string;
  /** The two `ticks_per_step` values the panes render with. */
  ticksPerStep: [number, number];
  /** Computed from the frames on screen, not written by hand. */
  proof: { same: boolean; lines: { a: string; b: string; verdict: string }[] };
}) {
  return (
    <div className="panel reveal min-w-0 p-5">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {caption}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {ticksPerStep.map((step, i) => (
          <div
            /* Both panes can carry the same `ticks_per_step`, so the index
               is part of the key — the pair is positional, not a set. */
            key={`${step}-${i}`}
            className="flex min-h-32 flex-col items-center justify-center gap-3 overflow-x-auto rounded-lg border border-border bg-background p-3"
          >
            <Frame
              frame={frameFor(step)}
              label={`فریم ثابت روی تیک ${FROZEN_TICK}`}
            />
            <p className="code-ltr text-[10px] text-muted-foreground">
              ticks_per_step = {step}
            </p>
          </div>
        ))}
      </div>

      <dl className="mt-4 space-y-1.5 border-t border-border pt-3 font-mono text-[11px]">
        {proof.lines.map((line) => (
          <div
            key={line.a}
            className="flex flex-wrap items-baseline justify-between gap-x-3"
          >
            <dt className="text-muted-foreground">{line.a}</dt>
            <dd className="code-ltr">{line.b}</dd>
          </div>
        ))}
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-border pt-1.5">
          <dt className="text-muted-foreground">نتیجه</dt>
          <dd
            className={proof.same ? "text-accent-hue" : "text-muted-foreground"}
          >
            {proof.lines[proof.lines.length - 1].verdict}
          </dd>
        </div>
      </dl>
    </div>
  );
}
