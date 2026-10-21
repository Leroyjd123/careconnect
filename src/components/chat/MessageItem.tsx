"use client";

import type { ReactNode } from "react";
import { FileX } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { FileCard } from "@/components/chat/FileCard";
import { PrescriptionCard } from "@/components/rx/PrescriptionCard";
import type { Message, PrescriptionWithPeople } from "@/lib/types";

type MessageItemProps = {
  message: Message;
  mine: boolean;
  /** The prescription this card shows, looked up by the conversation. */
  prescription?: PrescriptionWithPeople;
  replaced?: boolean;
  /** Text after the time: "Seen", "Sending…", "Not sent". */
  status?: ReactNode;
  tone?: "default" | "pending" | "failed";
  /** Where tapping an attachment goes. Omitted while a file is still uploading. */
  fileHref?: string;
  rxHref?: string;
  /** Doctor only: start a new draft that replaces this prescription. */
  correctHref?: string;
  /** Try again / Remove for a message that failed to send. */
  actions?: ReactNode;
};

/** One row in the message list. The only place `message.kind` is switched on. */
export function MessageItem({
  message,
  mine,
  prescription,
  replaced,
  status,
  tone,
  fileHref,
  rxHref,
  correctHref,
  actions,
}: MessageItemProps) {
  const bare = message.kind !== "text" && !message.deleted_at;

  return (
    <MessageBubble mine={mine} createdAt={message.created_at} status={status} tone={tone} bare={bare}>
      {message.kind === "text" ? (
        message.body
      ) : message.kind === "file" && message.deleted_at ? (
        <p className="flex items-center gap-2 text-[15px] text-ink-2 italic">
          <FileX aria-hidden="true" className="size-4 shrink-0" />
          Report removed by the doctor
        </p>
      ) : message.kind === "file" ? (
        <div className="flex flex-col gap-2">
          <FileCard name={message.file_name ?? "Attachment"} size={message.file_size} type={message.file_type} href={fileHref} />
          {message.body ? <p className="px-1.5 pb-1 text-[15px] leading-relaxed">{message.body}</p> : null}
        </div>
      ) : prescription ? (
        <PrescriptionCard
          issuedAt={prescription.issued_at ?? message.created_at}
          medicines={(prescription.prescription_items ?? []).map((i) => i.medicine)}
          replaced={replaced}
          actions={
            <>
              {rxHref ? (
                <ButtonLink href={rxHref} variant="outline">
                  View prescription
                </ButtonLink>
              ) : null}
              {correctHref ? (
                <ButtonLink href={correctHref} variant="soft">
                  Issue a correction
                </ButtonLink>
              ) : null}
            </>
          }
        />
      ) : (
        <p className="p-2 text-[15px] text-ink-2">Prescription</p>
      )}
      {actions ? <div className="mt-2 flex gap-2">{actions}</div> : null}
    </MessageBubble>
  );
}
