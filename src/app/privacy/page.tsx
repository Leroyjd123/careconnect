import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = { title: "Privacy notice" };

// TODO(launch): replace with the clinic's reviewed privacy notice and consent text.
export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <Link href="/login" className="self-start no-underline">
        <Logo />
      </Link>
      <Card className="flex flex-col gap-4 p-6 leading-relaxed">
        <h1 className="text-2xl font-semibold tracking-tight">Privacy notice</h1>
        <p>[PRIVACY NOTICE: what is collected, why, who can see it, how long it is kept, and how to ask for deletion.]</p>
        <p className="text-ink-2">Your messages, reports and prescriptions are visible only to you and your doctor.</p>
      </Card>
    </main>
  );
}
