"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ChipMarqueeProps = {
  /** The chips, in one row. */
  chips: string[];
  /** The visible label above the row, for screen readers. */
  label: string;
  /** How fast the row moves. Higher is slower. */
  duration?: number;
  className?: string;
};

/**
 * A slow-scrolling row of chips ("What you can handle"). The row is duplicated so the
 * scroll never shows a gap, and the copy is hidden from screen readers so it is read
 * once. With reduced motion the row stands still.
 */
export function ChipMarquee({ chips, label, duration = 38, className }: ChipMarqueeProps) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const row = (hidden: boolean) => (
    <ul
      className={cn("flex shrink-0 items-center gap-2.5", hidden && "aria-hidden")}
      style={reduced ? undefined : { animation: `cc-marquee ${duration}s linear infinite` }}
    >
      {chips.map((chip) => (
        <li
          key={chip}
          className="shrink-0 rounded-full border border-line bg-white/70 px-4 py-2 text-[15px] font-medium whitespace-nowrap text-ink"
        >
          {chip}
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      role="group"
      aria-label={label}
      onMouseEnter={(e) => e.currentTarget.querySelectorAll("ul").forEach((ul) => ul.classList.add("cc-pause"))}
      onMouseLeave={(e) => e.currentTarget.querySelectorAll("ul").forEach((ul) => ul.classList.remove("cc-pause"))}
    >
      {/* The row, and a copy of it for the seamless loop. */}
      <div className="flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
