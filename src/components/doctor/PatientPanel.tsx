"use client";

import { useState } from "react";
import { FilePlus2, FileText, Paperclip } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { Segmented } from "@/components/ui/Segmented";
import { FileCard } from "@/components/chat/FileCard";
import { PrescriptionCard } from "@/components/rx/PrescriptionCard";
import { formatDate, formatDay, formatTime } from "@/lib/utils";
import type { Message, PrescriptionWithPeople, Profile } from "@/lib/types";

type PatientPanelProps = {
  conversationId: string;
  patient: Profile;
  prescriptions: PrescriptionWithPeople[];
  /** Prescription ids a newer issued one has replaced. */
  replacedRxIds: string[];
  /** The file messages in this conversation, newest first. */
  reports: Message[];
};

/** The doctor's right-hand column: who this is, plus their reports and prescriptions. */
export function PatientPanel({ conversationId, patient, prescriptions, replacedRxIds, reports }: PatientPanelProps) {
  const [tab, setTab] = useState<"reports" | "prescriptions">("reports");
  const replaced = new Set(replacedRxIds);
  const invited = patient.status === "invited";

  return (
    <Card tone="subtle" className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <Avatar name={patient.full_name} seed={patient.id} size="lg" ring pending={invited} />
        <div className="flex flex-col">
          <span className="text-[17px] font-semibold tracking-tight">{patient.full_name}</span>
          {patient.email || patient.phone ? <span className="text-[13px] text-ink-2">{patient.email ?? patient.phone}</span> : null}
          <span className="text-[13px] text-ink-2">
            {invited ? "Invite pending" : `Joined ${formatDate(patient.activated_at ?? patient.created_at)}`}
          </span>
        </div>
      </div>

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
