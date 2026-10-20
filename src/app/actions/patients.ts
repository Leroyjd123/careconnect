"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import type { ActionResult } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Doctor invites a patient by email.
 * 1. Supabase creates the auth user and sends the invite email (template: docs/SETUP.md).
 * 2. We set their name and create the doctor–patient conversation.
 * Uses the service-role client, so the doctor check below is the security boundary.
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

  // For existing users, a magic link email works as a fresh invite.
  const { error } = await admin.auth.signInWithOtp({
    email: patient.email,
    options: { shouldCreateUser: false, emailRedirectTo: `${env.siteUrl()}/auth/confirm` },
  });
  if (error) return { ok: false, error: "We couldn't resend the invitation. Please try again in a minute." };
  return { ok: true };
}
