import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { SetPasswordForm } from "./SetPasswordForm";

export const metadata: Metadata = { title: "Choose a password" };

// Invite links land here (via /auth/confirm) so new users pick a password before they start.
export default async function SetPasswordPage() {
  const profile = await requireProfile();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-16 pb-8">
      <div className="flex flex-col items-center text-center">
        <Logo size="lg" />
      </div>
      <SetPasswordForm email={profile.email ?? ""} />
    </main>
  );
}
