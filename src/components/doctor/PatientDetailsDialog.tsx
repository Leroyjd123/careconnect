"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePatientDetails, type PatientDetailsInput } from "@/app/actions/patients";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, FieldError, TextInput } from "@/components/ui/Field";
import type { Profile } from "@/lib/types";

/**
 * Doctor edits a patient: name, email, mobile, date of birth, height, weight.
 * Changing the email or mobile also changes what the patient signs in with.
 * `saveAction` is only overridden by /styleguide.
 */
export function PatientDetailsDialog({
  patient,
  open,
  onClose,
  saveAction = updatePatientDetails,
}: {
  patient: Profile;
  open: boolean;
  onClose: () => void;
  saveAction?: typeof updatePatientDetails;
}) {
  const router = useRouter();
  const [form, setForm] = useState<PatientDetailsInput>(() => ({
    fullName: patient.full_name,
    email: patient.email ?? "",
    phone: patient.phone ? patient.phone.replace(/^\+91/, "") : "",
    dateOfBirth: patient.date_of_birth ?? "",
    heightCm: patient.height_cm?.toString() ?? "",
    weightKg: patient.weight_kg?.toString() ?? "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<PatientDetailsInput>) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    setSaving(true);
    setError(null);
    const result = await saveAction(patient.id, form);
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
      title="Edit patient details"
      description="Changing the email or mobile number also changes what they sign in with."
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
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Field id="pd-name" label="Full name" className="sm:col-span-2">
          <TextInput id="pd-name" value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} autoComplete="off" />
        </Field>
        <Field id="pd-email" label="Email" optional>
          <TextInput id="pd-email" type="email" inputMode="email" value={form.email} onChange={(e) => set({ email: e.target.value })} autoComplete="off" />
        </Field>
        <Field id="pd-phone" label="Mobile number" optional>
          <TextInput id="pd-phone" type="tel" inputMode="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="98765 43210" autoComplete="off" />
        </Field>
        <Field id="pd-dob" label="Date of birth" optional>
          <TextInput id="pd-dob" type="date" value={form.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set({ dateOfBirth: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="pd-height" label="Height (cm)" optional>
            <TextInput id="pd-height" inputMode="decimal" value={form.heightCm} onChange={(e) => set({ heightCm: e.target.value })} placeholder="170" />
          </Field>
          <Field id="pd-weight" label="Weight (kg)" optional>
            <TextInput id="pd-weight" inputMode="decimal" value={form.weightKg} onChange={(e) => set({ weightKg: e.target.value })} placeholder="70" />
          </Field>
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
        <input type="submit" hidden />
      </form>
    </Dialog>
  );
}
