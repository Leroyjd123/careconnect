"use client";

import { useState } from "react";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { createDoctorInviteLink, inviteDoctorByEmail } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, FieldError, TextInput } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { formatDate } from "@/lib/utils";

type Props = {
  onClose: () => void;
  onNotice: (tone: "success" | "danger", text: string) => void;
};

/**
 * The admin invites a doctor (decision 44): a one-time link they share however they
 * like, or an email invitation. Only the admin can invite doctors (decision 18).
 */
export function InviteDoctorDialog({ onClose, onNotice }: Props) {
  const [mode, setMode] = useState<"link" | "email">("link");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [regNo, setRegNo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function makeLink() {
    setBusy(true);
    setError(null);
    const result = await createDoctorInviteLink({ fullName });
    setBusy(false);
    if (!result.ok || !result.data) {
      setError(result.ok ? "We couldn't create a link. Please try again." : result.error);
      return;
    }
    setLink(result.data);
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
    } catch {
      setError("Couldn't copy. Press and hold the link to copy it.");
    }
  }

  async function share() {
    if (!link) return;
    try {
      await navigator.share({ title: "Join me on CareConnect", text: shareText(link.url) });
    } catch {
      // The person closed the share sheet; nothing to do.
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await inviteDoctorByEmail({ fullName, email, specialty, regNo });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onNotice("success", `Invitation sent to ${email.trim().toLowerCase()}.`);
    onClose();
  }

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  const footer =
    mode === "email" ? (
      <>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={() => void submit()} loading={busy}>
          Send invitation
        </Button>
      </>
    ) : link ? (
      <Button variant="secondary" onClick={onClose}>
        Done
      </Button>
    ) : (
      <>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={() => void makeLink()} loading={busy} disabled={fullName.trim().length < 2}>
          <Link2 aria-hidden="true" className="size-[18px]" />
          Create link
        </Button>
      </>
    );

  return (
    <Dialog
      open
      onClose={onClose}
      title="Invite a doctor"
      description={
        mode === "link"
          ? "Share a one-time link. The doctor opens it, adds their details and picks a password."
          : "They'll get an email with a link to join."
      }
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        <Segmented
          label="How to invite"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setError(null);
          }}
          options={[
            { value: "link", label: "Share a link" },
            { value: "email", label: "Send by email" },
          ]}
        />

        <Field id="id-name" label="Doctor's full name">
          <TextInput
            id="id-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Dr. Anita Rao"
            autoComplete="off"
            required
          />
        </Field>

        {mode === "email" ? (
          <>
            <Field id="id-email" label="Email address" hint="This is where the invitation goes.">
              <TextInput
                id="id-email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@example.com"
                autoComplete="off"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="id-specialty" label="Specialty" optional>
                <TextInput
                  id="id-specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="General Medicine"
                  autoComplete="off"
                />
              </Field>
              <Field id="id-regno" label="Registration number" optional>
                <TextInput
                  id="id-regno"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="KMC 123456"
                  autoComplete="off"
                />
              </Field>
            </div>
          </>
        ) : null}

        {mode === "link" && link ? (
          <div className="flex flex-col gap-3">
            <Field id="id-link" label="Invite link" hint={`Works once. Expires ${formatDate(link.expiresAt)}.`}>
              <TextInput id="id-link" value={link.url} readOnly onFocus={(e) => e.currentTarget.select()} className="text-[15px]" />
            </Field>
            <div className="flex flex-wrap gap-2 [&>*]:flex-1">
              <Button variant="soft" onClick={() => void copy()}>
                {copied ? <Check aria-hidden="true" className="size-[18px]" /> : <Copy aria-hidden="true" className="size-[18px]" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
              {canShare ? (
                <Button variant="outline" onClick={() => void share()}>
                  <Share2 aria-hidden="true" className="size-[18px]" />
                  Share
                </Button>
              ) : null}
            </div>
            <Button variant="ghost" onClick={() => setLink(null)}>
              Create another link
            </Button>
          </div>
        ) : null}

        {mode === "link" && !link ? (
          <p className="text-[15px] text-ink-2">
            One link is for one doctor. Only the admin can invite doctors, so keep this link to yourself until you send it.
          </p>
        ) : null}

        {error ? <FieldError>{error}</FieldError> : null}
      </div>
    </Dialog>
  );
}

function shareText(url: string) {
  return `Hello, please join me on CareConnect as a doctor: ${url}`;
}

