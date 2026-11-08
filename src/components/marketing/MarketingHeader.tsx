import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type MarketingHeaderProps = {
  /** The anchor links, e.g. { href: "#features", label: "Features" }. */
  links: { href: string; label: string }[];
  /** Where "Sign in" goes. */
  signInHref: string;
  /** Where "Get in touch" goes. */
  contactHref: string;
  className?: string;
};

/**
 * The landing page's top bar: the logo, the anchor links, "Sign in" and "Get in touch".
 * The signed-in app has its own header, so this one is only for the public page.
 */
export function MarketingHeader({ links, signInHref, contactHref, className }: MarketingHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-30 w-full", className)}>
      <div className="glass mx-auto flex max-w-6xl items-center gap-4 rounded-card px-4 py-3 shadow-lift sm:px-6">
        <a href="#top" className="rounded-tile no-underline" aria-label="CareConnect, back to the top">
          <Logo />
        </a>

        {/* The anchor links: hidden on a phone, where the page is one long scroll anyway. */}
        <nav aria-label="Sections" className="ml-4 hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center rounded-tile px-3.5 text-[15px] font-medium text-ink no-underline hover:bg-white/60 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ButtonLink href={signInHref} variant="ghost" size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink href={contactHref} variant="primary" size="sm">
            Get in touch
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
