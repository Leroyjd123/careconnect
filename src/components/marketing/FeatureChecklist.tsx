import { Check } from "lucide-react";
import { IconTile } from "@/components/ui/IconTile";
import { cn } from "@/lib/utils";

type FeatureChecklistProps = {
  /** The title above the list. */
  title: string;
  /** One line under the title. */
  subtitle?: string;
  /** The items, each with a short explanation. */
  items: { label: string; detail?: string }[];
  /** One column on a phone, two on a wide screen. */
  columns?: 1 | 2;
  className?: string;
};

/**
 * The check list ("Your patients can"): a round icon and a line per item. Two columns
 * on a wide screen, one on a phone.
 */
export function FeatureChecklist({ title, subtitle, items, columns = 2, className }: FeatureChecklistProps) {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[22px] font-bold tracking-tight text-ink">{title}</h3>
        {subtitle ? <p className="text-[16px] text-ink-2">{subtitle}</p> : null}
      </div>
      <ul className={cn("grid gap-4", columns === 2 ? "sm:grid-cols-2" : "grid-cols-1")}>
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-3">
            <IconTile tone="soft" className="rounded-full">
              <Check aria-hidden="true" className="size-5" strokeWidth={2.4} />
            </IconTile>
            <div className="flex flex-col gap-0.5 pt-1.5">
              <span className="text-[16px] font-semibold text-ink">{item.label}</span>
              {item.detail ? <span className="text-[15px] text-ink-2">{item.detail}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
