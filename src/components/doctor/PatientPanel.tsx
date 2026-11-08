"use client";

import { useState } from "react";
import { Ban, CalendarClock, CalendarPlus, CheckCircle2, Clock, FilePlus2, FileText, Mail, Paperclip, Pencil, Phone, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { setPatientBlocked } from "@/app/actions/patients";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { FileCard } from "@/components/chat/FileCard";
import { AppointmentCard } from "@/components/chat/AppointmentCard";
import { ageFrom, cn, formatDate, formatDay, formatTime } from "@/lib/utils";
import type { CheckIn, Meeting, Message, OtherDoctor, PrescriptionWithPeople, Profile } from "@/lib/types";

type PatientPanelProps = {
  conversationId: string;
  patient: Profile;
  /** This conversation's block (0005). Blocking is per doctor, not per account. */
  blockedAt?: string | null;
  prescriptions: PrescriptionWithPeople[];
  /** Prescription ids a newer issued one has replaced. */
  replacedRxIds: string[];
  /** The file messages in this conversation, newest first. */
  reports: Message[];
  /** The patient's other doctors, by name only (decision 26). Empty when the setting is off. */
  otherDoctors?: OtherDoctor[];
  /** The next scheduled meeting, for the "Next up" section. */
  nextMeeting?: Meeting | null;
  /** The next scheduled check-in, for the "Next up" section. */
  nextCheckIn?: CheckIn | null;
  /** "column" (default) is the desktop column. "sheet" is the phone sheet: no card chrome, no own scroll. */
  variant?: "column" | "sheet";
  /** Only overridden by /styleguide. */
  blockAction?: typeof setPatientBlocked;
};

/**
 * The doctor's right-hand column: a read-only summary of the patient (decision 73).
 * Nothing is edited here — every action opens a popup, and the popup is opened by the
 * query string, so a link works, a reload works and Back works.
 */
export function PatientPanel({
  conversationId,
  patient,
  blockedAt = null,
  prescriptions,
  replacedRxIds,
  reports,
  otherDoctors = [],
  nextMeeting = null,
  nextCheckIn = null,
  variant = "column",
  blockAction = setPatientBlocked,
}: PatientPanelProps) {
  const router = useRouter();
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const replaced = new Set(replacedRxIds);
  const invited = patient.status === "invited";
  const blocked = !!blockedAt;
  const firstName = patient.full_name.trim().split(/\s+/)[0] || "this patient";
  const base = `/doctor/c/${conversationId}`;
  const sheet = variant === "sheet";

  // The newest prescription, issued or a draft. Drafts stay private to the doctor.
  const latestRx = prescriptions[0] ?? null;
  const latestReports = reports.slice(0, 2);

  async function toggleBlock() {
    setBlocking(true);
    setBlockError(null);
    const result = await blockAction(patient.id, !blocked);
    setBlocking(false);
    if (!result.ok) {
      setBlockError(result.error);
      return;
    }
    setConfirmBlock(false);
    router.refresh();
  }

  return (
    <Card
      as={sheet ? "div" : undefined}
      tone={sheet ? undefined : "subtle"}
      className={cn("flex flex-col gap-4 p-4", sheet ? "h-full" : "min-h-0 flex-1 overflow-y-auto")}
    >
      {/* ── Identity ───────────────────────────────────────────── */}
      <section className="flex flex-col items-center gap-2 text-center" aria-label="Patient">
        <Avatar name={patient.full_name} seed={patient.id} size="lg" ring pending={invited} />
        <div className="flex flex-col">
          {/* In the sheet the dialog header already names the patient. */}
          {sheet ? null : <span className="text-[17px] font-semibold tracking-tight">{patient.full_name}</span>}
          {/* The full profile of this patient (decision 77). */}
          {sheet ? null : (
            <ButtonLink href={`/doctor/patients/${patient.id}`} variant="ghost" size="sm" className="self-center">
              Full profile
            </ButtonLink>
          )}
          {patient.phone ? (
            <span className="flex items-center justify-center gap-1.5 text-[13px] text-ink-2">
              <Phone aria-hidden="true" className="size-3.5" />
              {patient.phone}
            </span>
          ) : null}
          {patient.email && !sheet ? (
            <span className="flex items-center justify-center gap-1.5 text-[13px] text-ink-2">
              <Mail aria-hidden="true" className="size-3.5" />
              {patient.email}
            </span>
          ) : null}
          <span className="flex items-center justify-center gap-1.5 text-[13px] text-ink-2">
            <Clock aria-hidden="true" className="size-3.5" />
            {invited ? "Invite pending" : `Joined ${formatDate(patient.activated_at ?? patient.created_at)}`}
          </span>
        </div>
        {/* Status is always words plus an icon, never colour alone. */}
        {blocked ? (
          <Badge tone="danger" icon={<Ban aria-hidden="true" />}>
            Blocked
          </Badge>
        ) : invited ? (
          <Badge tone="warning" icon={<Clock aria-hidden="true" />}>
            Invited
          </Badge>
        ) : (
          <Badge tone="brand" icon={<CheckCircle2 aria-hidden="true" />}>
            Active
          </Badge>
        )}
      </section>

      {/* ── Actions ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2" aria-label="Actions">
        <ButtonLink href={`${base}?rx=new`} block>
          <FilePlus2 aria-hidden="true" className="size-[18px]" />
          New prescription
        </ButtonLink>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`${base}?appt=meeting`} variant="secondary" size="sm" className="flex-1">
            <CalendarPlus aria-hidden="true" className="size-4" />
            Schedule
          </ButtonLink>
          <ButtonLink href={`${base}?details=1`} variant="secondary" size="sm" className="flex-1">
            <Pencil aria-hidden="true" className="size-4" />
            Edit details
          </ButtonLink>
          <Button variant="ghost" size="sm" onClick={() => setConfirmBlock(true)} className="flex-1">
            {blocked ? <UserCheck aria-hidden="true" className="size-4" /> : <Ban aria-hidden="true" className="size-4" />}
            {blocked ? "Unblock" : "Block"}
          </Button>
        </div>
      </section>

      {/* ── Details ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-1.5" aria-label="Details">
        <h3 className="text-[13px] font-semibold tracking-wider text-ink-label uppercase">Details</h3>
        <ul className="flex flex-col gap-1 text-[15px]">
          <li className="flex items-center justify-between gap-2">
            <span className="text-ink-2">Age</span>
            <span className="font-medium">{patient.date_of_birth ? `${ageFrom(patient.date_of_birth)} years` : "Not added yet"}</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="text-ink-2">Height</span>
            <span className="font-medium">{patient.height_cm ? `${patient.height_cm} cm` : "Not added yet"}</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="text-ink-2">Weight</span>
            <span className="font-medium">{patient.weight_kg ? `${patient.weight_kg} kg` : "Not added yet"}</span>
          </li>
        </ul>
      </section>

      {/* ── Next up ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2" aria-label="Next up">
        <h3 className="text-[13px] font-semibold tracking-wider text-ink-label uppercase">Next up</h3>
        {nextMeeting || nextCheckIn ? (
          <div className="flex flex-col gap-2">
            {nextMeeting ? (
              <AppointmentCard
                type="meeting"
                meeting={nextMeeting}
                viewerRole="doctor"
                compact
                href={`${base}?appt=${nextMeeting.id}`}
              />
            ) : null}
            {nextCheckIn ? (
              <AppointmentCard
                type="check_in"
                checkIn={nextCheckIn}
                viewerRole="doctor"
                compact
                href={`${base}?appt=${nextCheckIn.id}`}
              />
            ) : null}
          </div>
        ) : (
          <EmptyState icon={CalendarClock} title="Nothing scheduled">
            Set a meeting or a check-in for {firstName}.
          </EmptyState>
        )}
      </section>

      {/* ── Latest prescription ─────────────────────────────────── */}
      <section className="flex flex-col gap-2" aria-label="Latest prescription">
        <h3 className="text-[13px] font-semibold tracking-wider text-ink-label uppercase">Latest prescription</h3>
        {latestRx ? (
          <>
            <div className="flex flex-col gap-1.5 rounded-tile bg-white/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] text-ink-2">
                  {latestRx.status === "draft" ? "Draft" : formatDate(latestRx.issued_at ?? latestRx.created_at)}
                </span>
                {latestRx.status === "draft" ? (
                  <Badge tone="outline">Not sent</Badge>
                ) : replaced.has(latestRx.id) ? (
                  <Badge tone="outline">Replaced</Badge>
                ) : (
                  <Badge tone="brand">Issued</Badge>
                )}
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {(latestRx.prescription_items ?? []).map((i) => (
                  <li key={i.id} className="rounded-field bg-mint px-2.5 py-1 text-[15px]">
                    {i.medicine}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={`${base}?rx=${latestRx.id}`} variant="outline" size="sm">
                View
              </ButtonLink>
              <ButtonLink href={`${base}?prescriptions=1`} variant="ghost" size="sm">
                All prescriptions ({prescriptions.length})
              </ButtonLink>
            </div>
          </>
        ) : (
          <EmptyState icon={FileText} title="No prescriptions yet">
            Drafts stay private until you issue them.
          </EmptyState>
        )}
      </section>

      {/* ── Reports ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2" aria-label="Reports">
        <h3 className="text-[13px] font-semibold tracking-wider text-ink-label uppercase">
          Reports{reports.length ? ` · ${reports.length}` : ""}
        </h3>
        {reports.length === 0 ? (
          <EmptyState icon={Paperclip} title="No reports yet">
            Anything {firstName} sends will show up here.
          </EmptyState>
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {latestReports.map((m) => (
                <li key={m.id}>
                  <FileCard
                    name={m.file_name ?? "Attachment"}
                    type={m.file_type}
                    meta={`${formatDay(m.created_at)}, ${formatTime(m.created_at)}`}
                    href={`${base}?file=${m.id}`}
                  />
                </li>
              ))}
            </ul>
            {reports.length > latestReports.length ? (
              <ButtonLink href={`${base}?reports=1`} variant="ghost" size="sm">
                View all ({reports.length})
              </ButtonLink>
            ) : null}
          </>
        )}
      </section>

      {/* ── Also consults ───────────────────────────────────────── */}
      {otherDoctors.length ? (
        <section className="flex flex-col gap-2 rounded-tile bg-white/70 p-3" aria-label="Also consults">
          <h3 className="text-[13px] font-semibold tracking-wider text-ink-label uppercase">Also consults</h3>
          <ul className="flex flex-col gap-2">
            {otherDoctors.map((d) => (
              <li key={d.id} className="flex items-center gap-2.5">
                <Avatar name={d.full_name} seed={d.id} size="sm" doctor />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[15px] font-medium">{d.full_name}</span>
                  {d.specialty ? <span className="truncate text-[13px] text-ink-2">{d.specialty}</span> : null}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-ink-2">Chats with other doctors stay private.</p>
        </section>
      ) : null}

      <Dialog
        open={confirmBlock}
        onClose={() => setConfirmBlock(false)}
        title={blocked ? `Unblock ${firstName}?` : `Block ${firstName}?`}
        description={
          blocked
            ? `${firstName} will be able to message you and send reports again.`
            : "They can still read the chat, but can't send messages."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmBlock(false)} disabled={blocking}>
              Cancel
            </Button>
            <Button variant={blocked ? "primary" : "danger"} onClick={toggleBlock} loading={blocking}>
              {blocked ? "Unblock" : "Block"}
            </Button>
          </>
        }
      >
        {blocked ? <p className="text-[15px] text-ink-2">Their chat, reports and prescriptions stay on record either way.</p> : null}
        {blockError ? <p className="text-[15px] text-danger">{blockError}</p> : null}
      </Dialog>
    </Card>
  );
}

