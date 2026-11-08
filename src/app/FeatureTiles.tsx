import Image from "next/image";
import { FileText, GlobeLock, Languages, MessageCircle, Pill, Video, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";
import { cn } from "@/lib/utils";
import type { LandingImage } from "@/lib/landing";

type Props = {
  /** The image slots, keyed as in LANDING_IMAGES. */
  images: Record<string, LandingImage>;
  className?: string;
};

/** The six things CareConnect does (PLAN §7 Phase G). */
const FEATURES: { key: string; title: string; body: string; Icon: LucideIcon }[] = [
  {
    key: "feature-chat",
    title: "Chat",
    body: "A private chat for each patient. One thread, so nothing gets lost.",
    Icon: MessageCircle,
  },
  {
    key: "feature-reports",
    title: "Reports",
    body: "They send a photo or a PDF of a report, and it opens right in the chat.",
    Icon: FileText,
  },
  {
    key: "feature-prescriptions",
    title: "Prescriptions",
    body: "Write one and the patient sees it, and can download it as a PDF.",
    Icon: Pill,
  },
  {
    key: "feature-meetings",
    title: "Video meetings",
    body: "Paste your meeting link, pick a time, and both of you get a reminder.",
    Icon: Video,
  },
  {
    key: "feature-languages",
    title: "Multilingual",
    body: "Patients can pick English, Kannada or Malayalam for their app.",
    Icon: Languages,
  },
  {
    key: "feature-privacy",
    title: "Privacy",
    body: "Files stay private. Only the patient and their doctor can open them.",
    Icon: GlobeLock,
  },
];

/**
 * The landing page's feature tiles: the icon, the title, a line about it, and the
 * image slot. The image is a placeholder box until Leroy supplies the real one
 * (decision 65).
 */
export function FeatureTiles({ images, className }: Props) {
  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {FEATURES.map((feature) => {
        const image = images[feature.key];
        return (
          <li key={feature.key} className="flex">
            <Card tone="feature" className="flex w-full flex-col gap-4 p-5">
              <div className="flex items-center gap-3">
                <IconTile tone="soft">
                  <feature.Icon aria-hidden="true" className="size-5" strokeWidth={1.9} />
                </IconTile>
                <h3 className="text-[18px] font-bold tracking-tight text-ink">{feature.title}</h3>
              </div>
              <p className="text-[15px] leading-relaxed text-ink-2">{feature.body}</p>
              {image ? (
                <div className="relative w-full overflow-hidden rounded-tile bg-mint" style={{ aspectRatio: `${image.width} / ${image.height}` }}>
                  {image.src ? (
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      className="h-full w-full object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-mint p-4 text-center">
                      <span className="text-[14px] font-medium text-ink-2">Image coming soon</span>
                    </div>
                  )}
                </div>
              ) : null}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
