import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DisplayHeadingProps = {
  /** The small line above the headline. */
  eyebrow?: string;
  /** The headline. The second line is the coloured one. */
  children: ReactNode;
  /** The coloured accent line, under the headline. */
  accent?: ReactNode;
  /** The size. The hero uses "lg"; the sections use "md". */
  size?: "md" | "lg";
  /** The heading level, so the page keeps one h1 and the rest are h2. */
  as?: "h1" | "h2" | "h3";
  className?: string;
};

/**
 * The big headline (decision 67): Inter, heavy, tight tracking. One line in ink and
 * one accent line in forest. Used in every section of the landing page.
 */
export function DisplayHeading({ eyebrow, children, accent, size = "md", as = "h2", className }: DisplayHeadingProps) {
  const Tag = as;
  const lg = size === "lg";
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {eyebrow ? (
        <span className="text-[13px] font-semibold tracking-wide text-ink-label uppercase">{eyebrow}</span>
      ) : null}
      <Tag
        className={cn(
          "font-extrabold tracking-tight text-balance text-ink",
          lg ? "text-[38px] leading-[1.06] sm:text-[52px] lg:text-[60px]" : "text-[28px] leading-[1.12] sm:text-[36px]",
        )}
      >
        {children}
        {accent ? (
          <>
            <br />
            <span className="text-forest">{accent}</span>
          </>
        ) : null}
      </Tag>
    </div>
  );
}
