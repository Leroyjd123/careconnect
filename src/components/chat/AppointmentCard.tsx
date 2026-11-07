import type { ReactNode } from "react";
import { CalendarCheck, CalendarClock, CheckCircle2, CircleSlash, Video } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";
import { cn, daysUntil, formatDate, formatDue, formatTime } from "@/lib/utils";
import type { CheckIn, Meeting } from "@/lib/types";

export type AppointmentType = "meeting" | "check_in";

type AppointmentCardProps = {
  /** "meeting" is a video call at a time; "check_in" is a follow-up on a date. */
  type: AppointmentType;
  /** The meeting to show. */
  meeting?: Meeting | null;
  /** The check-in to show. */
  checkIn?: CheckIn | null;
  /** Who is looking: the doctor sees the actions, the patient only joins. */
  viewerRole?: "doctor" | "patient";
  /** True for the small card in the patient panel and on the patient's home. */
  compact?: boolean;
  /** Doctor actions: Reschedule, Cancel, Mark done. */
  actions?: ReactNode;
  /** Where the card's own link goes, e.g. "?appt=<id>". */
  href?: string;
};

/** "Join meeting" is active from 10 minutes before the start until the end (decision 33). */
export function canJoin(meeting: Meeting, now = new Date()) {
  const start = Date.parse(meeting.starts_at);
  const end = start + meeting.duration_min * 60_000;
  return now.getTime() >= start - 10 * 60_000 && now.getTime() <= end;
}

/** The badge for a meeting: Scheduled / Starting soon / Now / Completed / Cancelled. */
function meetingBadge(meeting: Meeting, now: Date) {
  if (meeting.status === "cancelled") return { tone: "neutral" as const, icon: <CircleSlash aria-hidden="true" />, text: "Cancelled" };
  if (meeting.status === "completed") return { tone: "neutral" as const, icon: <CheckCircle2 aria-hidden="true" />, text: "Completed" };
  const start = Date.parse(meeting.starts_at);
  const minutes = (start - now.getTime()) / 60_000;
  if (minutes <= 0) return { tone: "brand" as const, icon: <Video aria-hidden="true" />, text: "Now" };
  if (minutes <= 15) return { tone: "warning" as const, icon: <Video aria-hidden="true" />, text: "Starting soon" };
  return { tone: "outline" as const, icon: <CalendarClock aria-hidden="true" />, text: "Scheduled" };
}

/** The badge for a check-in: Scheduled / Due today / Overdue / Done / Cancelled. */
function checkInBadge(checkIn: CheckIn, now: Date) {
  if (checkIn.status === "cancelled") return { tone: "neutral" as const, icon: <CircleSlash aria-hidden="true" />, text: "Cancelled" };
  if (checkIn.status === "done") return { tone: "neutral" as const, icon: <CheckCircle2 aria-hidden="true" />, text: "Done" };
  const days = daysUntil(checkIn.due_on, now);
  if (days < 0) return { tone: "danger" as const, icon: <CircleSlash aria-hidden="true" />, text: "Overdue" };
  if (days === 0) return { tone: "warning" as const, icon: <CalendarCheck aria-hidden="true" />, text: "Due today" };
  return { tone: "outline" as const, icon: <CalendarClock aria-hidden="true" />, text: "Scheduled" };
}


/**
 * The card for a meeting and for a check-in (decision 72). One component, switched by
 * `type`: a meeting is a video call at a time, a check-in is a follow-up on a date.
 */
export function AppointmentCard({
  type,
  meeting,
  checkIn,
  viewerRole = "patient",
  compact = false,
  actions,
  href,
}: AppointmentCardProps) {
  const now = new Date();
  const isMeeting = type === "meeting";
  const badge = isMeeting && meeting ? meetingBadge(meeting, now) : checkIn ? checkInBadge(checkIn, now) : null;
  const joinable = isMeeting && meeting ? canJoin(meeting, now) : false;

  const title = isMeeting ? "Video meeting" : "Check-in";
  const when = isMeeting
    ? meeting
      ? `${formatDate(meeting.starts_at)}, ${formatTime(meeting.starts_at)}`
      : ""
    : checkIn
      ? `Due ${formatDue(checkIn.due_on, now)}`
      : "";
  const detail = isMeeting ? (meeting ? `${meeting.duration_min} min` : "") : checkIn ? checkIn.reason : "";

  return (
    <Card tone="solid" radius="tile" className="flex w-full min-w-0 flex-col gap-3 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <IconTile tone={isMeeting ? "solid" : "soft"}>
          {isMeeting ? (
            <Video aria-hidden="true" className="size-[22px]" />
          ) : (
            <CalendarCheck aria-hidden="true" className="size-[22px]" />
          )}
        </IconTile>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-base font-semibold">{title}</span>
          {when ? <span className="text-[15px] text-ink-2">{when}</span> : null}
          {detail ? (
            <span className={cn("min-w-0 break-words", compact ? "text-[15px] text-ink-2" : "text-[15px] text-ink")}>
              {isMeeting ? detail : `About: ${detail}`}
            </span>
          ) : null}
        </div>
        {badge ? (
          <Badge tone={badge.tone} icon={badge.icon} className="shrink-0">
            {badge.text}
          </Badge>
        ) : null}
      </div>

      {/* "Join meeting" is only live near the start (decision 33). */}
      {isMeeting && meeting ? (
        <ButtonLink
          href={meeting.meet_url}
          target="_blank"
          rel="noopener noreferrer"
          variant={joinable ? "primary" : "outline"}
          size="md"
          block
          aria-disabled={!joinable}
          tabIndex={joinable ? undefined : -1}
          className={joinable ? undefined : "pointer-events-none opacity-60"}
        >
          <Video aria-hidden="true" className="size-[18px]" />
          {joinable ? "Join meeting" : "Join meeting (opens 10 minutes before)"}
        </ButtonLink>
      ) : null}

      {actions ? <div className="flex flex-wrap gap-2 [&>*]:flex-1 [&>*]:whitespace-nowrap">{actions}</div> : null}
      {href && !actions ? (
        <ButtonLink href={href} variant="outline" size="md" block>
          {viewerRole === "doctor" ? "Manage" : "View details"}
        </ButtonLink>
      ) : null}
    </Card>
  );
}
