import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DoseSchedule } from "@/components/rx/DoseSchedule";
import { cn, formatDate } from "@/lib/utils";
import type { PrescriptionWithPeople } from "@/lib/types";

type PrescriptionViewProps = {
  prescription: PrescriptionWithPeople;
  replaced?: boolean;
  /** "print" drops the glass and the dose grid for a plain A4 sheet. */
  variant?: "screen" | "print";
  actions?: ReactNode;
};

/** The full read-only prescription. Patient detail, the doctor's panel and the print page all use this. */
export function PrescriptionView({ prescription, replaced, variant = "screen", actions }: PrescriptionViewProps) {
  const { doctor, patient, prescription_items: items = [] } = prescription;
  const print = variant === "print";
  const date = prescription.issued_at ?? prescription.created_at;

  return (
    <div className="flex flex-col gap-4">
      <Card
        tone={print ? "solid" : "glass"}
        className={cn("flex flex-col gap-3 p-5", print && "border-0 shadow-none")}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[19px] font-semibold tracking-tight">{doctor.full_name}</span>
            {doctor.specialty ? <span className="text-sm text-ink-2">{doctor.specialty}</span> : null}
            <span className="text-sm text-ink-2">Reg. no. {doctor.reg_no || "[REG NO]"}</span>
          </div>
          {prescription.status === "draft" ? (
            <Badge tone="outline">Draft · not sent</Badge>
          ) : replaced ? (
            <Badge tone="outline">Replaced</Badge>
          ) : (
            <Badge tone="brand" icon={<Lock aria-hidden="true" />}>
              Issued
            </Badge>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-3 border-t border-line-soft pt-3 text-[15px]">
          <div>
            <dt className="text-[13px] text-ink-2">Patient</dt>
            <dd className="font-semibold">{patient.full_name}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-ink-2">Date</dt>
            <dd className="font-semibold">{formatDate(date)}</dd>
          </div>
        </dl>
        {prescription.diagnosis ? (
          <div className="border-t border-line-soft pt-3">
            <p className="text-[13px] text-ink-2">Diagnosis</p>
            <p className="text-[15px] leading-relaxed">{prescription.diagnosis}</p>
          </div>
        ) : null}
      </Card>

      <section className="flex flex-col gap-3" aria-label="Medicines">
        <h2 className="px-1 text-[13px] font-semibold tracking-wider text-ink-3 uppercase">
          {items.length} {items.length === 1 ? "medicine" : "medicines"}
        </h2>
        {items.map((item) => (
          <Card key={item.id} tone="solid" className={cn("flex flex-col gap-2.5 p-4", print && "shadow-none")}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[17px] font-semibold">{item.medicine}</span>
              <span className="shrink-0 text-[13px] text-ink-2">{item.duration}</span>
            </div>
            <p className="text-[15px]">
              {item.dose}
              {item.timing ? ` · ${item.timing.toLowerCase()}` : null}
            </p>
            {print ? <p className="text-[15px] text-ink-2">{item.frequency}</p> : <DoseSchedule frequency={item.frequency} />}
          </Card>
        ))}
      </section>

      {prescription.advice ? (
        <Card tone={print ? "solid" : "glass"} className={cn("flex flex-col gap-1 p-5", print && "shadow-none")}>
          <p className="text-[13px] font-semibold tracking-wider text-ink-3 uppercase">Doctor&apos;s advice</p>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{prescription.advice}</p>
        </Card>
      ) : null}

      {actions ? <div className="flex flex-col gap-2.5">{actions}</div> : null}
    </div>
  );
}
