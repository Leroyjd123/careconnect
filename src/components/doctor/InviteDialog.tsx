"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { createInviteLink, invitePatient } from "@/app/actions/patients";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Banner } from "@/components/ui/Feedback";
import { Field, FieldError, TextInput } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { formatDate } from "@/lib/utils";

type Mode = "link" | "email";

/**
 * Invite form. Mounted once in the doctor layout and opened by `?invite=1` on any
 * /doctor route, so every "Invite patient" link is just a link.
 * Two ways in: a one-time link the doctor shares however they like (default), or an email invite.
 * The action props default to the real actions; /styleguide passes fakes.
 */
export function InviteDialog({
  inviteAction = invitePatient,
  createLinkAction = createInviteLink,
}: { inviteAction?: typeof invitePatient; createLinkAction?: typeof createInviteLink } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const open = useSearchParams().get("invite") === "1";

  const [mode, setMode] = useState<Mode>("link");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<{ name: string; email: string } | null>(null);
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function close() {
    setError(null);
    setLink(null);
    setCopied(false);
    router.replace(pathname);
  }

  async function makeLink() {
    setSending(true);
    setError(null);
    const result = await createLinkAction();
    setSending(false);
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
    setSending(true);
    setError(null);
    const result = await inviteAction({ fullName, email });
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

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  const footer =
    mode === "email" ? (
      <>
        <Button variant="secondary" onClick={close} disabled={sending}>
          Cancel
        </Button>
        <Button onClick={submit} loading={sending}>
          Send invitation
        </Button>
      </>
    ) : link ? (
      <Button variant="secondary" onClick={close}>
        Done
      </Button>
    ) : (
      <>
        <Button variant="secondary" onClick={close} disabled={sending}>
          Cancel
        </Button>
        <Button onClick={makeLink} loading={sending}>
          <Link2 aria-hidden="true" className="size-[18px]" />
          Create link
        </Button>
      </>
    );

  return (
    <>
      <Dialog
        open={open}
        onClose={close}
        title="Invite a patient"
        description={
          mode === "link"
            ? "Share a one-time link. Your patient opens it, adds their name and email or mobile number, and picks a password."
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

          {mode === "link" ? (
            link ? (
              <div className="flex flex-col gap-3">
                <Field id="invite-link" label="Invite link" hint={`Works once. Expires ${formatDate(link.expiresAt)}.`}>
                  <TextInput id="invite-link" value={link.url} readOnly onFocus={(e) => e.currentTarget.select()} className="text-[15px]" />
                </Field>
                <div className="flex flex-wrap gap-2 [&>*]:flex-1">
                  <Button variant="soft" onClick={copy}>
                    {copied ? <Check aria-hidden="true" className="size-[18px]" /> : <Copy aria-hidden="true" className="size-[18px]" />}
                    {copied ? "Copied" : "Copy link"}
                  </Button>
                  {canShare ? (
                    <Button variant="outline" onClick={share}>
                      <Share2 aria-hidden="true" className="size-[18px]" />
                      Share
                    </Button>
                  ) : (
                    <ButtonLink href={`https://wa.me/?text=${encodeURIComponent(shareText(link.url))}`} target="_blank" rel="noreferrer" variant="outline">
                      <Share2 aria-hidden="true" className="size-[18px]" />
                      WhatsApp
                    </ButtonLink>
                  )}
                </div>
                <Button variant="ghost" onClick={() => setLink(null)}>
                  Create another link
                </Button>
              </div>
            ) : (
              <p className="text-[15px] text-ink-2">
                One link is for one patient. Anyone with the link can join as your patient, so send it only to them.
              </p>
            )
          ) : (
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
              {/* Lets Enter submit the form; the visible action lives in the dialog footer. */}
              <input type="submit" hidden />
            </form>
          )}
          {error ? <FieldError>{error}</FieldError> : null}
        </div>
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

function shareText(url: string) {
  return `Hello, this is your doctor's clinic. Join me on CareConnect to message me, send reports and get your prescriptions: ${url}`;
}
