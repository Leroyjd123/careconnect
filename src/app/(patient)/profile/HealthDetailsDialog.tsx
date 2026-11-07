"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMyHealthDetails } from "@/app/actions/profile";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, FieldError, TextInput } from "@/components/ui/Field";
import type { HealthDetailsInput } from "@/lib/utils";

type HealthDetailsDialogProps = {
  /** The patient's current values. */
  details: HealthDetailsInput;
  open: boolean;
  onClose: () => void;
  /** Only overridden by /styleguide. */
  saveAction?: typeof updateMyHealthDetails;
};

/**
 * The patient edits their own date of birth, height and weight (decision 28).
 * The same rules the doctor uses, from lib/utils.ts.
 */
export function HealthDetailsDialog({ details, open, onClose, saveAction = updateMyHealthDetails }: HealthDetailsDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<HealthDetailsInput>(details);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<HealthDetailsInput>) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    setSaving(true);
    setError(null);
    const result = await saveAction(form);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit your health details"
      description="Your doctor sees these too, so keep them up to date."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save details
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Field id="hd-dob" label="Date of birth" optional>
          <TextInput
            id="hd-dob"
            type="date"
            value={form.dateOfBirth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => set({ dateOfBirth: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="hd-height" label="Height (cm)" optional>
            <TextInput id="hd-height" inputMode="decimal" value={form.heightCm} onChange={(e) => set({ heightCm: e.target.value })} placeholder="170" />
          </Field>
          <Field id="hd-weight" label="Weight (kg)" optional>
            <TextInput id="hd-weight" inputMode="decimal" value={form.weightKg} onChange={(e) => set({ weightKg: e.target.value })} placeholder="70" />
          </Field>
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
        <input type="submit" hidden />
      </form>
    </Dialog>
  );
}
