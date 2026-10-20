import type { ReactNode } from "react";
import { FileQuestion } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { PREVIEWABLE_TYPES } from "@/lib/constants";

/** Coloured file-type tile: PDF / JPG / PNG / ?. */
export function FileTypeTile({ type, className }: { type: string | null; className?: string }) {
  const isPdf = type === "application/pdf";
  const isImage = type?.startsWith("image/") ?? false;
  const label = isPdf ? "PDF" : isImage ? (type!.split("/")[1] ?? "IMG").toUpperCase().slice(0, 4) : null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold",
        isPdf ? "bg-file-pdf-bg text-file-pdf" : isImage ? "bg-mint-200 text-forest" : "border border-dashed border-sage bg-white/80 text-ink-2",
        className,
      )}
    >
      {label ?? <FileQuestion className="size-4" />}
    </span>
  );
}

type FileCardProps = {
  name: string;
  size?: number | null;
  type: string | null;
  meta?: ReactNode; // overrides the size line, e.g. "Today, 10:16 AM"
  action?: ReactNode; // e.g. an "Open" button
  className?: string;
};

/** File attachment row. Used in chat bubbles, the doctor's Reports list and the upload preview. */
export function FileCard({ name, size, type, meta, action, className }: FileCardProps) {
  const previewable = type ? PREVIEWABLE_TYPES.includes(type) : false;
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl bg-white/85 p-2.5", className)}>
      <FileTypeTile type={type} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[15px] font-semibold">{name}</span>
        <span className="text-[13px] text-ink-2">
          {meta ?? (size ? formatBytes(size) : null)}
          {!previewable && !meta ? " · Can't preview, download to open" : null}
        </span>
      </div>
      {action}
    </div>
  );
}
