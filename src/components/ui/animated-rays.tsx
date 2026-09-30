"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

interface AnimatedRaysProps {
    /** Additional CSS classes */
    className?: string;
    /** Optional children to render over the background */
    children?: React.ReactNode;
}

/**
 * The site sets `class="dark"` on `<html>` at the document level, so dark mode
 * is an attribute on a node outside React. A MutationObserver is the right way
 * to subscribe to it, and `useSyncExternalStore` is the right way to read it —
 * setting state inside an effect instead would render twice on mount.
 */
function subscribeToDark(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
    });
    return () => observer.disconnect();
}

const isDarkNow = () => document.documentElement.classList.contains("dark");

// The server has no `<html>` to inspect, and this backdrop is decorative, so
// the first paint optimistically assumes dark and the client corrects it.
const isDarkOnServer = () => true;

export function AnimatedRays({
    className = "",
    children,
}: AnimatedRaysProps) {
    const isDark = useSyncExternalStore(subscribeToDark, isDarkNow, isDarkOnServer);

    const stripes = `repeating-linear-gradient(
        100deg,
        var(--stripe-color) 0%,
        var(--stripe-color) 7%,
        transparent 10%,
        transparent 12%,
        var(--stripe-color) 16%
    )`;
    const rainbow = `repeating-linear-gradient(
        100deg,
        #60a5fa 10%,
        #e879f9 15%,
        #60a5fa 20%,
        #5eead4 25%,
        #60a5fa 30%
    )`;

    return (
        <section className={cn("relative w-full h-full overflow-hidden", className)}>
            {/* Aurora Background — matches original .hero */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `${stripes}, ${rainbow}`,
                    backgroundSize: "300%, 200%",
                    backgroundPosition: "50% 50%, 50% 50%",
                    filter: isDark
                        ? "blur(10px) opacity(50%) saturate(200%)"
                        : "blur(10px) invert(100%)",
                    maskImage: "radial-gradient(ellipse at 100% 0%, black 40%, transparent 70%)",
                    WebkitMaskImage: "radial-gradient(ellipse at 100% 0%, black 40%, transparent 70%)",
                }}
            >
                {/* Animated overlay — matches original .hero::after */}
                <div
                    className="absolute inset-0 animate-aurora-bg"
                    style={{
                        backgroundImage: `${stripes}, ${rainbow}`,
                        backgroundSize: "200%, 100%",
                        backgroundAttachment: "fixed",
                        mixBlendMode: "difference",
                    }}
                />
            </div>

            {children && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                    {children}
                </div>
            )}
        </section>
    );
}

export default AnimatedRays;
