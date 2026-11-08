import { CONTACT_EMAIL } from "@/lib/constants";
import { Logo } from "@/components/ui/Logo";

/** The landing page's footer: the legal links, the contact address and the year. */
export function LandingFooter() {
  return (
    <footer className="border-t border-line-soft bg-white/50">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
        <Logo />
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-2">
          <a
            href="/privacy"
            className="inline-flex min-h-11 items-center rounded-tile px-3 text-[15px] text-ink-2 no-underline hover:bg-white/60 hover:text-ink"
          >
            Privacy
          </a>
          <a
            href="/terms"
            className="inline-flex min-h-11 items-center rounded-tile px-3 text-[15px] text-ink-2 no-underline hover:bg-white/60 hover:text-ink"
          >
            Terms
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex min-h-11 items-center rounded-tile px-3 text-[15px] text-ink-2 no-underline hover:bg-white/60 hover:text-ink"
          >
            {CONTACT_EMAIL}
          </a>
        </nav>
        <span className="text-[14px] text-ink-2">© {new Date().getFullYear()} CareConnect</span>
      </div>
    </footer>
  );
}
