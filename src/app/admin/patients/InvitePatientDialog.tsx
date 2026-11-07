"use client";

import { useState } from "react";
import { inviteAdminPatient, type AdminDoctor } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, FieldError, TextInput } from "@/components/ui/Field";

type Props = {
  doctors: AdminDoctor[];
  onClose: () => void;
  onNotice: (tone: "success" | "danger", text: string) => void;
};

/**
 * The admin invites a patient and assigns them to one or more doctors (decision 45).
 * A patient who already has an account keeps their name and their first inviter.
 */
export function InvitePatientDialog({ doctors, onClose, onNotice }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [doctorIds, setDoctorIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** The chip group is single-choice, so "more than one" means picking them one by one. */
  function toggleDoctor(id: string) {
    setDoctorIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await inviteAdminPatient({ fullName, email, doctorIds });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onNotice("success", `Invitation sent to ${email.trim().toLowerCase()}.`);
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Invite a patient"
      description="Choose one or more doctors. The patient gets a chat with each of them."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button loading={busy} onClick={() => void submit()}>
            Send invitation
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field id="ap-new-name" label="Patient's full name">
          <TextInput
            id="ap-new-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Ravi Kumar"
            autoComplete="off"
            required
          />
        </Field>
        <Field id="ap-new-email" label="Email address" hint="This is where the invitation goes.">
          <TextInput
            id="ap-new-email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ravi@example.com"
            autoComplete="off"
            required
          />
        </Field>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink">Their doctors</span>
          {doctors.length === 0 ? (
            <p className="text-[15px] text-ink-2">There are no doctors yet. Invite a doctor first.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {doctors.map((d) => (
                <label
                  key={d.id}
                  className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-tile border border-line bg-white/80 px-3 text-[15px] hover:bg-white"
                >
                  <input
                    type="checkbox"
                    checked={doctorIds.includes(d.id)}
                    onChange={() => toggleDoctor(d.id)}
                    className="size-5 shrink-0 accent-forest"
                  />
                  <span className="min-w-0 flex-1 truncate">{d.full_name}</span>
                  {d.specialty ? <span className="shrink-0 text-[13px] text-ink-2">{d.specialty}</span> : null}
                </label>
              ))}
            </div>
          )}
          <p className="text-[13px] text-ink-2">Tick every doctor the patient should see. You can choose more than one.</p>
        </div>

        {error ? <FieldError>{error}</FieldError> : null}
      </div>
    </Dialog>
  );
}
