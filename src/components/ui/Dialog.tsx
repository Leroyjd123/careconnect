"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/Button";

type DialogProps = {
  open: boolean;
  /** Called when the dialog closes. Optional when `closeHref` is given. */
  onClose?: () => void;
  /** Where closing goes. Used by the popups that the query string opens, so closing never adds history. */
  closeHref?: string;
  title: ReactNode;
  description?: ReactNode;
  /** "modal" centres on screen. "sheet" slides up from the bottom (patient phone flows). */
  variant?: "modal" | "sheet";
  /** "md" (default) is today's dialog. "lg" is a wide popup: ~720px on desktop, a full-height sheet on a phone. */
  size?: "md" | "lg";
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** Native <dialog>: focus trap, Esc to close and backdrop come from the browser. */
export function Dialog({
  open,
  onClose,
  closeHref,
  title,
  description,
  variant = "modal",
  size = "md",
  children,
  footer,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const router = useRouter();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // "lg": a wide popup on desktop, a full-height sheet on a phone. The body scrolls, the footer stays put.
  const lg = size === "lg";

  function close() {
    if (closeHref) router.replace(closeHref);
    else onClose?.();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close(); // click on backdrop
      }}
      className={cn(
        "glass-strong text-ink shadow-modal",
        variant === "modal"
          ? cn(
              "m-auto p-0",
              lg
                ? // Full-height sheet on a phone, a wide window on a bigger screen.
                  "h-[100dvh] max-h-[100dvh] w-full max-w-none rounded-none sm:h-auto sm:max-h-[calc(100dvh-3rem)] sm:w-[720px] sm:max-w-[calc(100vw-3rem)] sm:rounded-card"
                : "w-[calc(100%-32px)] max-w-xl rounded-card",
            )
          : cn(
              "mx-0 mt-auto mb-0 w-full max-w-none rounded-t-card rounded-b-none p-0 sm:mx-auto sm:max-w-md",
              // "lg" sheet: full height on a phone, a wide sheet on a bigger screen.
              lg && "h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[calc(100dvh-3rem)] sm:w-[720px] sm:max-w-[calc(100vw-3rem)] sm:rounded-card",
            ),
        className,
      )}
    >
      <div className={cn("flex flex-col gap-5 p-6 sm:p-7", lg && "h-full max-h-full")}>
        {variant === "sheet" ? <div aria-hidden="true" className="mx-auto -mt-2 h-1.5 w-10 rounded-full bg-line" /> : null}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-[22px] font-semibold tracking-tight">
              {title}
            </h2>
            {description ? <p className="text-[15px] text-ink-2">{description}</p> : null}
          </div>
          {variant === "modal" ? <IconButton label="Close" tone="glass" icon={<X className="size-5" />} onClick={close} /> : null}
        </div>
        {/* On "lg" the body scrolls on its own, so the footer stays visible. */}
        {lg ? <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div> : children}
        {footer ? <div className="flex flex-wrap justify-end gap-2.5">{footer}</div> : null}
      </div>
    </dialog>
  );
}
