"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, FieldError, TextInput } from "@/components/ui/Field";

const initial: LoginState = { email: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" block loading={pending} className="mt-1">
      Sign in
    </Button>
  );
}

export function LoginForm({ linkError }: { linkError?: boolean }) {
  const [state, action] = useActionState(login, initial);

  return (
    <Card className="mt-10 p-5 sm:p-6">
      <form action={action} className="flex flex-col gap-4" noValidate>
        {linkError && !state.error ? (
          <FieldError>That invitation link has expired. Ask your doctor’s clinic to send a new one.</FieldError>
        ) : null}
        <Field id="email" label="Your email" hint="Use the email your doctor's clinic has.">
          <TextInput
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="you@example.com"
            defaultValue={state.email}
            required
            className="h-14 text-lg"
          />
        </Field>
        <Field id="password" label="Password" error={state.error}>
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            invalid={!!state.error}
            aria-describedby={state.error ? "password-error" : undefined}
            required
            className="h-14 text-lg"
          />
        </Field>
        <Submit />
      </form>
    </Card>
  );
}
