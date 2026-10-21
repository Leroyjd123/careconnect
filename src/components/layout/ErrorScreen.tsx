"use client";

import { CircleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";

/** What error.tsx shows when a screen fails to load. One wording for both apps; only the way back differs. */
export function ErrorScreen({ onRetry, backHref, backLabel }: { onRetry: () => void; backHref: string; backLabel: string }) {
  return (
    <EmptyState
      icon={CircleAlert}
      tone="danger"
      title="Something went wrong"
      action={
        <div className="flex flex-wrap justify-center gap-2.5">
          <Button onClick={onRetry}>Try again</Button>
          <ButtonLink href={backHref} variant="secondary">
            {backLabel}
          </ButtonLink>
        </div>
      }
    >
      We couldn&apos;t load this screen. Please check your internet and try again.
    </EmptyState>
  );
}
