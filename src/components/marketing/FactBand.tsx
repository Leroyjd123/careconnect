import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type FactBandProps = {
  /** Each fact: a big value and a short line. Only true facts, no invented numbers. */
  facts: { value: string; label: string }[];
  className?: string;
};

/** A band of big numbers with a line under each. Two columns on a phone, four wide. */
export function FactBand({ facts, className }: FactBandProps) {
  return (
    <Card tone="solid" className={cn("p-6 sm:p-8", className)}>
      <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="flex flex-col-reverse gap-1">
            <dt className="text-[15px] leading-snug text-ink-2">{fact.label}</dt>
            <dd className="text-[36px] font-extrabold tracking-tight text-forest sm:text-[44px]">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
