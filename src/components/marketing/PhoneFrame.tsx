import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { LandingImage } from "@/lib/landing";

type PhoneFrameProps = {
  /** The image slot. While `src` is null a placeholder box is drawn at the same size. */
  image: LandingImage;
  /** The size of the frame on a wide screen. */
  /** Load it straight away (the hero, above the fold). */
  priority?: boolean;
  className?: string;
};

/**
 * The phone around an app screenshot.
 *
 * While the image is missing (decision 65) it draws a placeholder box at the final
 * size, so nothing moves when Leroy drops the real file in.
 */
export function PhoneFrame({ image, priority, className }: PhoneFrameProps) {
  const ratio = image.height / image.width;

  return (
    <Card tone="solid" className={cn("w-full max-w-[300px] overflow-hidden rounded-[2.1rem] p-2 shadow-float", className)}>
      <div className="relative w-full overflow-hidden rounded-[1.6rem] bg-mint" style={{ aspectRatio: `1 / ${ratio}` }}>
        {image.src ? (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            priority={priority}
            className="h-full w-full object-cover"
            sizes="(max-width: 768px) 300px, 340px"
          />
        ) : (
          // The placeholder: the same box, the same words, an icon. No stock photo.
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-mint p-6 text-center">
            <ImageIcon aria-hidden="true" className="size-8 text-sage" strokeWidth={1.75} />
            <span className="text-[15px] font-medium text-ink-2">Image coming soon</span>
          </div>
        )}
      </div>
    </Card>
  );
}
