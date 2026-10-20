"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Mail } from "lucide-react";
import { login, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, FieldError, TextInput } from "@/components/ui/Field";

const initial: LoginState = { step: "email", email: "" };

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" block loading={pending} className="mt-1">
      {children}
    </Button>
  );
}

export function LoginForm({ linkError }: { linkError?: boolean }) {
  const [state, action] = useActionState(login, initial);

  return (
    <Card className="mt-10 p-5 sm:p-6">
      <form action={action} className="flex flex-col gap-4" noValidate>
        {state.step === "email" ? (
          <>
            {linkError && !state.error ? <FieldError>That sign-in link has expired. Enter your email to get a new code.</FieldError> : null}
            <Field id="email" label="Your email" hint="Use the email your doctor's clinic has." error={state.error}>
              <TextInput
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                defaultValue={state.email}
                invalid={!!state.error}
                aria-describedby={state.error ? "email-error" : undefined}
                required
                className="h-14 text-lg"
              />
            </Field>
            <Submit>
              Continue <ArrowRight aria-hidden="true" className="size-[18px]" />
            </Submit>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-forest/10 text-forest">
                <Mail aria-hidden="true" className="size-6" />
              </span>
              <div>
                <h1 className="text-[22px] font-semibold tracking-tight">Check your email</h1>
                <p className="text-[15px] text-ink-2">
                  We sent a 6-digit code to <strong className="font-semibold text-ink">{state.email}</strong>
                </p>
              </div>
            </div>
            <input type="hidden" name="email" value={state.email} />
            <Field id="code" label="6-digit code" error={state.error}>
              <TextInput
                key={state.email}
                id="code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="••••••"
                invalid={!!state.error}
                aria-describedby={state.error ? "code-error" : undefined}
                autoFocus
                className="h-14 text-center text-2xl font-semibold tracking-[0.5em]"
              />
            </Field>
            <Submit>Verify and continue</Submit>
            <div className="flex items-center justify-between text-[15px]">
              <button type="submit" name="intent" value="resend" className="min-h-11 font-semibold text-forest">
                Send a new code
              </button>
              <button type="submit" name="intent" value="change" className="min-h-11 font-semibold text-forest">
                Change email
              </button>
            </div>
          </>
        )}
      </form>
    </Card>
  );
}
