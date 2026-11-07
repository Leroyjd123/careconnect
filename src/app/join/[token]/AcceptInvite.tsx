"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { acceptInviteLink, type AcceptState } from "@/app/actions/patients";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldError } from "@/components/ui/Field";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" block loading={pending}>
      Accept invitation
    </Button>
  );
}

/** Signed-in patient opening another doctor's link (Q-K). Page-local: only /join uses it. */
export function AcceptInvite({
  token,
  doctorName,
  specialty,
  patientName,
}: {
  token: string;
  doctorName: string;
  specialty: string | null;
  patientName: string;
}) {
  const [state, action] = useActionState(acceptInviteLink.bind(null, token), {} as AcceptState);
  return (
    <Card className="mt-10 p-5 sm:p-6">
      <form action={action} className="flex flex-col gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Join {doctorName}</h1>
          <p className="text-base text-ink-2">
            {specialty ? `${specialty}. ` : ""}You&apos;re signed in as {patientName}. Accept to start a separate chat with this doctor.
            Your other doctors won&apos;t see it.
          </p>
        </div>
        {state.error ? <FieldError>{state.error}</FieldError> : null}
        <Submit />
      </form>
    </Card>
  );
}
