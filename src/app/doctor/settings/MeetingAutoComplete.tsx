"use client";

import { useState, useTransition } from "react";
import { setMeetingAutoComplete } from "@/app/actions/meetings";
import { Banner } from "@/components/ui/Feedback";
import { Segmented } from "@/components/ui/Segmented";

/**
 * "Mark meetings complete automatically 15 minutes after they start" (decision 36, Q-I).
 * A page-local control for the doctor's Settings, using the Segmented primitive.
 * Saves straight away: there is nothing to submit.
 */
export function MeetingAutoComplete({ value }: { value: boolean }) {
  const [on, setOn] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function change(next: boolean) {
    const previous = on;
    setOn(next);
    setError(null);
    startTransition(async () => {
      const result = await setMeetingAutoComplete(next);
      if (!result.ok) {
        setOn(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Segmented
        label="Mark meetings complete automatically"
        value={on ? "on" : "off"}
        onChange={(v) => change(v === "on")}
        options={[
          { value: "on", label: "On" },
          { value: "off", label: "Off" },
        ]}
      />
      <p className="text-[13px] text-ink-2">
        A meeting is marked done 15 minutes after it starts, so you don&apos;t have to. You can still mark it done by hand.
      </p>
      {error ? <Banner tone="danger">{error}</Banner> : null}
    </div>
  );
}
