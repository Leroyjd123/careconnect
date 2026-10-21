"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { deleteDraft, issuePrescription, saveDraft } from "@/app/actions/prescriptions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Banner } from "@/components/ui/Feedback";
import { Field, FieldError, TextArea } from "@/components/ui/Field";
import { PageHeader } from "@/components/layout/PageHeader";
import { MedicineFields } from "@/components/rx/MedicineFields";
import { ReviewIssueDialog } from "@/components/rx/ReviewIssueDialog";
import { formatDate, formatTime } from "@/lib/utils";
import type { DraftItem, MedicineOption, PrescriptionWithPeople, Profile } from "@/lib/types";
import { addMedicine } from "@/app/actions/medicines";

const EMPTY_ITEM: DraftItem = { medicine: "", dose: "", frequency: "", duration: "", timing: null };
const SUGGESTIONS_ID = "medicine-suggestions";

type PrescriptionComposerProps = {
  conversationId: string;
  patient: Profile;
  /** Draft being continued. Null for a brand new prescription. */
  draft?: PrescriptionWithPeople | null;
  /** Issued prescription this one corrects: its contents are prefilled. */
  replaces?: PrescriptionWithPeople | null;
  /** Medicine names this doctor has used before. */
  /** The doctor's active master medicines (Settings → Master medicines). */
  suggestions: MedicineOption[];
  /** Back link and where to go after issuing, e.g. /doctor/c/<id>. */
  closeHref: string;
};

function itemsFrom(rx: PrescriptionWithPeople | null | undefined): DraftItem[] {
  const items = (rx?.prescription_items ?? []).map((i) => ({
    medicine: i.medicine,
    dose: i.dose,
    frequency: i.frequency,
    duration: i.duration,
    timing: i.timing,
  }));
  return items.length ? items : [EMPTY_ITEM];
}

function isComplete(item: DraftItem) {
  return !!(item.medicine.trim() && item.dose.trim() && item.frequency.trim() && item.duration.trim());
}

/**
 * Draft editor. The same component is the right-hand panel on desktop and a full screen on a phone.
 * Autosaves 1.5 s after the doctor stops typing; nothing reaches the patient until "Issue".
 */
export function PrescriptionComposer({ conversationId, patient, draft, replaces, suggestions, closeHref }: PrescriptionComposerProps) {
  // Names saved to the master list from here, so "Save to my medicines" disappears straight away.
  const [options, setOptions] = useState<MedicineOption[]>(suggestions);
  const router = useRouter();
  const source = draft ?? replaces ?? null;
  const [items, setItems] = useState<DraftItem[]>(() => itemsFrom(source));
  const [diagnosis, setDiagnosis] = useState(source?.diagnosis ?? "");
  const [advice, setAdvice] = useState(source?.advice ?? "");
  const [draftId, setDraftId] = useState<string | null>(draft?.id ?? null);
  const replacesId = draft?.replaces_id ?? replaces?.id ?? null;

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(draft ? draft.updated_at : null);
  const [error, setError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  // One save at a time, so an autosave racing a click can't create two drafts.
  const savingRef = useRef(false);

  const named = items.filter((i) => i.medicine.trim());
  const ready = named.length > 0 && named.every(isComplete);
  const firstName = patient.full_name.trim().split(/\s+/)[0] || "your patient";

  /** Writes the draft. Returns its id, or null when a medicine is still half-filled. */
  const save = useCallback(async (): Promise<string | null> => {
    const rows = items.filter((i) => i.medicine.trim());
    if (rows.some((i) => !isComplete(i))) return null;
    if (savingRef.current) return null;
    savingRef.current = true;
    setSaving(true);
    const result = await saveDraft({
      id: draftId ?? undefined,
      conversationId,
      patientId: patient.id,
      diagnosis,
      advice,
      replacesId,
      items: rows,
    });
    savingRef.current = false;
    setSaving(false);
    setDirty(false);
    if (!result.ok) {
      setError(result.error);
      return null;
    }
    setError(null);
    setSavedAt(new Date().toISOString());
    setDraftId(result.data!.id);
    return result.data!.id;
  }, [items, diagnosis, advice, draftId, conversationId, patient.id, replacesId]);

  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => void save(), 1500);
    return () => clearTimeout(timer);
  }, [dirty, save]);

  function change(next: () => void) {
    next();
    setDirty(true);
  }

  async function issue() {
    setIssuing(true);
    // save() returns null when a row is half-filled, or when an autosave got there first.
    const id = (await save()) ?? (ready ? draftId : null);
    if (!id) {
      setIssuing(false);
      setError(
        ready
          ? "We couldn't save this prescription. Please try again."
          : "Add a dose, how often and for how long for every medicine.",
      );
      return;
    }
    const result = await issuePrescription(id, conversationId);
    setIssuing(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setReviewOpen(false);
    router.push(`${closeHref}?issued=1`);
    router.refresh();
  }

  async function discard() {
    if (draftId) await deleteDraft(draftId, conversationId);
    router.push(closeHref);
    router.refresh();
  }

  return (
    <Card tone="subtle" className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <PageHeader
        backHref={closeHref}
        backLabel="Close the prescription"
        title={draftId ? "Prescription draft" : "New prescription"}
        subtitle={replacesId ? `Correction for ${patient.full_name}` : patient.full_name}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-2">
        <div className="flex items-center gap-3 rounded-tile bg-white/70 px-4 py-3">
          <Avatar name={patient.full_name} seed={patient.id} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold">{patient.full_name}</span>
            <span className="text-[13px] text-ink-2">{formatDate(new Date().toISOString())}</span>
          </div>
        </div>

        {savedAt ? (
          <Banner tone="info">
            Draft · saved {formatTime(savedAt)} · not visible to {firstName}
          </Banner>
        ) : null}
        {replacesId ? <Banner tone="info">This replaces an earlier prescription. Both stay on record.</Banner> : null}

        <Field id="rx-diagnosis" label="Diagnosis or notes" optional>
          <TextArea
            id="rx-diagnosis"
            rows={2}
            value={diagnosis}
            onChange={(e) => change(() => setDiagnosis(e.target.value))}
            placeholder="e.g. Viral fever"
          />
        </Field>

        <datalist id={SUGGESTIONS_ID}>
          {options.map((s) => (
            <option key={s.name} value={s.name}>
              {s.default_dose ?? undefined}
            </option>
          ))}
        </datalist>

        {items.map((item, i) => (
          <MedicineFields
            key={i}
            index={i + 1}
            item={item}
            suggestionsId={SUGGESTIONS_ID}
            options={options}
            onSaveToList={async (name, dose) => {
              const result = await addMedicine({ name, defaultDose: dose });
              if (result.ok) setOptions((prev) => [...prev, { name, default_dose: dose || null }]);
              return result;
            }}
            onChange={(next) => change(() => setItems((prev) => prev.map((p, j) => (j === i ? next : p))))}
            onRemove={items.length > 1 ? () => change(() => setItems((prev) => prev.filter((_, j) => j !== i))) : undefined}
          />
        ))}

        <Button variant="soft" onClick={() => change(() => setItems((prev) => [...prev, EMPTY_ITEM]))}>
          <Plus aria-hidden="true" className="size-4" />
          Add medicine
        </Button>

        <Field id="rx-advice" label="Advice for the patient" optional hint="Rest, diet, when to come back.">
          <TextArea
            id="rx-advice"
            rows={3}
            value={advice}
            onChange={(e) => change(() => setAdvice(e.target.value))}
            placeholder="e.g. Drink plenty of water. Come back if the fever lasts more than 3 days."
          />
        </Field>

        {error ? <FieldError>{error}</FieldError> : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-line-soft pt-3">
        <Button onClick={() => setReviewOpen(true)} disabled={!ready} size="lg">
          Review prescription
        </Button>
        <div className="flex gap-2 [&>*]:flex-1">
          <Button variant="secondary" onClick={() => void save()} loading={saving} disabled={!dirty && !!savedAt}>
            Save draft
          </Button>
          <Button variant="danger" onClick={discard}>
            Discard
          </Button>
        </div>
      </div>

      <ReviewIssueDialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        patient={patient}
        items={named}
        advice={advice}
        issuing={issuing}
        error={error}
        onIssue={issue}
      />
    </Card>
  );
}
