import { Moon, Sun, Sunrise } from "lucide-react";
import { frequencySlots } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SLOTS = [
  { label: "Morning", Icon: Sunrise },
  { label: "Afternoon", Icon: Sun },
  { label: "Night", Icon: Moon },
];

/**
 * Patient-friendly schedule: filled slot = take a dose. Readable without understanding "1-0-1".
 * Falls back to plain text for patterns like "Once a week".
 */
export function DoseSchedule({ frequency }: { frequency: string }) {
  const slots = frequencySlots(frequency);
  if (!slots) return <p className="text-[15px] text-ink">{frequency}</p>;

  return (
    <ul className="grid grid-cols-3 gap-2" aria-label={`Dose times: ${frequency}`}>
      {SLOTS.map(({ label, Icon }, i) => {
        const on = slots[i];
        return (
          <li
            key={label}
            className={cn(
              "flex flex-col items-center gap-1 rounded-field px-1.5 py-2 text-xs",
              on ? "bg-forest font-semibold text-white" : "border border-dashed border-sage bg-mint/90 text-ink-2",
            )}
          >
            <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
            {label}
            <span className="sr-only">{on ? ": take a dose" : ": no dose"}</span>
          </li>
        );
      })}
    </ul>
  );
}
