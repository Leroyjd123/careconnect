import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type StepListProps = {
  /** The steps, in order. The number is drawn from the position. */
  steps: { title: string; body: string }[];
  className?: string;
};

/** "How it works": numbered steps, one row on a wide screen, stacked on a phone. */
export function StepList({ steps, className }: StepListProps) {
  return (
    <ol className={cn("grid gap-4 md:grid-cols-3", className)}>
      {steps.map((step, i) => (
        <li key={step.title} className="flex">
          <Card tone="feature" className="flex w-full flex-col gap-3 p-6">
            <span
              aria-hidden="true"
              className="flex size-11 items-center justify-center rounded-full bg-forest text-[18px] font-extrabold text-white"
            >
              {i + 1}
            </span>
            <h3 className="text-[19px] font-bold tracking-tight text-ink">
              <span className="sr-only">Step {i + 1}: </span>
              {step.title}
            </h3>
            <p className="text-[16px] leading-relaxed text-ink-2">{step.body}</p>
          </Card>
        </li>
      ))}
    </ol>
  );
}
