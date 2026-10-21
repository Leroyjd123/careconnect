"use client";

import { Card } from "@/components/ui/Card";
import { ErrorScreen } from "@/components/layout/ErrorScreen";

export default function DoctorError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card tone="subtle" className="flex min-h-0 flex-1 items-center justify-center p-6">
      <ErrorScreen onRetry={reset} backHref="/doctor" backLabel="Back to inbox" />
    </Card>
  );
}
