"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { cancelAdminPrescription } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Banner } from "@/components/ui/Feedback";
import { FileViewer } from "@/components/chat/FileViewer";
import { PrescriptionView } from "@/components/rx/PrescriptionView";
import { AdminCorrectionDialog } from "./AdminCorrectionDialog";
import type { Message, PrescriptionWithPeople } from "@/lib/types";

type Props = {
  conversationId: string;
  base: string;
  messages: Message[];
  prescriptions: PrescriptionWithPeople[];
  replacedRxIds: string[];
  /** The file the admin opened. */
  openFile?: string;
  /** The prescription the admin opened. */
  openRx?: string;
  /** The prescription the admin is writing a correction of. */
  openReplaces?: string;
};

/**
 * The admin's popups for one chat: the file viewer, the prescription (with Cancel and
 * "Write a correction"), and the correction composer.
 *
 * They live here, outside the chat card, because a native <dialog> inside a
 * display:none ancestor is not painted.
 */
export function AdminConversationPopups({
  conversationId,
  base,
  messages,
  prescriptions,
  replacedRxIds,
  openFile,
  openRx,
  openReplaces,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const file = openFile ? messages.find((m) => m.id === openFile && m.file_path) : undefined;
  const prescription = openRx ? prescriptions.find((p) => p.id === openRx) : undefined;
  const replaces = openReplaces ? prescriptions.find((p) => p.id === openReplaces) : undefined;

  async function cancelPrescription() {
    if (!prescription) return;
    setBusy(true);
    setError(null);
    const result = await cancelAdminPrescription(prescription.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <>
      {file ? <FileViewer message={file} backHref={base} className="absolute inset-0 z-10" /> : null}

      {/* The prescription the admin opened, with Cancel and "Write a correction". */}
      {prescription ? (
        <Dialog open closeHref={base} size="lg" title="Prescription">
          <div className="flex flex-col gap-4">
            {error ? <Banner tone="danger">{error}</Banner> : null}
            <PrescriptionView prescription={prescription} replaced={replacedRxIds.includes(prescription.id)} />
            {!prescription.cancelled_at && prescription.status === "issued" ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => void cancelPrescription()} disabled={busy}>
                  <Trash2 aria-hidden="true" className="size-4" />
                  Cancel this prescription
                </Button>
                <Button
                  variant="soft"
                  onClick={() => router.push(`${base}?rx=new&replaces=${prescription.id}`)}
                  disabled={busy}
                >
                  <Pencil aria-hidden="true" className="size-4" />
                  Write a correction
                </Button>
              </div>
            ) : null}
            {prescription.cancelled_at ? (
              <Banner tone="info">This prescription was cancelled by the admin. It stays on record.</Banner>
            ) : null}
          </div>
        </Dialog>
      ) : null}

      {/* Writing a correction on the doctor's behalf (Q-C). */}
      {replaces ? (
        <AdminCorrectionDialog conversationId={conversationId} replaces={replaces} closeHref={base} />
      ) : null}
    </>
  );
}
