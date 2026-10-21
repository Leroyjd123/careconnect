import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FilePlus2 } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getConversation, getMedicineSuggestions, getMessages, getPrescriptions, replacedIds } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Banner } from "@/components/ui/Feedback";
import { Conversation } from "@/components/chat/Conversation";
import { FileViewer } from "@/components/chat/FileViewer";
import { removeReport } from "@/app/actions/messages";
import { PatientPanel } from "@/components/doctor/PatientPanel";
import { PrescriptionComposer } from "@/components/rx/PrescriptionComposer";
import { PrescriptionView } from "@/components/rx/PrescriptionView";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Conversation" };

type Search = { file?: string; rx?: string; replaces?: string; issued?: string };

/**
 * Desktop: inbox list (from the layout) | conversation | patient or prescription panel.
 * Phone: one of those at a time, chosen by the query string.
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
  const { file, rx, replaces, issued } = await searchParams;

  const conversation = await getConversation(conversationId);
  if (!conversation || conversation.doctor_id !== doctor.id) notFound();

  const [messages, prescriptions, suggestions] = await Promise.all([
    getMessages(conversationId),
    getPrescriptions(conversationId),
    rx ? getMedicineSuggestions() : Promise.resolve<string[]>([]),
  ]);

  const patient = conversation.patient;
  const firstName = patient.full_name.trim().split(/\s+/)[0] || "your patient";
  const replaced = replacedIds(prescriptions);
  const base = `/doctor/c/${conversationId}`;

  const openFile = file ? messages.find((m) => m.id === file && m.file_path) : undefined;
  const openRx = rx && rx !== "new" ? prescriptions.find((p) => p.id === rx) : undefined;
  const replacesRx = replaces ? prescriptions.find((p) => p.id === replaces) : undefined;
  const composing = rx === "new" || openRx?.status === "draft";

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      <div className={cn("relative flex min-h-0 flex-1 flex-col gap-2", rx && "hidden lg:flex")}>
        {issued ? <Banner tone="success">Prescription issued. {firstName} can see it in chat and under Prescriptions.</Banner> : null}
        <Card tone="subtle" className="flex min-h-0 flex-1 flex-col p-3">
          <Conversation
            conversationId={conversationId}
            meId={doctor.id}
            otherName={patient.full_name}
            initialMessages={messages}
            prescriptions={prescriptions}
            replacedRxIds={replaced}
            fileHrefBase={`${base}?file=`}
            rxHrefBase={`${base}?rx=`}
            correctionHrefBase={`${base}?rx=new&replaces=`}
            header={{
              backHref: "/doctor",
              backLabel: "Back to the inbox",
              leading: <Avatar name={patient.full_name} seed={patient.id} pending={patient.status === "invited"} />,
              title: patient.full_name,
              subtitle: patient.status === "invited" ? "Invite pending" : patient.email,
              actions: (
                <ButtonLink href={`${base}?rx=new`} variant="soft" size="sm" className="lg:hidden">
                  <FilePlus2 aria-hidden="true" className="size-4" />
                  Prescribe
                </ButtonLink>
              ),
            }}
          />
        </Card>
        {openFile ? <FileViewer message={openFile} backHref={base} replyHref={base} onRemove={removeReport.bind(null, openFile.id, conversationId)} className="absolute inset-0 z-10" /> : null}
      </div>

      <div className={cn("min-h-0 w-full shrink-0 flex-col lg:w-[380px] lg:flex", rx ? "flex" : "hidden")}>
        {composing ? (
          <PrescriptionComposer
            conversationId={conversationId}
            patient={patient}
            draft={openRx ?? null}
            replaces={replacesRx ?? null}
            suggestions={suggestions}
            closeHref={base}
          />
        ) : openRx ? (
          <Card tone="subtle" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
            <PrescriptionView
              prescription={openRx}
              replaced={replaced.includes(openRx.id)}
              actions={
                <>
                  <ButtonLink href={`/rx/${openRx.id}/print`} target="_blank" variant="secondary" block>
                    Open print view
                  </ButtonLink>
                  <ButtonLink href={base} variant="ghost" block>
                    Back to the conversation
                  </ButtonLink>
                </>
              }
            />
          </Card>
        ) : (
          <PatientPanel
            conversationId={conversationId}
            patient={patient}
            prescriptions={prescriptions}
            replacedRxIds={replaced}
            reports={[...messages].reverse().filter((m) => m.kind === "file" && !m.deleted_at)}
          />
        )}
      </div>
    </div>
  );
}
