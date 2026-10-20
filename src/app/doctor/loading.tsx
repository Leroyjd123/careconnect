import { Skeleton } from "@/components/ui/Feedback";

/** Shown while a doctor screen fetches: the inbox column plus the pane beside it. */
export default function Loading() {
  return (
    <div className="flex min-h-0 flex-1 gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="hidden w-[340px] shrink-0 rounded-card lg:block" />
      <Skeleton className="min-h-0 flex-1 rounded-card" />
    </div>
  );
}
