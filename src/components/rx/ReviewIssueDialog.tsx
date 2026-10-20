"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Banner } from "@/components/ui/Feedback";
import { FieldError } from "@/components/ui/Field";
import { formatDate } from "@/lib/utils";
import type { DraftItem, Profile } from "@/lib/types";

type ReviewIssueDialogProps = {
  open: boolean;
  /** Back to edit. */
  onClose: () => void;
  patient: Profile;
  items: DraftItem[];
  advice?: string;
  issuing?: boolean;
  error?: string | null;
  onIssue: () => void;
};

/** Last look before a prescription is locked for good. */
export function ReviewIssueDialog({ open, onClose, patient, items, advice, issuing, error, onIssue }: ReviewIssueDialogProps) {
  const firstName = patient.full_name.trim().split(/\s+/)[0] || "Your patient";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Review prescription"
      description="Check it once. Issued prescriptions can't be edited."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={issuing}>
            Back to edit
          </Button>
          <Button onClick={onIssue} loading={issuing}>
            Issue prescription
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-tile bg-mint/80 px-4 py-3">
          <Avatar name={patient.full_name} seed={patient.id} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold">{patient.full_name}</span>
            <span className="text-[13px] text-ink-2">{formatDate(new Date().toISOString())}</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-tile border border-line-soft bg-white">
          <table className="w-full text-left text-[15px]">
            <thead className="bg-mint/70 text-[13px] text-ink-3">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Medicine
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Dose
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  How often
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  How long
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={`${item.medicine}-${i}`} className="border-t border-line-soft align-top">
                  <td className="px-3 py-2.5 font-semibold">
                    {item.medicine}
                    {item.timing ? <span className="block text-[13px] font-normal text-ink-2">{item.timing}</span> : null}
                  </td>
                  <td className="px-3 py-2.5">{item.dose}</td>
                  <td className="px-3 py-2.5">{item.frequency}</td>
                  <td className="px-3 py-2.5">{item.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {advice?.trim() ? (
          <div className="flex flex-col gap-1">
            <p className="text-[13px] font-semibold tracking-wider text-ink-3 uppercase">Advice</p>
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{advice}</p>
          </div>
        ) : null}

        <Banner tone="info">
          {firstName} will see this in their chat and under Prescriptions. Once issued it is locked. To correct it, you issue a new
          version that replaces this one, and both stay on record.
        </Banner>

        {error ? <FieldError>{error}</FieldError> : null}
      </div>
    </Dialog>
  );
}
