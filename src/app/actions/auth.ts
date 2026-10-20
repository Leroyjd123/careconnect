"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  step: "email" | "code";
  email: string;
  error?: string;
  notice?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * One action drives the whole sign-in form:
 *   step "email" → email a 6-digit code (invite-only: unknown emails are refused, never signed up)
 *   step "code"  → verify it, then go home. intent=resend / intent=change are the two links.
 */
export async function login(prev: LoginState, formData: FormData): Promise<LoginState> {
  const intent = formData.get("intent");
  if (intent === "change") return { step: "email", email: prev.email };
  if (prev.step === "email" || intent === "resend") return sendCode(String(formData.get("email") ?? prev.email));
  return verifyCode(prev.email, String(formData.get("code") ?? ""));
}

async function sendCode(rawEmail: string): Promise<LoginState> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { step: "email", email, error: "Enter the email address your doctor's clinic has." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });

  if (error) {
    if (error.status === 429) {
      return { step: "email", email, error: "Too many attempts. Please wait a minute and try again." };
    }
    if (error.status === 400 || error.status === 422 || /signups? not allowed|not found/i.test(error.message)) {
      return {
        step: "email",
        email,
        error: "We couldn't find this email. CareConnect works by invitation, so ask your doctor's clinic to invite you.",
      };
    }
    console.error("signInWithOtp failed", error);
    return { step: "email", email, error: "We couldn't send the code. Please try again." };
  }

  return { step: "code", email, notice: `We sent a 6-digit code to ${email}.` };
}

async function verifyCode(email: string, rawCode: string): Promise<LoginState> {
  const token = rawCode.replace(/\D/g, "");
  if (token.length !== 6) {
    return { step: "code", email, error: "Enter all 6 digits from the email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    return { step: "code", email, error: "That code doesn't match or has expired. Check the email and try again." };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
