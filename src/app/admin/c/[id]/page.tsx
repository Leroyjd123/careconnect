import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getConversation, getMessages, getPrescriptions, getAppointments, replacedIds } from "@/lib/data";
import { logAdminConversationView, logAdminFileView } from "@/app/actions/admin";
import { Conversation } from "@/components/chat/Conversation";
import { AdminConversationPopups } from "./AdminConversationPopups";
import { AdminConversationHeader } from "./AdminConversationHeader";

export const metadata: Metadata = { title: "Conversation · Admin" };

type Search = {
  /** The file the admin opened (the report). */
  file?: string;
  /** The prescription the admin opened. "new" with "replaces" opens the correction composer. */
  rx?: string;
  /** The prescription a correction is being written for. */
  replaces?: string;
};

/**
 * The admin's view of one chat (PLAN §7 Phase E, decisions 47–50, 55).
 *
 * The shared Conversation does the work; viewerRole="admin" changes the sender and the
 * actions. Opening the chat writes one audit row, from this server page.
 */
export default async function AdminConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Search>;
}) {
  const admin = await requireProfile("admin");
  const { id } = await params;
  const { file, rx, replaces: replacesId } = await searchParams;

  const conversation = await getConversation(id);
  if (!conversation) notFound();

  const [messages, prescriptions, appointments] = await Promise.all([
    getMessages(id),
    getPrescriptions(id),
    getAppointments(id),
  ]);

  // Decision 55: the admin's views are recorded. One row per chat, from the server page.
  await logAdminConversationView(id);
  // Opening a report is recorded too.
  if (file && messages.some((m) => m.id === file && m.file_path)) {
    await logAdminFileView(file, id);
  }

  const patient = conversation.patient;
  const doctor = conversation.doctor;
  const replaced = replacedIds(prescriptions);
  const base = `/admin/c/${id}`;
  // "?rx=new&replaces=<id>" opens the correction composer for that prescription.
  const replaces = rx === "new" && replacesId ? replacesId : undefined;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4">
      <AdminConversationHeader
        conversationId={id}
        base={base}
        patient={patient}
        doctor={doctor}
        blockedAt={conversation.blocked_at}
        rx={rx}
      />
      <Conversation
        conversationId={id}
        meId={admin.id}
        otherName={patient.full_name}
        initialMessages={messages}
        prescriptions={prescriptions}
        replacedRxIds={replaced}
        meetings={appointments.meetings}
        checkIns={appointments.checkIns}
        viewerRole="admin"
        fileHrefBase={`${base}?file=`}
        rxHrefBase={`${base}?rx=`}
        header={{
          backHref: "/admin/conversations",
          backLabel: "All conversations",
          title: `${patient.full_name} · ${doctor.full_name}`,
          subtitle: doctor.specialty ?? undefined,
        }}
      />
      <AdminConversationPopups
        conversationId={id}
        base={base}
        messages={messages}
        prescriptions={prescriptions}
        replacedRxIds={replaced}
        openFile={file}
        openRx={rx}
        openReplaces={replaces}
      />
    </div>
  );
}
