"use client";

import { AnimatedRays } from "./ui/animated-rays";

/**
 * The page-wide glow from Vengeance UI, pinned behind everything. It is
 * absolutely positioned to the document rather than fixed to the viewport, so
 * the rays stay anchored at the top of the page and scroll away instead of
 * riding along at the top of the screen.
 */
export function PageBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(760px,100vh)] opacity-[0.16]"
    >
      <AnimatedRays className="[--stripe-color:#08080a]" />
    </div>
  );
}
