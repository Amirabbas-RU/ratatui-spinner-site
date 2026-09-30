"use client";

/**
 * Reveal-on-scroll.
 *
 * The `.reveal` class starts elements hidden; this observer adds
 * `.is-visible` as they enter the viewport, once each. Keeping it as a single
 * client island lets every section stay a Server Component.
 *
 * If IntersectionObserver is unavailable, or the visitor prefers reduced
 * motion, everything is revealed immediately.
 */
import { useEffect } from "react";

export function RevealObserver() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      document
        .querySelectorAll(".reveal")
        .forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      // Start the reveal slightly before the element's top edge reaches the
      // viewport bottom, so content is already settled when it is read.
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );

    const observeAll = () => {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => {
        observer.observe(el);
      });
    };

    observeAll();

    // Sections render as Server Components, so the DOM grows after mount.
    const mutation = new MutationObserver(observeAll);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, []);

  return null;
}
