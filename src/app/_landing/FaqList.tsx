import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Props = {
  items: { q: string; a: string }[];
  className?: string;
};

/**
 * The questions doctors ask. A native <details>/<summary>, so it opens and closes
 * without any JavaScript, and a screen reader reads it as a disclosure.
 */
export function FaqList({ items, className }: Props) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <Card key={item.q} tone="solid" className="p-0">
          <details className="group">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 p-5 text-[17px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
              <span className="flex-1">{item.q}</span>
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-ink-2 transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="px-5 pb-5 text-[16px] leading-relaxed text-ink-2">{item.a}</p>
          </details>
        </Card>
      ))}
    </div>
  );
}
