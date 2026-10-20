import type { ComponentProps, ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputStyles =
  "w-full min-w-0 rounded-field border border-line bg-white px-4 text-base text-ink " +
  "placeholder:text-ink-2/70 focus:border-forest focus:outline-none focus:ring-4 focus:ring-forest/10 " +
  "aria-[invalid=true]:border-danger disabled:bg-mint";

type FieldProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

/** Label + control + hint/error. Every form input goes through this. */
export function Field({ id, label, hint, error, optional, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-[15px] font-semibold text-ink">
        {label}
        {optional ? <span className="font-normal text-ink-2"> (optional)</span> : null}
      </label>
      {children}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : hint ? <p className="text-sm text-ink-2">{hint}</p> : null}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-start gap-2 rounded-xl bg-danger-bg px-3 py-2.5 text-[15px] leading-snug text-danger">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function TextInput({ className, invalid, ...rest }: ComponentProps<"input"> & { invalid?: boolean }) {
  return <input className={cn(inputStyles, "h-12", className)} aria-invalid={invalid || undefined} {...rest} />;
}

export function TextArea({ className, invalid, ...rest }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return <textarea className={cn(inputStyles, "py-3 leading-relaxed", className)} aria-invalid={invalid || undefined} {...rest} />;
}

/** "+91" style prefix next to an input. */
export function InputAddon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-12 shrink-0 items-center justify-center rounded-field border border-line bg-mint px-4 font-medium">
      {children}
    </span>
  );
}
