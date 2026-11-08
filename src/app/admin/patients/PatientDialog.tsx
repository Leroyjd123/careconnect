"use client";

import { useState } from "react";
import { Ban, Check, MessageCircle, UserPlus } from "lucide-react";
import {
  addDoctorToPatient,
  setAdminAccountBlocked,
  setAdminConversationBlocked,
  updateAdminPatientSettings,
  type AdminDoctor,
  type AdminPatient,
} from "@/app/actions/admin";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, FieldError } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { formatDate } from "@/lib/utils";

type Props = {
  patient: AdminPatient;
  doctors: AdminDoctor[];
  onClose: () => void;
  onNotice: (tone: "success" | "danger", text: string) => void;
};

/** "On / Off / Follow the doctor" — the three states of "also consults". */
const SHOW_OTHER = [
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
  { value: "follow", label: "Follow the doctor" },
];

/**
 * The admin's popup for one patient: their details, the doctors they see, the
 * per-chat blocks, and the whole-account block (decision 12).
 */
export function PatientDialog({ patient, doctors, onClose, onNotice }: Props) {
  const [showOther, setShowOther] = useState(
    patient.show_other_doctors === null ? "follow" : patient.show_other_doctors ? "on" : "off",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmAccount, setConfirmAccount] = useState(false);
  const [addDoctorId, setAddDoctorId] = useState("");

  const accountBlocked = patient.accountBlocked;
  const alreadyWith = new Set(patient.doctors.map((d) => d.id));
  const otherDoctors = doctors.filter((d) => !alreadyWith.has(d.id));

  async function saveSettings() {
    setBusy(true);
    setError(null);
    const result = await updateAdminPatientSettings(patient.id, {
      showOtherDoctors: showOther === "follow" ? null : showOther === "on",
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onNotice("success", `${patient.full_name} updated.`);
    onClose();
  }

  async function addDoctor() {
    if (!addDoctorId) return;
    setBusy(true);
    setError(null);
    const result = await addDoctorToPatient(patient.id, addDoctorId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAddDoctorId("");
    onNotice("success", "The doctor can now message this patient.");
  }

  async function toggleAccountBlocked() {
    setBusy(true);
    setError(null);
    const result = await setAdminAccountBlocked(patient.id, !accountBlocked);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onNotice("success", accountBlocked ? `${patient.full_name} can sign in again.` : `${patient.full_name} is blocked.`);
    onClose();
  }

  async function toggleChat(conversationId: string, blocked: boolean) {
    setBusy(true);
    setError(null);
    const result = await setAdminConversationBlocked(conversationId, !blocked);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onNotice("success", blocked ? "That chat is open again." : "That chat is blocked.");
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Patient details"
      description="Who this patient talks to, and what they can do."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button loading={busy} onClick={() => void saveSettings()}>
            Save settings
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold">{patient.full_name}</span>
          <span className="text-[13px] text-ink-2">
            {[patient.email, patient.phone].filter(Boolean).join(" · ") || "No contact yet"}
          </span>
          <span className="text-[13px] text-ink-2">
            {patient.activated_at ? `Joined ${formatDate(patient.activated_at)}` : "Invite pending"}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink">Their doctors</span>
          {patient.doctors.length === 0 ? (
            <p className="text-[13px] text-ink-2">No doctor yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {patient.doctors.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-2 rounded-tile bg-mint/60 p-2.5">
                  <span className="min-w-0 flex-1 truncate text-[15px]">{d.full_name}</span>
                  <ButtonLink href={`/admin/c/${d.conversationId}`} variant="ghost" size="sm">
                    Open chat
                  </ButtonLink>
                  {d.blockedAt ? (
                    <>
                      <span className="text-[13px] text-ink-2">Chat blocked</span>
                      <Button variant="secondary" size="sm" loading={busy} onClick={() => void toggleChat(d.conversationId, true)}>
                        Unblock chat
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" loading={busy} onClick={() => void toggleChat(d.conversationId, false)}>
                      <Ban aria-hidden="true" className="size-4" />
                      Block chat
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {otherDoctors.length ? (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-ink">Add a doctor</span>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[200px] flex-1">
                <Field id="ap-add-doctor" label="Doctor" optional>
                  <select
                    id="ap-add-doctor"
                    value={addDoctorId}
                    onChange={(e) => setAddDoctorId(e.target.value)}
                    className="h-11 w-full rounded-field border border-line bg-white/80 px-3 text-[15px] text-ink"
                  >
                    <option value="">Choose a doctor</option>
                    {otherDoctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Button variant="secondary" onClick={() => void addDoctor()} loading={busy} disabled={!addDoctorId}>
                <UserPlus aria-hidden="true" className="size-4" />
                Add
              </Button>
            </div>
            <p className="text-[13px] text-ink-2">The patient keeps their other doctors. Nobody is moved away.</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink">Show their other doctors</span>
          <Segmented label="Show their other doctors" value={showOther} onChange={setShowOther} options={SHOW_OTHER} />
          <p className="text-[13px] text-ink-2">When it follows the doctor, the doctor&apos;s own setting decides.</p>
        </div>

        {error ? <FieldError>{error}</FieldError> : null}

        <div className="flex flex-col gap-2 rounded-tile bg-mint/60 p-3">
          <p className="text-[15px] font-medium">
            {accountBlocked ? "This account is blocked." : "Block the whole account?"}
          </p>
          <p className="text-[13px] text-ink-2">
            {accountBlocked
              ? "They can sign in and read their history again."
              : "They can't sign in or send anything to any doctor. Their history stays on record."}
          </p>
          {confirmAccount ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmAccount(false)} disabled={busy}>
                Keep it open
              </Button>
              <Button variant="danger" size="sm" loading={busy} onClick={() => void toggleAccountBlocked()}>
                Yes, block the account
              </Button>
            </div>
          ) : (
            <Button variant={accountBlocked ? "secondary" : "danger"} size="sm" onClick={() => setConfirmAccount(true)} disabled={busy}>
              {accountBlocked ? <Check aria-hidden="true" className="size-4" /> : <Ban aria-hidden="true" className="size-4" />}
              {accountBlocked ? "Unblock the account" : "Block the account"}
            </Button>
          )}
        </div>

        <p className="flex items-start gap-2 text-[13px] text-ink-2">
          <MessageCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          To read or moderate a chat, open the patient&apos;s conversation with their doctor.
        </p>
      </div>
    </Dialog>
  );
}
