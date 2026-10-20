"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { invitePatient } from "@/app/actions/patients";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Banner } from "@/components/ui/Feedback";
import { Field, FieldError, TextInput } from "@/components/ui/Field";

/**
 * Invite form. Mounted once in the doctor layout and opened by `?invite=1` on any
 * /doctor route, so every "Invite patient" link is just a link.
 */
export function InviteDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const open = useSearchParams().get("invite") === "1";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<{ name: string; email: string } | null>(null);

  function close() {
    setError(null);
    router.replace(pathname);
  }

  async function submit() {
    setSending(true);
    setError(null);
    const result = await invitePatient({ fullName, email });
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSentTo({ name: fullName.trim(), email: email.trim().toLowerCase() });
    setFullName("");
    setEmail("");
    router.replace(pathname);
    router.refresh();
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={close}
        title="Invite a patient"
        description="They'll get an email with a link to join."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={submit} loading={sending}>
              Send invitation
            </Button>
          </>
        }
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Field id="invite-name" label="Patient's full name">
            <TextInput
              id="invite-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ravi Kumar"
              autoComplete="off"
              required
            />
          </Field>
          <Field id="invite-email" label="Email address" hint="This is where the invitation goes.">
            <TextInput
              id="invite-email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ravi@example.com"
              autoComplete="off"
              required
            />
          </Field>
          {error ? <FieldError>{error}</FieldError> : null}
          {/* Lets Enter submit the form; the visible action lives in the dialog footer. */}
          <input type="submit" hidden />
        </form>
      </Dialog>

      {sentTo ? (
        <div className="fixed inset-x-4 bottom-[max(100px,env(safe-area-inset-bottom))] z-30 mx-auto max-w-md lg:bottom-6">
          <Banner
            tone="success"
            action={
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/15 hover:text-white" onClick={() => setSentTo(null)}>
                Close
              </Button>
            }
          >
            Invitation sent to {sentTo.name} ({sentTo.email}).
          </Banner>
        </div>
      ) : null}
    </>
  );
}
