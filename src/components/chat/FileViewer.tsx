"use client";

import { useEffect, useState } from "react";
import { Download, FileQuestion } from "lucide-react";
import { getFileUrl } from "@/app/actions/messages";
import { Button, ButtonLink, Spinner } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { PREVIEWABLE_TYPES } from "@/lib/constants";
import { cn, formatBytes, formatDay, formatTime } from "@/lib/utils";
import type { Message } from "@/lib/types";

type FileViewerProps = {
  message: Message;
  /** Closing the viewer: back to the conversation. */
  backHref: string;
  /** "Reply about this report" — the doctor's main action here. */
  replyHref?: string;
  className?: string;
};

/** Full-panel attachment viewer. Private files, so every URL is signed and expires in 5 minutes. */
export function FileViewer({ message, backHref, replyHref, className }: FileViewerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const path = message.file_path;
  const type = message.file_type;
  const previewable = !!type && PREVIEWABLE_TYPES.includes(type);

  useEffect(() => {
    if (!path || !previewable) return;
    let active = true;
    void getFileUrl(path).then((result) => {
      if (!active) return;
      if (result.ok && result.data) setUrl(result.data.url);
      else setError("We couldn't open this file. Please try again.");
    });
    return () => {
      active = false;
    };
  }, [path, previewable]);

  async function download() {
    if (!path) return;
    const result = await getFileUrl(path, true);
    if (!result.ok || !result.data) {
      setError("We couldn't download this file. Please try again.");
      return;
    }
    window.location.href = result.data.url;
  }

  return (
    <Card tone="subtle" className={cn("flex min-h-0 flex-col gap-3 p-3", className)}>
      <PageHeader
        backHref={backHref}
        backLabel="Back to the conversation"
        title={message.file_name ?? "Attachment"}
        subtitle={[
          message.file_size ? formatBytes(message.file_size) : null,
          `${formatDay(message.created_at)}, ${formatTime(message.created_at)}`,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <Button variant="secondary" size="sm" onClick={download}>
            <Download aria-hidden="true" className="size-4" />
            Download
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-tile bg-white">
        {error ? (
          <EmptyState icon={FileQuestion} title="We couldn't open this file" tone="danger">
            {error}
          </EmptyState>
        ) : !previewable ? (
          <EmptyState icon={FileQuestion} title="Can't preview this file" action={<Button onClick={download}>Download to open</Button>}>
            Download it to open with another app.
          </EmptyState>
        ) : !url ? (
          <Spinner className="size-6 text-forest" />
        ) : type === "application/pdf" ? (
          <iframe src={url} title={message.file_name ?? "Attachment"} className="size-full min-h-[60vh]" />
        ) : (
          // Signed Supabase URL that expires in 5 minutes: not a candidate for next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={message.file_name ?? "Attachment"} className="max-h-full w-auto object-contain" />
        )}
      </div>

      {replyHref ? (
        <ButtonLink href={replyHref} block>
          Reply about this report
        </ButtonLink>
      ) : null}
    </Card>
  );
}
