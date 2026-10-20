import { Skeleton } from "@/components/ui/Feedback";

/** Shown while a patient screen fetches. Mirrors the shape of a header plus a few cards. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-3 pb-32" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-16 rounded-3xl" />
      <Skeleton className="h-40 rounded-card" />
      <Skeleton className="h-24 rounded-card" />
      <Skeleton className="h-24 rounded-card" />
    </div>
  );
}
