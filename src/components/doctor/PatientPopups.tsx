"use client";

import { useEffect, useState } from "react";
import { FileText, Paperclip } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { FileCard } from "@/components/chat/FileCard";
import { AppointmentDialog } from "@/components/chat/AppointmentDialog";
import { PrescriptionCard } from "@/components/rx/PrescriptionCard";
import { PrescriptionComposer } from "@/components/rx/PrescriptionComposer";
import { PrescriptionView } from "@/components/rx/PrescriptionView";
import { PatientDetailsDialog } from "@/components/doctor/PatientDetailsDialog";
import { PatientPanel } from "@/components/doctor/PatientPanel";
import { formatDate, formatDay, formatTime } from "@/lib/utils";
import type { CheckIn, Meeting, MedicineOption, Message, OtherDoctor, PrescriptionWithPeople, Profile } from "@/lib/types";

type PatientPopupsProps = {
  conversationId: string;
  patient: Profile;
  /** This conversation's block (0005). Blocking is per doctor, not per account. */
  blockedAt?: string | null;
  prescriptions: PrescriptionWithPeople[];
  /** Prescription ids a newer issued one has replaced. */
  replacedRxIds: string[];
  /** The file messages in this conversation, newest first. */
  reports: Message[];
  /** The patient's other doctors, by name only (decision 26). */
  otherDoctors?: OtherDoctor[];
  /** The doctor's master medicines, for the prescription popup. */
  suggestions?: MedicineOption[];
  /** The meetings and check-ins of this conversation. */
  meetings?: Meeting[];
  checkIns?: CheckIn[];
  /** The doctor's other meetings, for the overlap warning (decision 41). */
  otherDoctorMeetings?: Meeting[];
  /** Only overridden by /styleguide. */
  blockAction?: (patientId: string, blocked: boolean) => Promise<{ ok: true } | { ok: false; error: string }>;
};

/**
 * The doctor's popups for one patient (decision 73). Every popup is opened by the query
 * string, so a link works, a reload works and Back works. Closing replaces the URL, so
 * the history never fills up with popups.
 *
 * This sits outside the patient column on purpose: a native <dialog> inside a
 * display:none ancestor is not painted, so the popups live in the page, not in the
 * column that hides itself on a phone.
 */
export function PatientPopups({
  conversationId,
  patient,
  blockedAt = null,
  prescriptions,
  replacedRxIds,
  reports,
  otherDoctors = [],
  suggestions = [],
  meetings = [],
  checkIns = [],
  otherDoctorMeetings = [],
  blockAction,
}: PatientPopupsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const replaced = new Set(replacedRxIds);
  const firstName = patient.full_name.trim().split(/\s+/)[0] || "this patient";
  const base = `/doctor/c/${conversationId}`;

  const rxParam = search.get("rx");
  const replacesParam = search.get("replaces");
  const apptParam = search.get("appt");
  const detailsOpen = search.get("details") === "1";
  const listOpen = search.get("prescriptions") === "1";
  const reportsOpen = search.get("reports") === "1";
  const panelParam = search.get("panel") === "1";
  // The patient sheet is the phone's version of the column. On a wide screen the column
  // is already there, so the sheet stays closed and the column does the work.
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const panelOpen = panelParam && isPhone;
  // The prescription the popup shows: an issued one to read, or a draft to continue.
  const openRx = rxParam && rxParam !== "new" ? prescriptions.find((p) => p.id === rxParam) : undefined;
  // The issued prescription a correction starts from.
  const replacesRx = replacesParam ? prescriptions.find((p) => p.id === replacesParam) : undefined;
  // "?rx=new" continues the newest plain draft, so closing the popup keeps the work.
  const newDraft = rxParam === "new" && !replacesRx ? prescriptions.find((p) => p.status === "draft" && !p.replaces_id) : undefined;
  // A draft is edited; an issued one is only read.
  const editingDraft = rxParam === "new" ? (newDraft ?? null) : openRx?.status === "draft" ? openRx : null;
  const readingRx = rxParam !== "new" && openRx && openRx.status !== "draft" ? openRx : null;
  // The appointment the popup opens: "meeting" or "check_in" for a new one, an id for an
  // existing one (it may be either kind).
  const apptMeeting = meetings.find((m) => m.id === apptParam) ?? null;
  const apptCheckIn = checkIns.find((c) => c.id === apptParam) ?? null;
  const apptType: "meeting" | "check_in" = apptParam === "check_in" ? "check_in" : apptParam === "meeting" ? "meeting" : apptCheckIn && !apptMeeting ? "check_in" : "meeting";

  /** Closing a popup replaces the URL, so the history never fills up with popups. */
  function closePopup() {
    router.replace(pathname);
  }

  return (
    <>

      {/* On a phone the patient column is gone, so the same panel opens as a sheet. */}
      {panelOpen ? (
        <Dialog
          open
          onClose={closePopup}
          size="lg"
          variant="sheet"
          title={patient.full_name}
          description="Patient details"
        >
          <PatientPanel
            conversationId={conversationId}
            patient={patient}
            blockedAt={blockedAt}
            prescriptions={prescriptions}
            replacedRxIds={replacedRxIds}
            reports={reports}
            otherDoctors={otherDoctors}
            variant="sheet"
            blockAction={blockAction}
          />
        </Dialog>
      ) : null}

      {/* Write a prescription, read one, or correct one. */}
      {rxParam ? (
        <Dialog
          open
          onClose={closePopup}
          size="lg"
          title={readingRx ? "Prescription" : replacesRx ? "Correction" : editingDraft ? "Prescription draft" : "New prescription"}
          description={
            readingRx
              ? `Issued ${formatDate(readingRx.issued_at ?? readingRx.created_at)}.`
              : replacesRx
                ? `This replaces the prescription from ${formatDay(replacesRx.issued_at ?? replacesRx.created_at)}. Both stay on record.`
                : `${patient.full_name}. Nothing reaches them until you issue it.`
          }
        >
          {readingRx ? (
            <PrescriptionView
              prescription={readingRx}
              replaced={replaced.has(readingRx.id)}
              actions={
                <>
                  <ButtonLink href={`/rx/${readingRx.id}/print`} target="_blank" variant="secondary" block>
                    Open print view
                  </ButtonLink>
                  {replaced.has(readingRx.id) ? null : (
                    <ButtonLink href={`${base}?rx=new&replaces=${readingRx.id}`} variant="soft" block>
                      Issue a correction
                    </ButtonLink>
                  )}
                </>
              }
            />
          ) : (
            <PrescriptionComposer
              conversationId={conversationId}
              patient={patient}
              draft={editingDraft}
              replaces={replacesRx ?? null}
              suggestions={suggestions}
              closeHref={base}
            />
          )}
        </Dialog>
      ) : null}

      {/* Schedule a meeting or a check-in, or manage an existing one. */}
      {apptParam ? (
        <AppointmentDialog
          conversationId={conversationId}
          type={apptType}
          meeting={apptMeeting}
          checkIn={apptCheckIn}
          otherMeetings={otherDoctorMeetings}
          closeHref={base}
        />
      ) : null}

      {/* Edit the patient's details. */}
      {detailsOpen ? <PatientDetailsDialog patient={patient} open onClose={closePopup} /> : null}

      {/* Every prescription in this conversation. */}
      {listOpen ? (
        <Dialog open onClose={closePopup} size="lg" title="All prescriptions" description={`${prescriptions.length} in this chat.`}>
          {prescriptions.length === 0 ? (
            <EmptyState icon={FileText} title="No prescriptions yet">
              Drafts stay private until you issue them.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {prescriptions.map((rx) => (
                <li key={rx.id}>
                  <PrescriptionCard
                    draft={rx.status === "draft"}
                    issuedAt={rx.status === "draft" ? undefined : (rx.issued_at ?? rx.created_at)}
                    medicines={(rx.prescription_items ?? []).map((i) => i.medicine)}
                    replaced={replaced.has(rx.id)}
                    cancelled={!!rx.cancelled_at}
                    actions={
                      <ButtonLink href={`${base}?rx=${rx.id}`} variant="outline" size="sm">
                        {rx.status === "draft" ? "Continue draft" : "View"}
                      </ButtonLink>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </Dialog>
      ) : null}

      {/* Every report in this conversation. */}
      {reportsOpen ? (
        <Dialog open onClose={closePopup} size="lg" title="All reports" description={`${reports.length} in this chat.`}>
          {reports.length === 0 ? (
            <EmptyState icon={Paperclip} title="No reports yet">
              Anything {firstName} sends will show up here.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {reports.map((m) => (
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
          )}
        </Dialog>
      ) : null}
    </>
  );
}
