"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { joinWithDoctorInviteLink, type DoctorJoinState } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Field, FieldError, TextInput } from "@/components/ui/Field";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" block loading={pending} className="mt-1">
      Join CareConnect
    </Button>
  );
}

/**
 * The doctor makes their own account from the admin's link (decision 44).
 * joinAction is only overridden by /styleguide, so its demo never creates an account.
 */
export function DoctorJoinForm({
  token,
  joinAction = joinWithDoctorInviteLink,
}: {
  token: string;
  joinAction?: typeof joinWithDoctorInviteLink;
}) {
  const [state, action] = useActionState(joinAction.bind(null, token), {} as DoctorJoinState);
  const v = state.values;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field id="docName" label="Your full name">
        <TextInput id="docName" name="fullName" autoComplete="name" defaultValue={v?.fullName} required className="h-14 text-lg" />
      </Field>
      <Field id="docSpecialty" label="Specialty" optional hint="For example, General Medicine.">
        <TextInput
          id="docSpecialty"
          name="specialty"
          autoComplete="organization-title"
          defaultValue={v?.specialty}
          placeholder="General Medicine"
          className="h-14 text-lg"
        />
      </Field>
      <Field id="docRegNo" label="Registration number" optional>
        <TextInput id="docRegNo" name="regNo" defaultValue={v?.regNo} placeholder="KMC 123456" className="h-14 text-lg" />
      </Field>
      <Field id="docEmail" label="Email" optional hint="Add your email, your mobile number, or both. You'll sign in with either.">
        <TextInput
          id="docEmail"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={v?.email}
          className="h-14 text-lg"
        />
      </Field>
      <Field id="docPhone" label="Mobile number" optional>
        <TextInput
          id="docPhone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          defaultValue={v?.phone}
          className="h-14 text-lg"
        />
      </Field>
      <Field id="docPassword" label="Choose a password" hint="At least 8 characters.">
        <TextInput
          id="docPassword"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="h-14 text-lg"
        />
      </Field>
      {state.error ? <FieldError id="doctor-join-error">{state.error}</FieldError> : null}
      <Submit />
    </form>
  );
}
