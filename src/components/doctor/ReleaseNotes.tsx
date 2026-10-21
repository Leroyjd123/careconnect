import { Sparkles, RefreshCw, Wrench, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { Release } from "@/lib/releases";

const GROUPS: { key: "added" | "changed" | "fixed"; label: string; Icon: LucideIcon }[] = [
  { key: "added", label: "New", Icon: Sparkles },
  { key: "changed", label: "Changed", Icon: RefreshCw },
  { key: "fixed", label: "Fixed", Icon: Wrench },
];

/** Version history, newest first. The first release is marked as the one running now. */
export function ReleaseNotes({ releases }: { releases: Release[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {releases.map((r, i) => (
        <li key={r.version} className="rounded-tile border border-line-soft bg-white/80 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h3 className="text-[17px] font-semibold tracking-tight">Version {r.version}</h3>
            {i === 0 ? <Badge tone="solid">Current</Badge> : null}
            <span className="text-[13px] text-ink-2">{formatDate(`${r.date}T12:00:00+05:30`)}</span>
          </div>
          <p className="mt-0.5 text-[15px] text-ink-2">{r.title}</p>
          {GROUPS.map(({ key, label, Icon }) =>
            r[key]?.length ? (
              <div key={key} className="mt-3">
                <h4 className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-label">
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </h4>
                <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5 text-[15px] leading-relaxed marker:text-sage">
                  {r[key]!.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </li>
      ))}
    </ol>
  );
}
