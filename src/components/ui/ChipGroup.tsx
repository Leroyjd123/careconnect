"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextInput } from "@/components/ui/Field";

const CUSTOM = "Custom…";

type ChipGroupProps = {
  label: string;
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
  /** Adds a "Custom…" chip that reveals a text input (prescription fields). */
  allowCustom?: boolean;
  customPlaceholder?: string;
  size?: "sm" | "md";
  className?: string;
};

/**
 * Single-choice quick picks (frequency, duration, timing).
 * Starts with nothing selected unless `value` is set: never pre-choose a clinical option.
 */
export function ChipGroup({ label, options, value, onChange, allowCustom, customPlaceholder, size = "sm", className }: ChipGroupProps) {
  const isCustomValue = !!value && !options.includes(value);
  const [customOpen, setCustomOpen] = useState(isCustomValue);
  const showCustom = allowCustom && (customOpen || isCustomValue);

  return (
    <fieldset className={cn("flex flex-col gap-2", className)}>
      <legend className="mb-2 text-[13px] font-semibold text-ink">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {(allowCustom ? [...options, CUSTOM] : options).map((o) => {
          const isCustomChip = o === CUSTOM;
          const selected = isCustomChip ? !!showCustom : o === value && !showCustom;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setCustomOpen(isCustomChip);
                onChange(isCustomChip ? "" : o);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 transition-colors",
                size === "sm" ? "h-11 text-[13px]" : "h-12 text-sm",
                selected ? "bg-forest font-semibold text-white" : "border border-line bg-white/80 text-ink hover:bg-white",
              )}
            >
              {selected ? <Check aria-hidden="true" className="size-3.5" /> : null}
              {o}
            </button>
          );
        })}
      </div>
      {showCustom ? (
        <TextInput
          aria-label={`${label} (custom)`}
          placeholder={customPlaceholder ?? "Type it in"}
          value={isCustomValue ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 h-11"
        />
      ) : null}
    </fieldset>
  );
}
