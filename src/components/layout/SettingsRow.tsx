import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";

/** A tappable settings line: icon, title, one-line hint. Patient Profile today; any settings list later. */
export function SettingsRow({ href, icon: Icon, title, hint }: { href: string; icon: LucideIcon; title: string; hint: string }) {
  return (
    <Card as={Link} href={href} className="flex items-center gap-3.5 p-5 text-ink no-underline hover:text-ink">
      <IconTile>
        <Icon aria-hidden="true" className="size-[22px]" />
      </IconTile>
      <span className="flex flex-col">
        <span className="font-semibold">{title}</span>
        <span className="text-[15px] text-ink-2">{hint}</span>
      </span>
    </Card>
  );
}
