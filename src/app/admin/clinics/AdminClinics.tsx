"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, Pencil, Plus } from "lucide-react";
import {
  createClinic,
  renameClinic,
  setDoctorClinic,
  updateClinicSettings,
  type AdminDoctor,
} from "@/app/actions/admin";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Banner, EmptyState } from "@/components/ui/Feedback";
import { Field, FieldError, TextInput } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import type { Clinic } from "@/lib/types";

type Props = {
  clinics: (Clinic & { doctors: { id: string; full_name: string }[] })[];
  doctors: AdminDoctor[];
};

/** "On / Off / Follow the doctor" — the three states of "also consults". */
const SHOW_OTHER = [
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
  { value: "follow", label: "Follow the doctor" },
];

/**
 * The admin's clinic list: create a clinic, rename it, set its "also consults"
 * setting, and move doctors in and out of it.
 */
export function AdminClinics({ clinics, doctors }: Props) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  async function create() {
    setBusy(true);
    setError(null);
    const result = await createClinic(newName);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNewName("");
    setNotice({ tone: "success", text: "Clinic created." });
    router.refresh();
  }

  async function rename(clinicId: string) {
    setBusy(true);
    setError(null);
    const result = await renameClinic(clinicId, renameValue);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRenaming(null);
    setNotice({ tone: "success", text: "Clinic renamed." });
    router.refresh();
  }

  async function setSetting(clinicId: string, value: string) {
    setError(null);
    const result = await updateClinicSettings(clinicId, {
      showOtherDoctors: value === "follow" ? null : value === "on",
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice({ tone: "success", text: "Setting saved." });
    router.refresh();
  }

  async function moveDoctor(doctorId: string, clinicId: string) {
    setError(null);
    const result = await setDoctorClinic(doctorId, clinicId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice({ tone: "success", text: "Doctor moved." });
    router.refresh();
  }

  return (
    <Card tone="subtle" className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Clinics</h1>
        <p className="text-[15px] text-ink-2">A clinic groups doctors. A doctor belongs to one clinic at most.</p>
      </div>

      {notice ? <Banner tone={notice.tone}>{notice.text}</Banner> : null}
      {error ? <FieldError>{error}</FieldError> : null}

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1">
          <Field id="clinic-new-name" label="New clinic">
            <TextInput
              id="clinic-new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Asha Clinic"
              autoComplete="off"
            />
          </Field>
        </div>
        <Button onClick={() => void create()} loading={busy} disabled={newName.trim().length < 2}>
          <Plus aria-hidden="true" className="size-[18px]" />
          Create clinic
        </Button>
      </div>

      {clinics.length === 0 ? (
        <EmptyState icon={Building2} title="No clinics yet">
          Create one above, then add your doctors to it.
        </EmptyState>
      ) : (
        <ul className="-mx-1 min-h-0 flex-1 overflow-auto px-1">
          {clinics.map((clinic) => (
            <li key={clinic.id} className="mb-3 rounded-tile bg-white/80 p-4">
              <div className="flex flex-wrap items-center gap-3">
                {renaming === clinic.id ? (
                  <div className="flex min-w-[200px] flex-1 items-end gap-2">
                    <div className="flex-1">
                      <Field id={`clinic-rename-${clinic.id}`} label="Clinic name">
                        <TextInput
                          id={`clinic-rename-${clinic.id}`}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          autoComplete="off"
                        />
                      </Field>
                    </div>
                    <Button variant="secondary" onClick={() => void rename(clinic.id)} loading={busy}>
                      Save
                    </Button>
                    <Button variant="ghost" onClick={() => setRenaming(null)} disabled={busy}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-[17px] font-semibold">{clinic.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRenaming(clinic.id);
                        setRenameValue(clinic.name);
                      }}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                      Rename
                    </Button>
                  </>
                )}
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-ink">Show a patient&apos;s other doctors</span>
                <Segmented
                  label={`Show a patient's other doctors in ${clinic.name}`}
                  value={clinic.show_other_doctors === null ? "follow" : clinic.show_other_doctors ? "on" : "off"}
                  onChange={(v) => void setSetting(clinic.id, v)}
                  options={SHOW_OTHER}
                />
                <p className="text-[13px] text-ink-2">When it follows the doctor, each doctor&apos;s own setting decides.</p>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-ink">Doctors in this clinic</span>
                {clinic.doctors.length === 0 ? (
                  <p className="text-[13px] text-ink-2">Nobody yet.</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {clinic.doctors.map((d) => (
                      <li key={d.id}>
                        <Badge tone="brand" icon={<Check aria-hidden="true" />}>
                          {d.full_name}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Move a doctor into this clinic. */}
                <Field id={`clinic-add-${clinic.id}`} label="Add a doctor" optional>
                  <select
                    id={`clinic-add-${clinic.id}`}
                    value=""
                    onChange={(e) => {
                      if (e.target.value) void moveDoctor(e.target.value, clinic.id);
                    }}
                    className="h-11 w-full rounded-field border border-line bg-white/80 px-3 text-[15px] text-ink"
                  >
                    <option value="">Choose a doctor</option>
                    {doctors
                      .filter((d) => !clinic.doctors.some((m) => m.id === d.id))
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.full_name}
                        </option>
                      ))}
                  </select>
                </Field>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
