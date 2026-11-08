"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type RotatingWordProps = {
  /** The words, one at a time. */
  words: string[];
  /** How long each word stays, in milliseconds. */
  interval?: number;
  className?: string;
};

/**
 * The headline word that cycles ("…for reports / prescriptions / follow-ups").
 *
 * The animation is pure CSS: the words are stacked and the active one is shown.
 * With reduced motion the first word simply stays. The whole list is in the markup
 * for screen readers, and nothing is announced on every change.
 */
export function RotatingWord({ words, interval = 2600, className }: RotatingWordProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // The timer only runs in the browser, so the server's markup and the first paint agree.
  useEffect(() => {
    if (words.length < 2) return;
    if (paused) return;
    // Respect the reader's setting: with reduced motion the word does not change.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => window.clearInterval(timer);
  }, [words.length, interval, paused]);

  return (
    <span
      className={cn("relative inline-block align-baseline", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Every word, for screen readers. The animation is aria-hidden. */}
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden="true" className="relative inline-block">
        {words.map((word, i) => (
          <span
            key={word}
            className={cn(
              "inline-block transition-opacity duration-500",
              i === index ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0",
            )}
          >
            {word}
          </span>
        ))}
      </span>
    </span>
  );
}
