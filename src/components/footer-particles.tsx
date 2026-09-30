"use client";

import { useEffect, useRef } from "react";

/**
 * A slow drift of embers behind the footer.
 *
 * Restraint is the whole design here: the particles are 1–2px, they move a few
 * pixels a second, and they never reach more than a fifth of full opacity. The
 * intent is that you notice the footer has depth, not that you notice there
 * are particles.
 *
 * Three things keep it from being a tax rather than a detail:
 *
 * - The loop stops entirely when the footer scrolls out of view, so the page
 *   above it costs nothing.
 * - `prefers-reduced-motion` renders one static frame and never starts a loop.
 * - The colour is read from `--color-accent-hue`, so the field follows the
 *   theme instead of hard-coding a hue that would fight the rest of the page.
 */
export function FooterParticles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let running = false;
    let onScreen = true;

    /** One ember. Velocities are per-second and deliberately tiny. */
    interface Ember {
      x: number;
      y: number;
      r: number;
      /** Upward drift, px/s. Negative values sink. */
      vy: number;
      /** Horizontal sway, px/s, with its own slow oscillation. */
      vx: number;
      /** Peak opacity, 0–1. */
      a: number;
      /** How fast the twinkle cycles, rad/s. */
      tw: number;
      /** Current twinkle phase. */
      phase: number;
      /** Whether this ember carries the accent hue. */
      accent: boolean;
    }

    let embers: Ember[] = [];
    let accent = "#60a5fa";

    /**
     * The accent is a CSS token, which a canvas cannot read directly. Rather
     * than re-probing on every frame — a DOM append per frame is a real cost
     * — the value is resolved once and on resize, when the theme or layout
     * could plausibly have changed it.
     */
    function resolveAccent() {
      const probe = document.createElement("span");
      probe.style.color = "var(--color-accent-hue)";
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      canvas!.parentElement?.appendChild(probe);
      accent = getComputedStyle(probe).color;
      probe.remove();
    }

    function seed() {
      // Density scales with area but stays sparse — roughly one ember per
      // 700px², clamped so a wide monitor does not turn into confetti.
      const count = Math.min(90, Math.max(24, Math.round((width * height) / 700)));
      embers = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.4,
        vy: -(3 + Math.random() * 9),
        vx: (Math.random() - 0.5) * 3,
        a: 0.1 + Math.random() * 0.3,
        tw: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        accent: Math.random() < 0.35,
      }));
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      resolveAccent();
      seed();
    }

    function draw(dt: number) {
      if (!ctx || width === 0 || height === 0) return;
      ctx.clearRect(0, 0, width, height);

      for (const e of embers) {
        e.phase += e.tw * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        // Wrap rather than respawn: an ember leaving the top reappears at the
        // bottom, so the field never pulses when one is recycled.
        if (e.y < -4) {
          e.y = height + 4;
          e.x = Math.random() * width;
        } else if (e.y > height + 4) {
          e.y = -4;
          e.x = Math.random() * width;
        }
        if (e.x < -4) e.x = width + 4;
        else if (e.x > width + 4) e.x = -4;

        // The twinkle is what makes it read as a light source rather than
        // dirt on the screen; it never dips to zero, so nothing flickers off.
        const a = e.a * (0.55 + 0.45 * Math.sin(e.phase));
        ctx.globalAlpha = a;
        ctx.fillStyle = e.accent ? accent : "rgb(148 163 184)"; // accent, or zinc-400
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    let last = 0;
    function loop(now: number) {
      frame = requestAnimationFrame(loop);
      // Clamp dt so a backgrounded tab does not teleport every ember on
      // its first frame back.
      const dt = last === 0 ? 0.016 : Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(dt);
    }

    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      running = false;
    }

    function start() {
      if (running || reduced.matches || !onScreen) return;
      running = true;
      last = 0;
      frame = requestAnimationFrame(loop);
    }

    resize();
    draw(0);

    const ro = new ResizeObserver(() => {
      resize();
      draw(0);
    });
    ro.observe(canvas);

    // Only animate while the footer is actually on screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onReduceChange = () => {
      if (reduced.matches) {
        stop();
        draw(0);
      } else {
        start();
      }
    };
    reduced.addEventListener("change", onReduceChange);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onReduceChange);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_78%)]"
    />
  );
}
