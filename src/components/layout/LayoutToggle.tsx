"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { IconButton } from "@/components/ui/Button";

export function setLayoutCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * An icon button that flips a remembered layout choice and re-renders the page.
 * Used for "Hide / Show patient details" next to the doctor's chat.
 */
export function LayoutToggle({ cookie, on, labelOn, labelOff, iconOn, iconOff, className }: {
  cookie: string;
  on: boolean;
  labelOn: string;
  labelOff: string;
  iconOn: ReactNode;
  iconOff: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <IconButton
      label={on ? labelOn : labelOff}
      icon={on ? iconOn : iconOff}
      tone="plain"
      className={className}
      onClick={() => {
        setLayoutCookie(cookie, on ? "off" : "on");
        router.refresh();
      }}
    />
  );
}
