"use client";

import { useState } from "react";
import { Ban, FilePlus2, FileText, Paperclip, Pencil, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { setPatientBlocked, updatePatientDetails } from "@/app/actions/patients";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { PatientDetailsDialog } from "@/components/doctor/PatientDetailsDialog";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { Segmented } from "@/components/ui/Segmented";
import { FileCard } from "@/components/chat/FileCard";
import { PrescriptionCard } from "@/components/rx/PrescriptionCard";
import { ageFrom, formatDate, formatDay, formatTime } from "@/lib/utils";
import type { Message, PrescriptionWithPeople, Profile } from "@/lib/types";

type PatientPanelProps = {
  conversationId: string;
  patient: Profile;
  prescriptions: PrescriptionWithPeople[];
  /** Prescription ids a newer issued one has replaced. */
  replacedRxIds: string[];
  /** The file messages in this conversation, newest first. */
  reports: Message[];
  /** Only overridden by /styleguide. */
  saveAction?: typeof updatePatientDetails;
  blockAction?: typeof setPatientBlocked;
};

/** The doctor's right-hand column: who this is, plus their reports and prescriptions. */
export function PatientPanel({
  conversationId,
  patient,
  prescriptions,
  replacedRxIds,
  reports,
  saveAction = updatePatientDetails,
  blockAction = setPatientBlocked,
}: PatientPanelProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"reports" | "prescriptions">("reports");
  const [editing, setEditing] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const replaced = new Set(replacedRxIds);
  const invited = patient.status === "invited";
  const blocked = !!patient.blocked_at;
  const firstName = patient.full_name.trim().split(/\s+/)[0] || "this patient";
  const facts = [
    patient.date_of_birth ? `${ageFrom(patient.date_of_birth)} yrs · born ${formatDate(patient.date_of_birth)}` : null,
    patient.height_cm ? `${patient.height_cm} cm` : null,
    patient.weight_kg ? `${patient.weight_kg} kg` : null,
  ].filter(Boolean);

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
    <Card tone="subtle" className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <Avatar name={patient.full_name} seed={patient.id} size="lg" ring pending={invited} />
        <div className="flex flex-col">
          <span className="text-[17px] font-semibold tracking-tight">{patient.full_name}</span>
          {patient.email ? <span className="text-[13px] text-ink-2">{patient.email}</span> : null}
          {patient.phone ? <span className="text-[13px] text-ink-2">{patient.phone}</span> : null}
          <span className="text-[13px] text-ink-2">
            {invited ? "Invite pending" : `Joined ${formatDate(patient.activated_at ?? patient.created_at)}`}
          </span>
          {facts.length ? <span className="mt-1 text-[13px] font-semibold text-ink">{facts.join(" · ")}</span> : null}
        </div>
        {blocked ? (
          <Badge tone="danger" icon={<Ban aria-hidden="true" />}>
            Blocked
          </Badge>
        ) : null}
        <div className="flex flex-wrap justify-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil aria-hidden="true" className="size-4" />
            Edit details
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmBlock(true)}>
            {blocked ? <UserCheck aria-hidden="true" className="size-4" /> : <Ban aria-hidden="true" className="size-4" />}
            {blocked ? "Activate" : "Block"}
          </Button>
        </div>
      </div>

      {editing ? <PatientDetailsDialog patient={patient} open onClose={() => setEditing(false)} saveAction={saveAction} /> : null}
      <Dialog
        open={confirmBlock}
        onClose={() => setConfirmBlock(false)}
        title={blocked ? `Activate ${firstName}?` : `Block ${firstName}?`}
        description={
          blocked
            ? `${firstName} will be able to sign in, message you and send reports again.`
            : `${firstName} won't be able to sign in, message you or send reports. Their chat, reports and prescriptions stay on record. You can activate them again at any time.`
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmBlock(false)} disabled={blocking}>
              Cancel
            </Button>
            <Button variant={blocked ? "primary" : "danger"} onClick={toggleBlock} loading={blocking}>
              {blocked ? "Activate" : "Block patient"}
            </Button>
          </>
        }
      >
        {blockError ? <p className="text-[15px] text-danger">{blockError}</p> : null}
      </Dialog>

      <ButtonLink href={`/doctor/c/${conversationId}?rx=new`} variant="soft" block>
        <FilePlus2 aria-hidden="true" className="size-[18px]" />
        New prescription
      </ButtonLink>

      <Segmented
        label="Patient details"
        value={tab}
        onChange={setTab}
        options={[
          { value: "reports", label: `Reports${reports.length ? ` · ${reports.length}` : ""}` },
          { value: "prescriptions", label: `Prescriptions${prescriptions.length ? ` · ${prescriptions.length}` : ""}` },
        ]}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto">
        {tab === "reports" ? (
          reports.length === 0 ? (
            <EmptyState icon={Paperclip} title="No reports yet">
              Anything {patient.full_name.trim().split(/\s+/)[0]} sends will show up here.
            </EmptyState>
          ) : (
            reports.map((m) => (
              <FileCard
                key={m.id}
                name={m.file_name ?? "Attachment"}
                type={m.file_type}
                meta={`${formatDay(m.created_at)}, ${formatTime(m.created_at)}`}
                href={`/doctor/c/${conversationId}?file=${m.id}`}
              />
            ))
          )
        ) : prescriptions.length === 0 ? (
          <EmptyState icon={FileText} title="No prescriptions yet" action={<ButtonLink href={`/doctor/c/${conversationId}?rx=new`}>Write one</ButtonLink>}>
            Drafts stay private until you issue them.
          </EmptyState>
        ) : (
          prescriptions.map((rx) => {
            const isDraft = rx.status === "draft";
            return (
              <PrescriptionCard
                key={rx.id}
                draft={isDraft}
                issuedAt={isDraft ? undefined : (rx.issued_at ?? rx.created_at)}
                medicines={(rx.prescription_items ?? []).map((i) => i.medicine)}
                replaced={replaced.has(rx.id)}
                actions={
                  <>
                    <ButtonLink href={`/doctor/c/${conversationId}?rx=${rx.id}`} variant="outline" size="sm">
                      {isDraft ? "Continue draft" : "View"}
                    </ButtonLink>
                    {isDraft || replaced.has(rx.id) ? null : (
                      <ButtonLink href={`/doctor/c/${conversationId}?rx=new&replaces=${rx.id}`} variant="soft" size="sm">
                        Issue a correction
                      </ButtonLink>
                    )}
                  </>
                }
              />
            );
          })
        )}
      </div>
    </Card>
  );
}
