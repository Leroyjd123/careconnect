"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createAdminCorrectionDraft } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Banner } from "@/components/ui/Feedback";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { MedicineFields } from "@/components/rx/MedicineFields";
import type { DraftItem, PrescriptionWithPeople } from "@/lib/types";

const EMPTY_ITEM: DraftItem = { medicine: "", dose: "", frequency: "", duration: "", timing: null };

type Props = {
  conversationId: string;
  /** The issued prescription this correction replaces. */
  replaces: PrescriptionWithPeople;
  /** Where the popup closes to. */
  closeHref: string;
};

/**
 * The admin writes a correction of an issued prescription, on the doctor's behalf (Q-C).
 *
 * The correction is saved as a DRAFT with the conversation's doctor as its doctor, so the
 * doctor sees it in their own panel and issues it from there. Only the doctor can issue:
 * issue_prescription() checks who is signed in.
 */
export function AdminCorrectionDialog({ conversationId, replaces, closeHref }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<DraftItem[]>(() => {
    const existing = (replaces.prescription_items ?? []).map((i) => ({
      medicine: i.medicine,
      dose: i.dose,
      frequency: i.frequency,
      duration: i.duration,
      timing: i.timing,
    }));
    return existing.length ? existing : [EMPTY_ITEM];
  });
  const [diagnosis, setDiagnosis] = useState(replaces.diagnosis ?? "");
  const [advice, setAdvice] = useState(replaces.advice ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(index: number, item: DraftItem) {
    setItems((prev) => prev.map((it, i) => (i === index ? item : it)));
  }

  async function save() {
    setBusy(true);
    setError(null);
    const result = await createAdminCorrectionDraft({
      conversationId,
      replacesId: replaces.id,
      items,
      diagnosis,
      advice,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(closeHref);
    router.refresh();
  }

  return (
    <Dialog
      open
      closeHref={closeHref}
      size="lg"
      title="Write a correction"
      description={`This corrects the prescription from ${replaces.doctor.full_name}. The doctor sends it to the patient.`}
      footer={
        <>
          <Button variant="ghost" onClick={() => router.push(closeHref)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void save()} disabled={busy}>
            Save correction
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? <Banner tone="danger">{error}</Banner> : null}

        <Field id="correction-diagnosis" label="Diagnosis">
          <TextInput id="correction-diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="What is being treated" />
        </Field>

        <Field id="correction-advice" label="Advice">
          <TextArea id="correction-advice" value={advice} onChange={(e) => setAdvice(e.target.value)} rows={3} placeholder="Any notes for the patient" />
        </Field>

        <div className="flex flex-col gap-3">
          <span className="text-[15px] font-semibold">Medicines</span>
          {items.map((item, index) => (
            <MedicineFields
              key={index}
              index={index + 1}
              item={item}
              onChange={(next) => update(index, next)}
              onRemove={
                items.length > 1
                  ? () => setItems((prev) => prev.filter((_, i) => i !== index))
                  : undefined
              }
            />
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}
          >
            <Plus aria-hidden="true" className="size-4" />
            Add a medicine
          </Button>
        </div>

        <p className="text-[14px] text-ink-2">
          The correction is saved as a draft for {replaces.doctor.full_name} to send. Issued prescriptions are never
          changed in place.
        </p>
      </div>
    </Dialog>
  );
}
