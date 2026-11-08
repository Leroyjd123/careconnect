"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, Lock, Unlock } from "lucide-react";
import { setAdminConversationBlocked } from "@/app/actions/admin";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { Profile } from "@/lib/types";

type Props = {
  conversationId: string;
  base: string;
  patient: Profile;
  doctor: Profile;
  /** The chat's block (0005). */
  blockedAt: string | null;
  /** The prescription the admin opened, if any. */
  rx?: string;
};

/**
 * The header of the admin's chat: both names, the links to their admin profiles, and
 * the per-chat block (decision 11). The block asks first, because it stops the patient
 * sending in that chat.
 */
export function AdminConversationHeader({ conversationId, base, patient, doctor, blockedAt, rx }: Props) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(!!blockedAt);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleBlock() {
    setBusy(true);
    setError(null);
    const result = await setAdminConversationBlocked(conversationId, !blocked);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBlocked(!blocked);
    setConfirming(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {/* Both people, each linking to their admin profile dialog. */}
          <ButtonLink href={`/admin/patients?patient=${patient.id}`} variant="ghost" size="sm" className="gap-2">
            <Avatar name={patient.full_name} seed={patient.id} size="sm" />
            <span className="truncate text-[15px] font-semibold">{patient.full_name}</span>
          </ButtonLink>
          <span className="text-ink-2" aria-hidden="true">
            ·
          </span>
          <ButtonLink href={`/admin/doctors?doctor=${doctor.id}`} variant="ghost" size="sm" className="gap-2">
            <Avatar name={doctor.full_name} seed={doctor.id} doctor size="sm" />
            <span className="truncate text-[15px] font-semibold">{doctor.full_name}</span>
          </ButtonLink>
          {blocked ? (
            <Badge tone="warning" icon={<Lock aria-hidden="true" />}>
              Blocked
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {rx ? (
            <ButtonLink href={`${base}?rx=${rx}`} variant="soft" size="sm">
              Open prescription
            </ButtonLink>
          ) : null}
          {blocked ? (
            <Button variant="secondary" size="sm" onClick={() => void toggleBlock()} disabled={busy}>
              <Unlock aria-hidden="true" className="size-4" />
              Unblock chat
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
              <Ban aria-hidden="true" className="size-4" />
              Block chat
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <p className="text-[14px] text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {/* Blocking asks first: the patient can't send in that chat afterwards. */}
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Block this chat?"
        description={`${patient.full_name} will not be able to send messages in this chat with ${doctor.full_name}. They can still read it, and their other chats stay open.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void toggleBlock()} disabled={busy}>
              <Check aria-hidden="true" className="size-4" />
              Block chat
            </Button>
          </>
        }
      >
        <p className="text-[15px] text-ink-2">You can unblock the chat at any time.</p>
      </Dialog>
    </>
  );
}
