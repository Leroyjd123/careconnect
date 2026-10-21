"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { joinWithInviteLink, type JoinState } from "@/app/actions/patients";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, FieldError, TextInput } from "@/components/ui/Field";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" block loading={pending} className="mt-1">
      Join CareConnect
    </Button>
  );
}

/** joinAction is only overridden by /styleguide, so its demo never creates an account. */
export function JoinForm({
  token,
  doctorName,
  specialty,
  joinAction = joinWithInviteLink,
}: {
  token: string;
  doctorName: string;
  specialty: string | null;
  joinAction?: typeof joinWithInviteLink;
}) {
  const [state, action] = useActionState(joinAction.bind(null, token), {} as JoinState);
  const v = state.values;

  return (
    <Card className="mt-10 p-5 sm:p-6">
      <form action={action} className="flex flex-col gap-4" noValidate>
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Join {doctorName}</h1>
          <p className="text-base text-ink-2">
            {specialty ? `${specialty}. ` : ""}Message your doctor, send reports and see your prescriptions in one place.
          </p>
        </div>
        <Field id="fullName" label="Your full name">
          <TextInput id="fullName" name="fullName" autoComplete="name" defaultValue={v?.fullName} required className="h-14 text-lg" />
        </Field>
        <Field id="email" label="Email" optional hint="Add your email, your mobile number, or both. You'll sign in with either.">
          <TextInput id="email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" defaultValue={v?.email} className="h-14 text-lg" />
        </Field>
        <Field id="phone" label="Mobile number" optional>
          <TextInput id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" defaultValue={v?.phone} className="h-14 text-lg" />
        </Field>
        <Field id="password" label="Choose a password" hint="At least 8 characters.">
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="h-14 text-lg"
          />
        </Field>
        {state.error ? <FieldError id="join-error">{state.error}</FieldError> : null}
        <Submit />
      </form>
    </Card>
  );
}
