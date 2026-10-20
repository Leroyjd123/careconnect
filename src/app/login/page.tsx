import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, homeFor } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { TAGLINE } from "@/lib/constants";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const profile = await getProfile();
  if (profile) redirect(homeFor(profile.role));
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-16 pb-8">
      <div className="flex flex-col items-center text-center">
        <Logo size="lg" />
        <p className="mt-2 text-[15px] text-ink-2">{TAGLINE}</p>
      </div>
      <LoginForm linkError={error === "link"} />
      <p className="mt-auto pt-8 text-center text-[13px] leading-relaxed text-ink-2">
        For doctors and invited patients.
        <br />
        By continuing you agree to the <Link href="/privacy">Privacy notice</Link>.
      </p>
    </main>
  );
}
