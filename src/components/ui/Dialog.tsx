"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/Button";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** "modal" centres on screen. "sheet" slides up from the bottom (patient phone flows). */
  variant?: "modal" | "sheet";
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** Native <dialog>: focus trap, Esc to close and backdrop come from the browser. */
export function Dialog({ open, onClose, title, description, variant = "modal", children, footer, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // click on backdrop
      }}
      className={cn(
        "glass-strong text-ink shadow-modal",
        variant === "modal"
          ? "m-auto w-[calc(100%-32px)] max-w-xl rounded-[32px] p-0"
          : "mx-0 mt-auto mb-0 w-full max-w-none rounded-t-[32px] rounded-b-none p-0 sm:mx-auto sm:max-w-md",
        className,
      )}
    >
      <div className="flex flex-col gap-5 p-6 sm:p-7">
        {variant === "sheet" ? <div aria-hidden="true" className="mx-auto -mt-2 h-1.5 w-10 rounded-full bg-line" /> : null}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-[22px] font-semibold tracking-tight">
              {title}
            </h2>
            {description ? <p className="text-[15px] text-ink-2">{description}</p> : null}
          </div>
          {variant === "modal" ? <IconButton label="Close" tone="glass" icon={<X className="size-5" />} onClick={onClose} /> : null}
        </div>
        {children}
        {footer ? <div className="flex flex-wrap justify-end gap-2.5">{footer}</div> : null}
      </div>
    </dialog>
  );
}
