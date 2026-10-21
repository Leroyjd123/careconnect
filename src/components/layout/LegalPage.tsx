import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { formatDate } from "@/lib/utils";

export type LegalSection = { heading: string; body: ReactNode };

/** Plain-language legal page (privacy, terms): logo, title, last-updated date, short sections. */
export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: ReactNode; sections: LegalSection[] }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-5 py-10">
      <Link href="/" className="self-start no-underline" aria-label="CareConnect home">
        <Logo />
      </Link>
      <Card className="flex flex-col gap-6 p-6 sm:p-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
          <p className="text-[15px] text-ink-2">Last updated {formatDate(updated)}</p>
          <div className="text-base leading-relaxed">{intro}</div>
        </header>
        {sections.map((s) => (
          <section key={s.heading} className="flex flex-col gap-2">
            <h2 className="text-[17px] font-semibold">{s.heading}</h2>
            <div className="flex flex-col gap-2 text-base leading-relaxed text-ink [&_li]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">{s.body}</div>
          </section>
        ))}
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line-soft pt-4 text-[15px]">
          <Link href="/privacy">Privacy notice</Link>
          <Link href="/terms">Terms of use</Link>
        </nav>
      </Card>
    </main>
  );
}
