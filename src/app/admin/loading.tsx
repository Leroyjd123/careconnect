import { Skeleton } from "@/components/ui/Feedback";

/** Shown while an admin screen fetches. */
export default function Loading() {
  return (
    <div className="flex min-h-0 flex-1 gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="hidden w-[340px] shrink-0 rounded-card lg:block" />
      <Skeleton className="min-h-0 flex-1 rounded-card" />
    </div>
  );
}
