import { GlobeLock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DisplayHeading } from "@/components/marketing/DisplayHeading";
import { IconTile } from "@/components/ui/IconTile";

/**
 * The privacy strip. Only what the app really does today: files are private, every
 * admin view is written down, and we keep only what care needs.
 */
export function PrivacyStrip() {
  return (
    <Card tone="solid" className="flex flex-col gap-6 p-6 sm:p-8">
      <DisplayHeading as="h2" size="md" eyebrow="Privacy">
        Their reports are their own
      </DisplayHeading>
      <ul className="grid gap-5 sm:grid-cols-3">
        {[
          {
            title: "Files stay private",
            body: "A report opens only for the patient who sent it and the doctor they sent it to.",
          },
          {
            title: "Every admin view is recorded",
            body: "When the CareConnect admin opens a chat or a file, it is written down, with their name and the time.",
          },
          {
            title: "Built for India's privacy law",
            body: "We keep only what care needs, and we do not sell or share your patients' data.",
          },
        ].map((item) => (
          <li key={item.title} className="flex flex-col gap-2">
            <IconTile tone="soft">
              <GlobeLock aria-hidden="true" className="size-5" strokeWidth={1.9} />
            </IconTile>
            <span className="text-[16px] font-semibold text-ink">{item.title}</span>
            <span className="text-[15px] leading-relaxed text-ink-2">{item.body}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
