"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { updateMyHealthDetails } from "@/app/actions/profile";
import { Button } from "@/components/ui/Button";
import { HealthDetailsDialog } from "./HealthDetailsDialog";
import type { HealthDetailsInput } from "@/lib/utils";

type HealthDetailsSectionProps = {
  details: HealthDetailsInput;
  /** The three values, ready to show: "Born 12 Apr 1988", "172 cm", "74.5 kg". */
  summary: string[];
  /** Only overridden by /styleguide. */
  saveAction?: typeof updateMyHealthDetails;
};

/**
 * The patient's own date of birth, height and weight, with an Edit button (decision 28).
 * Page-local: it lives beside the Profile page it belongs to.
 */
export function HealthDetailsSection({ details, summary, saveAction = updateMyHealthDetails }: HealthDetailsSectionProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1.5">
        {summary.map((line) => (
          <li key={line} className="text-base text-ink-2">
            {line}
          </li>
        ))}
      </ul>
      <Button variant="soft" size="sm" onClick={() => setEditing(true)}>
        <Pencil aria-hidden="true" className="size-4" />
        Edit
      </Button>
      {editing ? <HealthDetailsDialog details={details} open onClose={() => setEditing(false)} saveAction={saveAction} /> : null}
    </div>
  );
}
