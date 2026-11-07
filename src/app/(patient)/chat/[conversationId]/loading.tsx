import { Skeleton } from "@/components/ui/Feedback";

/** Shown while a chat opens. Mirrors the chat column: a header bar and the message area. */
export default function Loading() {
  return (
    <main className="flex h-dvh min-h-0 flex-col p-3" aria-busy="true" aria-label="Loading">
      <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-card bg-white/50 p-2.5">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-16 rounded-tile" />
        <Skeleton className="h-16 rounded-tile" />
        <Skeleton className="h-16 rounded-tile" />
      </div>
    </main>
  );
}
