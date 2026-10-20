"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ChipGroupProps = {
  label: string;
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
  size?: "sm" | "md";
  className?: string;
};

/**
 * Single-choice quick picks (frequency, duration, timing).
 * Starts with nothing selected unless `value` is set: never pre-choose a clinical option.
 */
export function ChipGroup({ label, options, value, onChange, size = "sm", className }: ChipGroupProps) {
  return (
    <fieldset className={cn("flex flex-col gap-2", className)}>
      <legend className="mb-2 text-[13px] font-semibold text-ink">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const selected = o === value;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(o)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 transition-colors",
                size === "sm" ? "h-10 text-[13px]" : "h-11 text-sm",
                selected ? "bg-forest font-semibold text-white" : "border border-line bg-white/80 text-ink hover:bg-white",
              )}
            >
              {selected ? <Check aria-hidden="true" className="size-3.5" /> : null}
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
