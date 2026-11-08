"use client";

import type { ReactNode } from "react";
import { FileX } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { FileCard } from "@/components/chat/FileCard";
import { AppointmentCard } from "@/components/chat/AppointmentCard";
import { PrescriptionCard } from "@/components/rx/PrescriptionCard";
import type { CheckIn, Meeting, Message, PrescriptionWithPeople } from "@/lib/types";

type MessageItemProps = {
  message: Message;
  mine: boolean;
  /** The prescription this card shows, looked up by the conversation. */
  prescription?: PrescriptionWithPeople;
  replaced?: boolean;
  /** The meeting this card shows (kind = "meeting"). */
  meeting?: Meeting;
  /** The check-in this card shows (kind = "check_in"). */
  checkIn?: CheckIn;
  /** Who is looking: the doctor sees the actions, the patient only joins. */
  viewerRole?: "doctor" | "patient" | "admin";
  /** Doctor actions on the appointment card: Reschedule, Cancel, Mark done. */
  appointmentActions?: ReactNode;
  /** Admin only: "Edit" and "Remove" on a message (decisions 49–50). */
  adminActions?: ReactNode;
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
  meeting,
  checkIn,
  viewerRole = "patient",
  appointmentActions,
  adminActions,
  status,
  tone,
  fileHref,
  rxHref,
  correctHref,
  actions,
}: MessageItemProps) {
  const bare = message.kind !== "text" && !message.deleted_at;
  // The admin's own messages are labelled and centred (decision 48, Q-J).
  const isAdmin = message.sender_role === "admin";

  return (
    <MessageBubble
      mine={mine}
      createdAt={message.created_at}
      status={status}
      tone={tone}
      bare={bare}
      author={isAdmin ? "admin" : undefined}
    >
      {message.removed_at ? (
        <p className="flex items-center gap-2 px-2 py-1 text-[15px] text-ink-2 italic">
          <FileX aria-hidden="true" className="size-4 shrink-0" />
          Message removed by admin
        </p>
      ) : message.kind === "text" ? (
        <>
          {message.body}
          {message.edited_at ? <span className="ml-1 text-[13px] text-ink-2">· Edited</span> : null}
        </>
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
      ) : message.kind === "meeting" ? (
        <AppointmentCard
          type="meeting"
          meeting={meeting}
          viewerRole={viewerRole}
          actions={appointmentActions}
        />
      ) : message.kind === "check_in" ? (
        <AppointmentCard
          type="check_in"
          checkIn={checkIn}
          viewerRole={viewerRole}
          actions={appointmentActions}
        />
      ) : prescription ? (
        <PrescriptionCard
          issuedAt={prescription.issued_at ?? message.created_at}
          medicines={(prescription.prescription_items ?? []).map((i) => i.medicine)}
          replaced={replaced}
          cancelled={!!prescription.cancelled_at}
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
      {adminActions ? <div className="mt-2 flex flex-wrap gap-2">{adminActions}</div> : null}
      {actions ? <div className="mt-2 flex gap-2">{actions}</div> : null}
    </MessageBubble>
  );
}
