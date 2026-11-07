import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, homeFor } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { TAGLINE } from "@/lib/constants";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const profile = await getProfile();
  const { error, next } = await searchParams;
  const inviteNext = next && /^\/join\/[A-Za-z0-9_-]{20,64}$/.test(next) ? next : undefined;
  if (profile && !profile.blocked_at) redirect(inviteNext ?? homeFor(profile.role));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-16 pb-8">
      <div className="flex flex-col items-center text-center">
        <Logo size="lg" />
        <p className="mt-2 text-[15px] text-ink-2">{TAGLINE}</p>
      </div>
      <LoginForm linkError={error === "link"} blocked={error === "blocked"} next={inviteNext} />
      <p className="mt-auto pt-8 text-center text-[13px] leading-relaxed text-ink-2">
        For doctors and invited patients.
        <br />
        By continuing you agree to the <Link href="/terms">Terms of use</Link> and <Link href="/privacy">Privacy notice</Link>.
      </p>
    </main>
  );
}
