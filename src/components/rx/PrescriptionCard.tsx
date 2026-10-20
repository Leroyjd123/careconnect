import type { ReactNode } from "react";
import { FileText, Lock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, formatDate } from "@/lib/utils";

type PrescriptionCardProps = {
  /** Left out for a draft, which has no issue date yet. */
  issuedAt?: string;
  medicines: string[];
  /** Buttons/links under the card: "View prescription", "Issue a correction". */
  actions?: ReactNode;
  /** Doctor's unissued draft: dashed outline, "Not sent". */
  draft?: boolean;
  replaced?: boolean;
  /** Newest issued prescription, in the patient's list. */
  latest?: boolean;
};

/**
 * The prescription card that appears in chat (both sides), the doctor's panel and the
 * patient's list. Issued prescriptions are locked, so this card is read-only by design.
 */
export function PrescriptionCard({ issuedAt, medicines, actions, draft, replaced, latest }: PrescriptionCardProps) {
  const count = `${medicines.length} ${medicines.length === 1 ? "medicine" : "medicines"}`;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-[22px] border p-4",
        draft ? "border-dashed border-sage bg-white/70" : "border-white bg-white/90 shadow-lift",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-[14px]",
            draft ? "bg-mint-200 text-forest" : "bg-forest text-white",
          )}
        >
          <FileText aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-base font-semibold">{draft ? "Draft prescription" : "Prescription"}</span>
          <span className="text-[13px] text-ink-2">{issuedAt ? `${formatDate(issuedAt)} · ${count}` : count}</span>
        </div>
        {draft ? (
          <Badge tone="outline">Not sent</Badge>
        ) : replaced ? (
          <Badge tone="outline">Replaced</Badge>
        ) : latest ? (
          <Badge tone="solid">Latest</Badge>
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
