import type { ReactNode } from "react";
import { cn, formatTime } from "@/lib/utils";

type MessageBubbleProps = {
  /** True when the signed-in user sent it. Works the same for doctor and patient views. */
  mine: boolean;
  createdAt: string;
  /** Extra status after the time: "Seen", "Waiting to send"… */
  status?: ReactNode;
  /** Remove padding when the content is a card (file, prescription). */
  bare?: boolean;
  tone?: "default" | "pending" | "failed";
  /** The admin's messages (decision 48): centred and neutral, labelled "CareConnect Admin". */
  author?: "admin";
  children: ReactNode;
};

/** One chat bubble. Mine = right + mint. Theirs = left + white glass. */
export function MessageBubble({ mine, createdAt, status, bare, tone = "default", author, children }: MessageBubbleProps) {
  const admin = author === "admin";
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        // Cards (file, prescription) get a fixed comfortable width; text hugs its content.
        bare ? "w-[85%] max-w-[360px]" : "max-w-[80%] sm:max-w-[62%]",
        // The admin's message sits in the middle: it belongs to neither side.
        admin ? "self-center items-center" : mine ? "self-end items-end" : "self-start items-start",
      )}
    >
      {admin ? <span className="px-1 text-[13px] font-semibold text-ink-label">CareConnect Admin</span> : null}
      <div
        className={cn(
          "w-full backdrop-blur-lg",
          bare ? "p-2" : "px-4 py-2.5 text-base leading-relaxed whitespace-pre-wrap break-words",
          admin
            ? "rounded-tile border border-line bg-white/80 text-ink"
            : mine
              ? "rounded-tile rounded-br-md border border-white/70 bg-mint-300/85"
              : "rounded-tile rounded-bl-md border border-white/90 bg-white/85 shadow-lift",
          tone === "pending" && "border-dashed border-sage opacity-90",
          tone === "failed" && "border-[1.5px] border-danger/50 bg-white/90",
        )}
      >
        {children}
      </div>
      <span className="px-1 text-xs text-ink-2">
        <time dateTime={createdAt}>{formatTime(createdAt)}</time>
        {status ? <> · {status}</> : null}
      </span>
    </div>
  );
}

/** "Today", "2 new messages" separators. */
export function ChatDivider({ children, tone = "date" }: { children: ReactNode; tone?: "date" | "new" }) {
  if (tone === "date") {
    return (
      <div className="self-center rounded-xl border border-white/80 bg-white/60 px-3 py-1 text-xs font-medium text-ink-label">{children}</div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 text-xs font-semibold text-forest">
      <span className="h-px flex-1 bg-forest/30" />
      {children}
      <span className="h-px flex-1 bg-forest/30" />
    </div>
  );
}
