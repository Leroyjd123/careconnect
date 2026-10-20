import { cn } from "@/lib/utils";

/**
 * CareConnect mark, redrawn from the brand sheet.
 * TODO(brand): replace the paths with the master SVG before launch.
 */
export function LogoMark({ size = 32, className, label }: { size?: number; className?: string; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
    >
      <circle cx="16.5" cy="8.5" r="5" className="fill-forest" />
      <circle cx="31.5" cy="11" r="4.2" className="fill-sage" />
      <path d="M24 45C13 37 4.5 30 4.5 22.5 4.5 16.5 9.5 13.5 14.5 15.5 18.5 17 21.5 20.5 24 24.5Z" className="fill-forest" />
      <path d="M24 45C35 37 43.5 30 43.5 22.5 43.5 16.5 38.5 13.5 33.5 15.5 29.5 17 26.5 20.5 24 24.5Z" className="fill-sage" />
      <path
        d="M24 36.5C19.5 33 16.5 30 16.5 27 16.5 24.6 18.4 23.2 20.4 23.7 22 24.1 23.2 25.2 24 26.6 24.8 25.2 26 24.1 27.6 23.7 29.6 23.2 31.5 24.6 31.5 27 31.5 30 28.5 33 24 36.5Z"
        className="fill-ground"
      />
    </svg>
  );
}

export function Logo({ size = "md", className }: { size?: "md" | "lg"; className?: string }) {
  const lg = size === "lg";
  return (
    <span className={cn("inline-flex items-center", lg ? "flex-col gap-4" : "gap-2.5", className)}>
      <LogoMark size={lg ? 92 : 32} />
      <span className={cn("tracking-tight text-forest", lg ? "text-[34px]" : "text-lg")}>
        <span className="font-bold">Care</span>
        <span className="font-normal">Connect</span>
      </span>
    </span>
  );
}
