import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { checkInviteLink } from "@/app/actions/patients";
import { getProfile, homeFor } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { Logo } from "@/components/ui/Logo";
import { JoinForm } from "./JoinForm";

export const metadata: Metadata = { title: "Join" };

// Opened from the link the doctor shared. No account, no email code: the patient makes their account here.
export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const profile = await getProfile();
  if (profile) redirect(homeFor(profile.role));

  const { token } = await params;
  const status = await checkInviteLink(token);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-16 pb-8">
      <div className="flex flex-col items-center text-center">
        <Logo size="lg" />
      </div>
      {status.ok ? (
        <JoinForm token={token} doctorName={status.doctorName} specialty={status.specialty} />
      ) : (
        <Card className="mt-10">
          <EmptyState
            icon={CircleAlert}
            tone="danger"
            title={status.reason === "used" ? "This link has been used" : "This link doesn't work any more"}
            action={
              <ButtonLink href="/login" variant="secondary">
                Go to sign in
              </ButtonLink>
            }
          >
            {status.reason === "used"
              ? "If you already joined, sign in with your email or mobile number."
              : "It may have expired. Ask your doctor's clinic to send you a new one."}
          </EmptyState>
        </Card>
      )}
    </main>
  );
}
