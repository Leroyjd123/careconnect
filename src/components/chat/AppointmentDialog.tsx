"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, TriangleAlert } from "lucide-react";
import {
  cancelCheckIn,
  cancelMeeting,
  completeCheckIn,
  completeMeeting,
  convertCheckInToMeeting,
  scheduleCheckIn,
  scheduleMeeting,
  updateCheckIn,
  updateMeeting,
} from "@/app/actions/meetings";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Dialog } from "@/components/ui/Dialog";
import { Banner } from "@/components/ui/Feedback";
import { Field, FieldError, TextArea, TextInput } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { addDays, appZoneDay, appZoneTime, formatDayMonth, formatTimeOn, todayInAppZone } from "@/lib/utils";
import type { CheckIn, Meeting } from "@/lib/types";

type AppointmentDialogProps = {
  /** The conversation the appointment belongs to. */
  conversationId: string;
  /** Which form to open. */
  type: "meeting" | "check_in";
  /** The meeting being rescheduled or cancelled. */
  meeting?: Meeting | null;
  /** The check-in being rescheduled, marked done or turned into a meeting. */
  checkIn?: CheckIn | null;
  /** The doctor's other meetings that day, for the overlap warning (decision 41). */
  otherMeetings?: Meeting[];
  /** Where closing goes. */
  closeHref: string;
  /** Only overridden by /styleguide. */
  actions?: {
    scheduleMeeting?: typeof scheduleMeeting;
    updateMeeting?: typeof updateMeeting;
    cancelMeeting?: typeof cancelMeeting;
    completeMeeting?: typeof completeMeeting;
    scheduleCheckIn?: typeof scheduleCheckIn;
    updateCheckIn?: typeof updateCheckIn;
    completeCheckIn?: typeof completeCheckIn;
    cancelCheckIn?: typeof cancelCheckIn;
    convertCheckInToMeeting?: typeof convertCheckInToMeeting;
  };
};

/** How long a meeting lasts, in minutes. 15 is the default (decision 32). */
const DURATIONS = ["15 minutes", "30 minutes", "45 minutes", "60 minutes"];
const DURATION_VALUES = [15, 30, 45, 60];

/** When a check-in is due. "In" chips (decision 68). */
const CHECK_IN_SPANS = ["3 days", "1 week", "2 weeks", "1 month"];
const CHECK_IN_DAYS = [3, 7, 14, 30];

/** The time field wants "HH:mm" in the app time zone. */
function timeOf(iso: string) {
  return appZoneTime(iso);
}

function dateOf(iso: string) {
  return appZoneDay(iso);
}

/** Which "In" chip a due date matches, or "custom" when it doesn't. */
function dueSpanValue(dueOn: string) {
  const days = CHECK_IN_DAYS.find((d) => addDays(d) === dueOn);
  return days ? String(days) : "custom";
}


/**
 * The popup for a meeting and for a check-in (decision 72). One dialog, switched by
 * `type`: a meeting is a video call at a time, a check-in is a follow-up on a date.
 * The Segmented switch only shows when both are possible (a new appointment).
 */
export function AppointmentDialog({
  conversationId,
  type: initialType,
  meeting = null,
  checkIn = null,
  otherMeetings = [],
  closeHref,
  actions,
}: AppointmentDialogProps) {
  const router = useRouter();
  const act = {
    scheduleMeeting: actions?.scheduleMeeting ?? scheduleMeeting,
    updateMeeting: actions?.updateMeeting ?? updateMeeting,
    cancelMeeting: actions?.cancelMeeting ?? cancelMeeting,
    completeMeeting: actions?.completeMeeting ?? completeMeeting,
    scheduleCheckIn: actions?.scheduleCheckIn ?? scheduleCheckIn,
    updateCheckIn: actions?.updateCheckIn ?? updateCheckIn,
    completeCheckIn: actions?.completeCheckIn ?? completeCheckIn,
    cancelCheckIn: actions?.cancelCheckIn ?? cancelCheckIn,
    convertCheckInToMeeting: actions?.convertCheckInToMeeting ?? convertCheckInToMeeting,
  };

  const editing = !!(meeting || checkIn);
  const [type, setType] = useState<"meeting" | "check_in">(initialType);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // The meeting form. A new meeting starts tomorrow at a round time.
  const [date, setDate] = useState(() => (meeting ? dateOf(meeting.starts_at) : addDays(1)));
  const [time, setTime] = useState(() => (meeting ? timeOf(meeting.starts_at) : "10:00"));
  const [duration, setDuration] = useState(String(meeting?.duration_min ?? 15));
  const [customDuration, setCustomDuration] = useState("");
  const [meetUrl, setMeetUrl] = useState(meeting?.meet_url ?? "");
  const [note, setNote] = useState(meeting?.note ?? "");

  // The check-in form.
  const [dueOn, setDueOn] = useState(() => checkIn?.due_on ?? addDays(7));
  const [reason, setReason] = useState(checkIn?.reason ?? "");

  // Turn a check-in into a meeting: the meeting form, prefilled (decision 70).
  const [converting, setConverting] = useState(false);

  const durationMin = duration === "custom" ? Number(customDuration) : Number(duration);

  // The overlap warning (decision 41): a warning, never a block.
  const overlap = useMemo(() => {
    if (type !== "meeting" || !date || !time) return null;
    const start = Date.parse(`${date}T${time}:00Z`);
    const end = start + (Number.isFinite(durationMin) ? durationMin : 15) * 60_000;
    return (
      otherMeetings.find((m) => {
        if (meeting && m.id === meeting.id) return false;
        const s = Date.parse(m.starts_at);
        const e = s + m.duration_min * 60_000;
        return start < e && s < end;
      }) ?? null
    );
  }, [type, date, time, durationMin, otherMeetings, meeting]);

  function close() {
    router.replace(closeHref);
  }

  async function run(work: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    const result = await work();
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return false;
    }
    close();
    router.refresh();
    return true;
  }

  const meetingForm = (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="appt-date" label="Date">
          <TextInput id="appt-date" type="date" value={date} min={todayInAppZone()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field id="appt-time" label="Time" hint={`Your clinic's time (${formatTimeOn(date || todayInAppZone(), "12:00")}).`}>
          <TextInput id="appt-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>

      <ChipGroup
        label="How long?"
        options={[...DURATIONS, "Custom…"]}
        optionValues={[...DURATION_VALUES.map(String), "custom"]}
        value={duration}
        onChange={(v) => {
          setDuration(v);
          if (v === "custom") setCustomDuration("");
        }}
        allowCustom
        customPlaceholder="Minutes"
        size="md"
      />
      {duration === "custom" ? (
        <Field id="appt-duration" label="Minutes" hint="Between 5 and 240.">
          <TextInput
            id="appt-duration"
            type="number"
            inputMode="numeric"
            min={5}
            max={240}
            value={customDuration}
            onChange={(e) => setCustomDuration(e.target.value)}
            placeholder="30"
          />
        </Field>
      ) : null}

      <Field id="appt-link" label="Meeting link" hint="Paste the link from your meeting app.">
        <TextInput
          id="appt-link"
          type="url"
          inputMode="url"
          value={meetUrl}
          onChange={(e) => setMeetUrl(e.target.value)}
          placeholder="https://meet.google.com/…"
        />
      </Field>

      <Field id="appt-note" label="Note for the patient" optional>
        <TextArea
          id="appt-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Bring your blood pressure readings."
        />
      </Field>

      {overlap ? (
        <Banner tone="info">
          <span className="flex items-start gap-2">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
            <span>
              You already have a meeting at {formatTimeOn(overlap.starts_at.slice(0, 10), overlap.starts_at.slice(11, 16))}. You can still schedule
              this one.
            </span>
          </span>
        </Banner>
      ) : null}
    </div>
  );

  const checkInForm = (
    <div className="flex flex-col gap-4">
      <ChipGroup
        label="Check back in"
        options={[...CHECK_IN_SPANS, "Custom…"]}
        optionValues={[...CHECK_IN_DAYS.map(String), "custom"]}
        value={dueSpanValue(dueOn)}
        onChange={(v) => {
          if (v === "custom") return;
          setDueOn(addDays(Number(v)));
        }}
        allowCustom
        customPlaceholder="YYYY-MM-DD"
        size="md"
      />
      <Field id="appt-due" label="Due on" hint={`${formatDayMonth(dueOn)}.`}>
        <TextInput
          id="appt-due"
          type="date"
          value={dueOn}
          min={todayInAppZone()}
          onChange={(e) => setDueOn(e.target.value)}
        />
      </Field>
      <Field id="appt-reason" label="What is the check-in about?" hint="The patient sees this.">
        <TextArea
          id="appt-reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Review BP after new tablets"
        />
      </Field>
    </div>
  );

  const title = meeting
    ? "Meeting details"
    : checkIn
      ? "Check-in details"
      : type === "meeting"
        ? "Schedule a meeting"
        : "Set a check-in";

  const description = meeting
    ? "Change the time, the length, the link or the note."
    : checkIn
      ? "Move it, mark it done, or turn it into a video meeting."
      : type === "meeting"
        ? "A video call at a time you both agree on."
        : "A reminder to come back on a date.";

  return (
    <Dialog
      open
      onClose={close}
      title={title}
      description={description}
      footer={
        editing ? (
          <>
            {confirmCancel ? (
              <>
                <Button variant="ghost" onClick={() => setConfirmCancel(false)} disabled={busy}>
                  Keep it
                </Button>
                <Button
                  variant="danger"
                  loading={busy}
                  onClick={() =>
                    void run(() =>
                      meeting
                        ? act.cancelMeeting(meeting.id)
                        : act.cancelCheckIn(checkIn!.id),
                    )
                  }
                >
                  Yes, cancel it
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setConfirmCancel(true)} disabled={busy}>
                  {meeting ? "Cancel meeting" : "Cancel check-in"}
                </Button>
                {meeting ? (
                  <Button
                    variant="secondary"
                    loading={busy}
                    onClick={() => void run(() => act.completeMeeting(meeting.id))}
                  >
                    Mark done
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    loading={busy}
                    onClick={() => void run(() => act.completeCheckIn(checkIn!.id))}
                  >
                    Mark done
                  </Button>
                )}
                <Button
                  loading={busy}
                  onClick={() =>
                    void run(() =>
                      meeting
                        ? act.updateMeeting(meeting.id, { date, time, durationMin, meetUrl, note })
                        : act.updateCheckIn(checkIn!.id, { dueOn, reason }),
                    )
                  }
                >
                  Save changes
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button
              loading={busy}
              onClick={() =>
                void run(() =>
                  type === "meeting"
                    ? act.scheduleMeeting({ conversationId, date, time, durationMin, meetUrl, note })
                    : act.scheduleCheckIn({ conversationId, dueOn, reason }),
                )
              }
            >
              {type === "meeting" ? "Schedule meeting" : "Set check-in"}
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {/* A new appointment can be either kind; an existing one keeps its kind. */}
        {!editing ? (
          <Segmented
            label="What are you setting up?"
            options={[
              { value: "meeting", label: "Meeting" },
              { value: "check_in", label: "Check-in" },
            ]}
            value={type}
            onChange={(v) => setType(v)}
          />
        ) : null}

        {error ? <FieldError>{error}</FieldError> : null}

        {type === "meeting" ? meetingForm : checkInForm}

        {/* Turn a check-in into a meeting: the meeting form, prefilled (decision 70). */}
        {checkIn && !meeting ? (
          converting ? (
            <>
              <Banner tone="info">
                <span className="flex items-start gap-2">
                  <CalendarPlus aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
                  <span>
                    The reason becomes the note: “{checkIn.reason}”. Fill in the date, time and link, then save.
                  </span>
                </span>
              </Banner>
              {meetingForm}
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => setConverting(false)} disabled={busy}>
                  Back to the check-in
                </Button>
                <Button
                  loading={busy}
                  onClick={() =>
                    void run(() =>
                      act.convertCheckInToMeeting(checkIn.id, {
                        conversationId,
                        date,
                        time,
                        durationMin,
                        meetUrl,
                        note: checkIn.reason,
                      }),
                    )
                  }
                >
                  Schedule the meeting
                </Button>
              </div>
            </>
          ) : (
            <Button variant="secondary" block onClick={() => setConverting(true)} disabled={busy}>
              <CalendarPlus aria-hidden="true" className="size-[18px]" />
              Turn into a meeting
            </Button>
          )
        ) : null}
      </div>
    </Dialog>
  );
}
