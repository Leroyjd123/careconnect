"use client";

import { ErrorScreen } from "@/components/layout/ErrorScreen";

export default function PatientError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 items-center p-3 pb-32">
      <ErrorScreen onRetry={reset} backHref="/home" backLabel="Back to home" />
    </main>
  );
}
