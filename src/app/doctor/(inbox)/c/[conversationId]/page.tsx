import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PanelRightClose, PanelRightOpen, UserRound } from "lucide-react";
import { LayoutToggle } from "@/components/layout/LayoutToggle";
import { LAYOUT_COOKIES } from "@/lib/constants";
import { requireProfile } from "@/lib/auth";
import { getConversation, getAppointments, getDoctorMeetingsBetween, getMedicineSuggestions, getMessages, getOtherDoctors, getPrescriptions, replacedIds } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Banner } from "@/components/ui/Feedback";
import { Conversation } from "@/components/chat/Conversation";
import { FileViewer } from "@/components/chat/FileViewer";
import { removeReport } from "@/app/actions/messages";
import { PatientPanel } from "@/components/doctor/PatientPanel";
import { PatientPopups } from "@/components/doctor/PatientPopups";
import { cn } from "@/lib/utils";
import type { MedicineOption } from "@/lib/types";

export const metadata: Metadata = { title: "Conversation" };

type Search = {
  file?: string;
  rx?: string;
  issued?: string;
  /** "meeting" or "check_in" for a new one, an id for an existing one. */
  appt?: string;
};

/**
 * Desktop: inbox list (from the layout) | conversation | patient panel.
 * Phone: the chat, and the patient panel opens as a sheet from the chat header.
 */
export default async function DoctorConversation({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<Search>;
}) {
  const doctor = await requireProfile("doctor");
  const { conversationId } = await params;
  // "?appt=" is read by PatientPopups from the URL; the page only needs to know that
  // the query string changed, which Next.js handles by re-rendering this page.
  const { file, rx, issued } = await searchParams;

  const conversation = await getConversation(conversationId);
  if (!conversation || conversation.doctor_id !== doctor.id) notFound();

  const [messages, prescriptions, suggestions, otherDoctors, appointments, otherDoctorMeetings] = await Promise.all([
    getMessages(conversationId),
    getPrescriptions(conversationId),
    rx ? getMedicineSuggestions() : Promise.resolve<MedicineOption[]>([]),
    // Names only, and only when the "also consults" setting is on (decision 26).
    getOtherDoctors(conversation.patient_id),
    getAppointments(conversationId),
    // The doctor's own other meetings, for the overlap warning (decision 41).
    getDoctorMeetingsBetween(
      new Date(Date.now() - 86_400_000).toISOString(),
      new Date(Date.now() + 30 * 86_400_000).toISOString(),
    ),
  ]);

  const patient = conversation.patient;
  const firstName = patient.full_name.trim().split(/\s+/)[0] || "your patient";
  const replaced = replacedIds(prescriptions);
  const base = `/doctor/c/${conversationId}`;

  const openFile = file ? messages.find((m) => m.id === file && m.file_path) : undefined;
  // Desktop: the doctor can hide the patient column to give the chat the full width.
  const panelHidden = (await cookies()).get(LAYOUT_COOKIES.panel)?.value === "on";
  const reportMessages = [...messages].reverse().filter((m) => m.kind === "file" && !m.deleted_at);
  // The next meeting and the next check-in for the panel's "Next up" section.
  const now = Date.now();
  const nextMeeting = appointments.meetings.find((m) => m.status === "scheduled" && Date.parse(m.starts_at) >= now) ?? null;
  const nextCheckIn = appointments.checkIns.find((c) => c.status === "scheduled") ?? null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 gap-4">
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        {issued ? <Banner tone="success">Prescription issued. {firstName} can see it in chat and under Prescriptions.</Banner> : null}
        <Card tone="subtle" className="flex min-h-0 flex-1 flex-col p-3">
          <Conversation
            conversationId={conversationId}
            meId={doctor.id}
            otherName={patient.full_name}
            initialMessages={messages}
            prescriptions={prescriptions}
            replacedRxIds={replaced}
            meetings={appointments.meetings}
            checkIns={appointments.checkIns}
            viewerRole="doctor"
            apptHrefBase={`${base}?appt=`}
            fileHrefBase={`${base}?file=`}
            rxHrefBase={`${base}?rx=`}
            correctionHrefBase={`${base}?rx=new&replaces=`}
            readOnlyNotice={doctor.deactivated_at ? "Your account is deactivated. Contact CareConnect to send messages again." : undefined}
            header={{
              backHref: "/doctor",
              backLabel: "Back to the inbox",
              leading: <Avatar name={patient.full_name} seed={patient.id} pending={patient.status === "invited"} />,
              title: patient.full_name,
              subtitle: patient.status === "invited" ? "Invite pending" : patient.email,
              actions: (
                <>
                  <ButtonLink href={`${base}?panel=1`} variant="soft" size="sm" className="lg:hidden">
                    <UserRound aria-hidden="true" className="size-4" />
                    Patient
                  </ButtonLink>
                  <LayoutToggle
                    cookie={LAYOUT_COOKIES.panel}
                    on={panelHidden}
                    labelOn="Show patient details"
                    labelOff="Hide patient details"
                    iconOn={<PanelRightOpen className="size-5" />}
                    iconOff={<PanelRightClose className="size-5" />}
                    className="hidden lg:inline-flex"
                  />
                </>
              ),
            }}
          />
        </Card>
        {openFile ? <FileViewer message={openFile} backHref={base} replyHref={base} onRemove={removeReport.bind(null, openFile.id, conversationId)} className="absolute inset-0 z-10" /> : null}
      </div>

      {/* Desktop: the patient column. On a phone the same panel opens as a sheet (below). */}
      <div className={cn("hidden min-h-0 w-full shrink-0 flex-col lg:w-[380px]", panelHidden ? "lg:hidden" : "lg:flex")}>
        <PatientPanel
          conversationId={conversationId}
          patient={patient}
          blockedAt={conversation.blocked_at}
          prescriptions={prescriptions}
          replacedRxIds={replaced}
          reports={reportMessages}
          otherDoctors={otherDoctors}
          nextMeeting={nextMeeting}
          nextCheckIn={nextCheckIn}
        />
      </div>

      {/* The popups live here, outside the patient column: a native <dialog> inside a
          display:none ancestor is not painted, and the column hides itself on a phone. */}
      <PatientPopups
        conversationId={conversationId}
        patient={patient}
        blockedAt={conversation.blocked_at}
        prescriptions={prescriptions}
        replacedRxIds={replaced}
        reports={reportMessages}
        otherDoctors={otherDoctors}
        suggestions={suggestions}
        meetings={appointments.meetings}
        checkIns={appointments.checkIns}
        otherDoctorMeetings={otherDoctorMeetings}
      />
    </div>
  );
}
