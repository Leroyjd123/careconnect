"use client";

import { useState } from "react";
import { Ban, Check, UserRound } from "lucide-react";
import {
  setDoctorDeactivated,
  updateAdminDoctor,
  updateAdminDoctorSettings,
  type AdminDoctor,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, FieldError, TextInput } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { formatDate } from "@/lib/utils";
import type { Clinic } from "@/lib/types";

type Props = {
  doctor: AdminDoctor;
  clinics: Clinic[];
  onClose: () => void;
  onNotice: (tone: "success" | "danger", text: string) => void;
};

/** "On / Off / Follow the clinic" — the three states of "also consults". */
const SHOW_OTHER = [
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
  { value: "follow", label: "Follow the clinic" },
];

/**
 * The admin's popup for one doctor: name, specialty, registration number, clinic,
 * the "also consults" setting, and the auto-complete setting. Deactivate lives here too.
 */
export function DoctorDialog({ doctor, clinics, onClose, onNotice }: Props) {
  const [form, setForm] = useState({
    fullName: doctor.full_name,
    specialty: doctor.specialty ?? "",
    regNo: doctor.reg_no ?? "",
    clinicId: doctor.clinic_id ?? "",
  });
  const [showOther, setShowOther] = useState(
    doctor.show_other_doctors === null ? "follow" : doctor.show_other_doctors ? "on" : "off",
  );
  const [autoComplete, setAutoComplete] = useState(doctor.meeting_auto_complete);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const deactivated = !!doctor.deactivated_at;
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    setBusy(true);
    setError(null);
    const result = await updateAdminDoctor(doctor.id, form);
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }
    const settings = await updateAdminDoctorSettings(doctor.id, {
      showOtherDoctors: showOther === "follow" ? null : showOther === "on",
      meetingAutoComplete: autoComplete,
    });
    setBusy(false);
    if (!settings.ok) {
      setError(settings.error);
      return;
    }
    onNotice("success", `${form.fullName.trim()} updated.`);
    onClose();
  }

  async function toggleDeactivated() {
    setBusy(true);
    setError(null);
    const result = await setDoctorDeactivated(doctor.id, !deactivated);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onNotice("success", deactivated ? `${doctor.full_name} can work again.` : `${doctor.full_name} is deactivated.`);
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Doctor details"
      description="These details show on their prescriptions and in the chat."
      footer={
        confirmDeactivate ? (
          <>
            <Button variant="ghost" onClick={() => setConfirmDeactivate(false)} disabled={busy}>
              Keep them active
            </Button>
            <Button variant="danger" loading={busy} onClick={() => void toggleDeactivated()}>
              Yes, {deactivated ? "reactivate" : "deactivate"}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button loading={busy} onClick={() => void save()}>
              Save details
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <Field id="ad-name" label="Full name">
          <TextInput id="ad-name" value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} autoComplete="off" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="ad-specialty" label="Specialty" optional>
            <TextInput id="ad-specialty" value={form.specialty} onChange={(e) => set({ specialty: e.target.value })} placeholder="General Medicine" autoComplete="off" />
          </Field>
          <Field id="ad-regno" label="Registration number" optional>
            <TextInput id="ad-regno" value={form.regNo} onChange={(e) => set({ regNo: e.target.value })} placeholder="KMC 123456" autoComplete="off" />
          </Field>
        </div>

        <Field id="ad-clinic" label="Clinic" optional hint="A doctor belongs to at most one clinic.">
          <select
            id="ad-clinic"
            value={form.clinicId}
            onChange={(e) => set({ clinicId: e.target.value })}
            className="h-11 w-full rounded-field border border-line bg-white/80 px-3 text-[15px] text-ink"
          >
            <option value="">No clinic</option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink">Show a patient&apos;s other doctors</span>
          <Segmented
            label="Show a patient's other doctors"
            value={showOther}
            onChange={setShowOther}
            options={SHOW_OTHER}
          />
          <p className="text-[13px] text-ink-2">When it follows the clinic, the clinic&apos;s own setting decides.</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink">Mark meetings complete automatically</span>
          <Segmented
            label="Mark meetings complete automatically"
            value={autoComplete ? "on" : "off"}
            onChange={(v) => setAutoComplete(v === "on")}
            options={[
              { value: "on", label: "On" },
              { value: "off", label: "Off" },
            ]}
          />
          <p className="text-[13px] text-ink-2">A meeting is marked done 15 minutes after it starts.</p>
        </div>

        {doctor.activated_at ? (
          <p className="text-[13px] text-ink-2">Joined {formatDate(doctor.activated_at)}.</p>
        ) : (
          <p className="flex items-center gap-1.5 text-[13px] text-ink-2">
            <UserRound aria-hidden="true" className="size-3.5" />
            Invite pending — they haven&apos;t joined yet.
          </p>
        )}

        {error ? <FieldError>{error}</FieldError> : null}

        {/* Deactivating stops everybody sending in this doctor's chats. */}
        <div className="flex flex-col gap-2 rounded-tile bg-mint/60 p-3">
          <p className="text-[15px] font-medium">
            {deactivated ? "This doctor is deactivated." : "Deactivate this doctor?"}
          </p>
          <p className="text-[13px] text-ink-2">
            {deactivated
              ? "Reactivate them and their chats work again."
              : "Their patients can still read their history, but nobody can send anything in their chats."}
          </p>
          {confirmDeactivate ? null : (
            <Button variant={deactivated ? "secondary" : "danger"} size="sm" onClick={() => setConfirmDeactivate(true)} disabled={busy}>
              {deactivated ? <Check aria-hidden="true" className="size-4" /> : <Ban aria-hidden="true" className="size-4" />}
              {deactivated ? "Reactivate" : "Deactivate"}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
