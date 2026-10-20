"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setPassword, type SetPasswordState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, TextInput } from "@/components/ui/Field";

const initial: SetPasswordState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" block loading={pending} className="mt-1">
      Save password
    </Button>
  );
}

export function SetPasswordForm({ email }: { email: string }) {
  const [state, action] = useActionState(setPassword, initial);

  return (
    <Card className="mt-10 p-5 sm:p-6">
      <form action={action} className="flex flex-col gap-4" noValidate>
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Choose a password</h1>
          <p className="text-[15px] text-ink-2">
            You’ll use it with <strong className="font-semibold text-ink">{email}</strong> to sign in.
          </p>
        </div>
        {/* Lets password managers save the right username. */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        <Field id="password" label="New password" hint="At least 8 characters.">
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            autoFocus
            required
            className="h-14 text-lg"
          />
        </Field>
        <Field id="confirm" label="Type it again" error={state.error}>
          <TextInput
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            invalid={!!state.error}
            aria-describedby={state.error ? "confirm-error" : undefined}
            required
            className="h-14 text-lg"
          />
        </Field>
        <Submit />
      </form>
    </Card>
  );
}
