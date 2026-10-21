"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/utils";
import { env } from "@/lib/env";
import { EMAIL_RE, PHONE_EMAIL_DOMAIN } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";

/**
 * Doctor invites a patient by email.
 * 1. Supabase creates the auth user and sends the invite email (template: docs/SETUP.md).
 * 2. We set their name and create the doctor–patient conversation.
 * Uses the service-role client, so the doctor check below is the security boundary.
 * (The invite-link functions at the bottom are the one exception: there the one-time token is the boundary.)
 */
export async function invitePatient(input: { fullName: string; email: string }): Promise<ActionResult<{ conversationId: string }>> {
  const doctor = await requireProfile("doctor");

  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  if (fullName.length < 2) return { ok: false, error: "Enter the patient's full name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };

  const admin = createAdminClient();

  let patientId: string | undefined;
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${env.siteUrl()}/auth/confirm`,
  });

  if (inviteError) {
    // Already has an account (e.g. invited before): reuse it.
    if (!/already (been )?registered|already exists/i.test(inviteError.message)) {
      console.error("inviteUserByEmail failed", inviteError);
      return { ok: false, error: "We couldn't send the invitation. Check the email address and try again." };
    }
    const { data: existing } = await admin.from("profiles").select("id, role").eq("email", email).maybeSingle();
    if (!existing) return { ok: false, error: "This email is already registered but has no profile. Contact support." };
    if (existing.role !== "patient") return { ok: false, error: "This email belongs to a doctor account." };
    patientId = existing.id;
  } else {
    patientId = invited.user?.id;
  }
  if (!patientId) return { ok: false, error: "We couldn't create the invitation. Please try again." };

  // The auth trigger created the profile. Fill in who invited them.
  await admin.from("profiles").update({ full_name: fullName, invited_by: doctor.id }).eq("id", patientId).eq("role", "patient");

  const { data: conv, error: convError } = await admin
    .from("conversations")
    .upsert({ doctor_id: doctor.id, patient_id: patientId }, { onConflict: "doctor_id,patient_id" })
    .select("id")
    .single();
  if (convError || !conv) {
    console.error("conversation upsert failed", convError);
    return { ok: false, error: "The invitation was sent but the chat couldn't be created. Please try again." };
  }

  revalidatePath("/doctor", "layout");
  return { ok: true, data: { conversationId: conv.id } };
}

/** Send the invitation email again to someone who hasn't joined yet. */
export async function resendInvite(patientId: string): Promise<ActionResult> {
  const doctor = await requireProfile("doctor");
  const admin = createAdminClient();

  const { data: conv } = await admin
    .from("conversations")
    .select("patient:profiles!conversations_patient_id_fkey(email, status)")
    .eq("doctor_id", doctor.id)
    .eq("patient_id", patientId)
    .maybeSingle();
  const patient = (conv?.patient ?? null) as { email: string | null; status: string } | null;
  if (!patient?.email) return { ok: false, error: "Patient not found." };
  if (patient.status === "active") return { ok: false, error: "This patient has already joined." };

  // For existing users, a magic-link email works as a fresh invite: it lands on /auth/confirm → /set-password.
  const { error } = await admin.auth.signInWithOtp({
    email: patient.email,
    options: { shouldCreateUser: false, emailRedirectTo: `${env.siteUrl()}/auth/confirm` },
  });
  if (error) return { ok: false, error: "We couldn't resend the invitation. Please try again in a minute." };
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Shareable invite links (0003). The doctor creates a one-time link and shares it any way they like
// (WhatsApp, SMS, in person). The patient opens /join/<token> and makes their own account:
// no email, no code. The token is the only thing that lets someone in, so it is long and single-use.
// ─────────────────────────────────────────────────────────────

const LINK_DAYS = 7;

export async function createInviteLink(): Promise<ActionResult<{ url: string; expiresAt: string }>> {
  const doctor = await requireProfile("doctor");
  const supabase = await createClient();
  const token = randomBytes(24).toString("base64url");
  const { data, error } = await supabase
    .from("invite_links")
    .insert({ token, doctor_id: doctor.id, expires_at: new Date(Date.now() + LINK_DAYS * 86_400_000).toISOString() })
    .select("expires_at")
    .single();
  if (error || !data) {
    console.error("createInviteLink failed", error);
    return { ok: false, error: "We couldn't create a link. Please try again." };
  }
  revalidatePath("/doctor/patients");
  return { ok: true, data: { url: `${env.siteUrl()}/join/${token}`, expiresAt: data.expires_at } };
}

/** Stop a link that hasn't been used yet (e.g. sent to the wrong person). */
export async function revokeInviteLink(id: string): Promise<ActionResult> {
  await requireProfile("doctor");
  const supabase = await createClient();
  const { error } = await supabase.from("invite_links").update({ revoked_at: new Date().toISOString() }).eq("id", id).is("used_at", null);
  if (error) return { ok: false, error: "We couldn't cancel this link. Please try again." };
  revalidatePath("/doctor/patients");
  return { ok: true };
}

export type InviteLinkStatus = { ok: true; doctorName: string; specialty: string | null } | { ok: false; reason: "used" | "expired" | "invalid" };

/**
 * Public: what /join/<token> shows before the form. Uses the service role because the visitor has
 * no account yet; it only ever reveals the doctor's name, and only for a valid token.
 */
export async function checkInviteLink(token: string): Promise<InviteLinkStatus> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return { ok: false, reason: "invalid" };
  const admin = createAdminClient();
  const { data: link } = await admin
    .from("invite_links")
    .select("used_at, revoked_at, expires_at, doctor:profiles!invite_links_doctor_id_fkey(full_name, specialty)")
    .eq("token", token)
    .maybeSingle();
  if (!link || link.revoked_at) return { ok: false, reason: "invalid" };
  if (link.used_at) return { ok: false, reason: "used" };
  if (new Date(link.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };
  const doctor = link.doctor as unknown as { full_name: string; specialty: string | null } | null;
  return { ok: true, doctorName: doctor?.full_name || "your doctor", specialty: doctor?.specialty ?? null };
}

export type JoinState = { error?: string; values?: { fullName: string; email: string; phone: string } };

/**
 * Public: the patient makes their account from a link. Claims the link first (so it can't be used twice
 * at the same moment), creates a confirmed account, links them to the doctor, signs them in.
 */
export async function joinWithInviteLink(token: string, _prev: JoinState, formData: FormData): Promise<JoinState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const values = { fullName, email, phone: phoneRaw };

  if (fullName.length < 2) return { error: "Enter your full name.", values };
  if (!email && !phoneRaw) return { error: "Add your email or your mobile number, so you can sign in later.", values };
  if (email && !EMAIL_RE.test(email)) return { error: "That email doesn't look right. Check it and try again.", values };
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (phoneRaw && !phone) return { error: "Enter a 10-digit Indian mobile number.", values };
  if (password.length < 8) return { error: "Use at least 8 characters for your password.", values };

  const status = await checkInviteLink(token);
  if (!status.ok) return { error: status.reason === "used" ? "This link has already been used." : "This link has expired. Ask your doctor for a new one.", values };

  const admin = createAdminClient();
  const { data: claimed } = await admin
    .from("invite_links")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token)
    .is("used_at", null)
    .is("revoked_at", null)
    .select("id, doctor_id")
    .maybeSingle();
  if (!claimed) return { error: "This link has already been used.", values };
  const release = () => admin.from("invite_links").update({ used_at: null }).eq("id", claimed.id);

  // Phone-only patients sign in with their number; see PHONE_EMAIL_DOMAIN.
  const authEmail = email || `${phone!.slice(1)}@${PHONE_EMAIL_DOMAIN}`;
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError || !created.user) {
    await release();
    if (/already|exists|registered/i.test(createError?.message ?? "")) {
      return { error: "There's already an account with this email or number. Sign in instead.", values };
    }
    console.error("joinWithInviteLink createUser failed", createError);
    return { error: "We couldn't create your account. Please try again.", values };
  }

  const patientId = created.user.id;
  await admin
    .from("profiles")
    .update({ full_name: fullName, email: email || null, phone, invited_by: claimed.doctor_id })
    .eq("id", patientId);
  await admin.from("conversations").upsert({ doctor_id: claimed.doctor_id, patient_id: patientId }, { onConflict: "doctor_id,patient_id" });
  await admin.from("invite_links").update({ used_by: patientId }).eq("id", claimed.id);

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: authEmail, password });
  if (signInError) redirect("/login");
  redirect("/home");
}
