"use client";

import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

type SegmentedProps<T extends string> = {
  label: string; // accessible name for the group
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/** Pill switcher: All/Unread, Reports/Prescriptions, language. Exactly one option is on. */
export function Segmented<T extends string>({ label, options, value, onChange, className }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid gap-1 rounded-2xl bg-mint-200/70 p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-10 rounded-xl px-3 text-sm transition-colors",
              selected ? "bg-white font-semibold text-forest shadow-lift" : "font-medium text-ink hover:bg-white/50",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
