import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "soft" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type StyleProps = { variant?: Variant; size?: Size; block?: boolean };

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold no-underline select-none " +
  "transition-[background-color,box-shadow,transform] active:scale-[0.98] " +
  "disabled:opacity-50 disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:pointer-events-none";

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-[15px]",
  lg: "h-14 px-6 text-[17px]",
};

const variants: Record<Variant, string> = {
  // One per screen: the main action.
  primary: "bg-forest text-white shadow-cta hover:bg-forest-700 hover:text-white",
  // Neutral glass button: Cancel, Save draft, Download.
  secondary: "glass text-ink hover:bg-white/85 hover:text-ink",
  // Secondary brand action that must not compete with primary: New prescription, Add another.
  soft: "bg-mint-200 text-forest hover:bg-mint-300 hover:text-forest",
  ghost: "bg-transparent text-forest hover:bg-white/60 hover:text-forest-700",
  danger: "glass text-danger hover:bg-white/85 hover:text-danger",
};

export function buttonStyles({ variant = "primary", size = "md", block = false }: StyleProps = {}) {
  return cn(base, sizes[size], variants[variant], block && "w-full");
}

type ButtonProps = ComponentProps<"button"> & StyleProps & { loading?: boolean };

export function Button({ variant, size, block, loading, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonStyles({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & StyleProps;

export function ButtonLink({ variant, size, block, className, ...rest }: ButtonLinkProps) {
  return <Link className={cn(buttonStyles({ variant, size, block }), className)} {...rest} />;
}

type IconButtonProps = ComponentProps<"button"> & {
  label: string; // required: icon-only buttons need an accessible name
  icon: ReactNode;
  tone?: "glass" | "soft" | "primary" | "plain";
};

const iconTones = {
  glass: "glass text-ink hover:bg-white/85",
  soft: "bg-mint-200 text-forest hover:bg-mint-300",
  primary: "bg-forest text-white shadow-cta hover:bg-forest-700",
  plain: "bg-transparent text-ink hover:bg-white/60",
};

export function IconButton({ label, icon, tone = "plain", className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50",
        iconTones[tone],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
    />
  );
}
