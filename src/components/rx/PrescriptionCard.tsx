import type { ReactNode } from "react";
import { FileText, Lock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

type PrescriptionCardProps = {
  issuedAt: string;
  medicines: string[];
  /** Buttons/links under the card: "View prescription", "Issue a correction". */
  actions?: ReactNode;
  replaced?: boolean;
};

/**
 * The prescription card that appears in chat (both sides) and on the patient's list.
 * Issued prescriptions are locked, so this card is read-only by design.
 */
export function PrescriptionCard({ issuedAt, medicines, actions, replaced }: PrescriptionCardProps) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-[22px] border border-white bg-white/90 p-4 shadow-lift">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-forest text-white">
          <FileText aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-base font-semibold">Prescription</span>
          <span className="text-[13px] text-ink-2">
            {formatDate(issuedAt)} · {medicines.length} {medicines.length === 1 ? "medicine" : "medicines"}
          </span>
        </div>
        {replaced ? (
          <Badge tone="outline">Replaced</Badge>
        ) : (
          <Badge tone="brand" icon={<Lock aria-hidden="true" />}>
            Issued
          </Badge>
        )}
      </div>
      {medicines.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {medicines.map((m) => (
            <li key={m} className="rounded-[10px] bg-mint px-2.5 py-1 text-[13px]">
              {m}
            </li>
          ))}
        </ul>
      ) : null}
      {actions ? <div className="flex gap-2 [&>*]:flex-1">{actions}</div> : null}
    </div>
  );
}
