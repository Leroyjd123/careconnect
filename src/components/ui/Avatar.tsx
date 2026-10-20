import { cn, initials } from "@/lib/utils";

const tones = [
  "bg-mint-300 text-forest",
  "bg-warning-bg text-warning",
  "bg-tone-sky-bg text-tone-sky",
  "bg-tone-rose-bg text-tone-rose",
];

const sizes = {
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-15 text-lg",
};

type AvatarProps = {
  name: string;
  /** Stable id so the colour never changes between screens. */
  seed?: string;
  size?: keyof typeof sizes;
  /** Doctors are always forest green so patients recognise them. */
  doctor?: boolean;
  /** Dashed outline for invited people who haven't joined yet. */
  pending?: boolean;
  ring?: boolean;
  className?: string;
};

export function Avatar({ name, seed, size = "md", doctor, pending, ring, className }: AvatarProps) {
  const key = seed ?? name;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const tone = doctor ? "bg-forest text-white" : pending ? "border-[1.5px] border-dashed border-sage text-ink-2" : tones[hash % tones.length];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        sizes[size],
        tone,
        ring && "ring-4 ring-white/90",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
