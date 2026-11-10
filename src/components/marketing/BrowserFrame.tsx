import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { LandingImage } from "@/lib/landing";

type BrowserFrameProps = {
  /** The image slot. While `src` is null a placeholder box is drawn at the same size. */
  image: LandingImage;
  /** The address shown in the window's bar. */
  address?: string;
  /** Load it straight away (the image above the fold). */
  priority?: boolean;
  className?: string;
};

/**
 * A desktop window around a wide app screenshot: the doctor's screen. The phone's
 * twin (`PhoneFrame`), for screens that only make sense wide.
 */
export function BrowserFrame({ image, address = "careconnect.app", priority, className }: BrowserFrameProps) {
  return (
    <Card tone="solid" className={cn("w-full overflow-hidden rounded-card p-0 shadow-float", className)}>
      {/* The window bar: three dots and the address. Decoration only. */}
      <div aria-hidden="true" className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-line" />
          <span className="size-2.5 rounded-full bg-line" />
          <span className="size-2.5 rounded-full bg-line" />
        </span>
        <span className="mx-auto max-w-[60%] truncate rounded-full bg-mint px-4 py-1 text-[12px] font-medium text-ink-2">
          {address}
        </span>
        <span className="w-[42px]" />
      </div>
      <div className="relative w-full bg-mint" style={{ aspectRatio: `${image.width} / ${image.height}` }}>
        {image.src ? (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            priority={priority}
            className="h-full w-full object-cover object-top"
            sizes="(max-width: 1200px) 100vw, 1150px"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
            <ImageIcon aria-hidden="true" className="size-8 text-sage" strokeWidth={1.75} />
            <span className="text-[15px] font-medium text-ink-2">Image coming soon</span>
          </div>
        )}
      </div>
    </Card>
  );
}
