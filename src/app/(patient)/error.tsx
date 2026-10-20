"use client";

import { CircleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";

export default function PatientError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 items-center p-3 pb-32">
      <EmptyState
        icon={CircleAlert}
        tone="danger"
        title="Something went wrong"
        action={
          <div className="flex gap-2.5">
            <Button onClick={reset}>Try again</Button>
            <ButtonLink href="/home" variant="secondary">
              Back to home
            </ButtonLink>
          </div>
        }
      >
        We couldn&apos;t load this screen. Please check your internet and try again.
      </EmptyState>
    </main>
  );
}
