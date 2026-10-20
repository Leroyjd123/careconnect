"use client";

import { CircleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";

export default function DoctorError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card tone="subtle" className="flex min-h-0 flex-1 items-center justify-center p-6">
      <EmptyState
        icon={CircleAlert}
        tone="danger"
        title="Something went wrong"
        action={
          <div className="flex gap-2.5">
            <Button onClick={reset}>Try again</Button>
            <ButtonLink href="/doctor" variant="secondary">
              Back to inbox
            </ButtonLink>
          </div>
        }
      >
        We couldn&apos;t load this screen. Please check your internet and try again.
      </EmptyState>
    </Card>
  );
}
