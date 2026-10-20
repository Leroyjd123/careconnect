import type { ElementType, ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type Tone = "glass" | "subtle" | "strong" | "solid";

const tones: Record<Tone, string> = {
  glass: "glass shadow-float",     // default card over the background
  subtle: "glass-subtle shadow-float", // large panels (chat column)
  strong: "glass-strong shadow-modal", // dialogs, sheets
  solid: "bg-white border border-line-soft shadow-lift", // content on top of glass (medicine rows)
};

type CardProps<T extends ElementType> = {
  as?: T;
  tone?: Tone;
  radius?: "tile" | "card";
} & ComponentPropsWithoutRef<T>;

/** The one surface component. Use it instead of hand-writing glass styles. */
export function Card<T extends ElementType = "div">({ as, tone = "glass", radius = "card", className, ...rest }: CardProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return <Tag className={cn(tones[tone], radius === "card" ? "rounded-card" : "rounded-tile", className)} {...rest} />;
}
