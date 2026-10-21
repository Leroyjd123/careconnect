"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { EMAIL_RE, PHONE_EMAIL_DOMAIN, PUSH_COOKIE } from "@/lib/constants";
import { normalizePhone } from "@/lib/utils";

export type LoginState = {
  email: string;
  error?: string;
};

export type SetPasswordState = {
  error?: string;
};

const MIN_PASSWORD = 8;

/**
 * Email-or-mobile + password sign-in for doctors and patients. Accounts only exist by invitation.
 * A mobile number maps to the account made for it at join time (see PHONE_EMAIL_DOMAIN).
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const typed = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const phone = typed.includes("@") ? null : normalizePhone(typed);
  const email = phone ? `${phone.slice(1)}@${PHONE_EMAIL_DOMAIN}` : typed;
  if ((!phone && !EMAIL_RE.test(email)) || !password) {
    return { email: typed, error: "Enter your email or mobile number, and your password." };
  }

  const supabase = await createClient();
  let { error } = await supabase.auth.signInWithPassword({ email, password });
  // A patient with an email AND a mobile signs in with the email account; find it from the number.
  if (error && phone) {
    const accountEmail = await emailForPhone(phone);
    if (accountEmail) ({ error } = await supabase.auth.signInWithPassword({ email: accountEmail, password }));
  }
  if (error) {
    if (/banned/i.test(error.message)) {
      return { email: typed, error: "Your account has been paused by your doctor's clinic. Please contact the clinic." };
    }
    if (error.status === 429) {
      return { email: typed, error: "Too many attempts. Please wait a minute and try again." };
    }
    return { email: typed, error: "That email or number and password don't match. Please try again." };
  }

  redirect("/");
}

/**
 * Server-only lookup, never returned to the browser: the account email behind a mobile number.
 * Service role, because the person isn't signed in yet. Used only inside login().
 */
async function emailForPhone(phone: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("email").eq("phone", phone).not("email", "is", null).limit(2);
  return data?.length === 1 ? (data[0].email as string) : null;
}

/** After opening the invite link the user is signed in; they choose a password here. */
export async function setPassword(_prev: SetPasswordState, formData: FormData): Promise<SetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD) return { error: `Use at least ${MIN_PASSWORD} characters.` };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=link");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (/same|different/i.test(error.message)) return { error: "Choose a different password from your current one." };
    if (/weak|short|characters/i.test(error.message)) return { error: "That password is too easy to guess. Try a longer one." };
    console.error("updateUser password failed", error);
    return { error: "We couldn't save your password. Please try again." };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  // Stop notifications on this device so the next person to use it doesn't get them.
  const cookieStore = await cookies();
  const endpoint = cookieStore.get(PUSH_COOKIE)?.value;
  if (endpoint) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", decodeURIComponent(endpoint));
    cookieStore.delete(PUSH_COOKIE);
  }
  await supabase.auth.signOut();
  redirect("/login");
}
