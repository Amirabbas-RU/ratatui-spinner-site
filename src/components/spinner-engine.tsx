"use client";

/**
 * The app-owned animation clock.
 *
 * This mirrors the crate's central design decision: a spinner holds no time.
 * The page owns a single `tick`, advances it on a timer, and every spinner
 * renders one frame for the tick it is given. A redraw caused by anything
 * else can reuse the same tick — the spin only advances when the value
 * changes.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

interface Engine {
  tick: number;
  /** Frames per second. Matches the crate's common 50ms timer interval. */
  fps: number;
}

const SpinnerContext = createContext<Engine>({ tick: 0, fps: 20 });

const INTERVAL_MS = 50;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Subscribes to the OS reduced-motion preference.
 *
 * `useSyncExternalStore` rather than an effect that calls `setState`: the
 * browser already exposes this as a store with a change event, and reading it
 * through this hook gives the server render the right answer too. The old
 * shape started at `true` and flipped after mount, so every spinner rendered
 * one frame and then re-rendered — a cascading render on first paint.
 */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    // Client snapshot. The page is `color-scheme: dark` and this is a
    // media query, so there is no server value to disagree with on the first
    // paint in any meaningful way.
    () => window.matchMedia(REDUCED_MOTION).matches,
    // Server snapshot: assume motion is allowed, matching the CSS default.
    () => false
  );
}

export function SpinnerProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    // With reduced motion we hold a single static frame — the widget still
    // renders, it just does not animate.
    if (reduced) return;

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      if (now - last >= INTERVAL_MS) {
        // `wrapping_add` equivalent: the crate's tick is a u64.
        setTick((prev) => (prev + 1) >>> 0);
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const value = useMemo<Engine>(() => ({ tick, fps: 1000 / INTERVAL_MS }), [tick]);

  return <SpinnerContext.Provider value={value}>{children}</SpinnerContext.Provider>;
}

export function useSpinnerTick(): number {
  return useContext(SpinnerContext).tick;
}
