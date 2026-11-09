"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { requireProfile } from "@/lib/auth";
import { requestSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { EMAIL_RE, PHONE_EMAIL_DOMAIN, ATTACHMENTS_BUCKET } from "@/lib/constants";
import { addDays, normalizePhone, todayInAppZone } from "@/lib/utils";
import { notifyConversationAsSystem } from "@/lib/push";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionResult, Clinic, DraftItem, Message, Profile } from "@/lib/types";

/**
 * Admin actions (PLAN §7 Phase E).
 *
 * SECURITY: every function here starts with `requireProfile("admin")` BEFORE it
 * creates the service-role client. The admin check is the boundary; RLS cannot be
 * trusted for admin writes because the service role bypasses it.
 *
 * Every service-role write calls logAudit() with the before/after values, so the
 * audit log shows who changed what. Never log a password, a token or the service key.
 */

// ─────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────

/** One doctor, with their clinic and how many patients they have. */
export type AdminDoctor = Profile & {
  clinicName: string | null;
  patientCount: number;
};

/** Every doctor, for the admin's list. */
export async function getAdminDoctors(): Promise<AdminDoctor[]> {
  await requireProfile("admin");
  const client = createAdminClient();

  const { data: doctors, error } = await client
    .from("profiles")
    .select("*, clinic:clinics(name)")
    .eq("role", "doctor")
    .order("full_name", { ascending: true });
  if (error) {
    console.error("getAdminDoctors failed", error);
    return [];
  }

  // How many patients each doctor has, in one query.
  const { data: convs } = await client.from("conversations").select("doctor_id");
  const counts = new Map<string, number>();
  for (const c of (convs ?? []) as { doctor_id: string }[]) {
    counts.set(c.doctor_id, (counts.get(c.doctor_id) ?? 0) + 1);
  }

  return ((doctors ?? []) as unknown as (Profile & { clinic: { name: string } | null })[]).map((d) => ({
    ...d,
    clinicName: d.clinic?.name ?? null,
    patientCount: counts.get(d.id) ?? 0,
  }));
}

/** One patient, with the doctors they see. */
export type AdminPatient = Profile & {
  /** The doctors this patient has a chat with, and whether that chat is blocked. */
  doctors: { id: string; full_name: string; conversationId: string; blockedAt: string | null }[];
  /** True when the whole account is blocked (decision 12). */
  accountBlocked: boolean;
};

/** Every patient, for the admin's list. */
export async function getAdminPatients(): Promise<AdminPatient[]> {
  await requireProfile("admin");
  const client = createAdminClient();

  const { data: patients, error } = await client
    .from("profiles")
    .select("*")
    .eq("role", "patient")
    .order("full_name", { ascending: true });
  if (error) {
    console.error("getAdminPatients failed", error);
    return [];
  }

  const { data: convs } = await client
    .from("conversations")
    .select("id, doctor_id, patient_id, blocked_at, doctor:profiles!conversations_doctor_id_fkey(id, full_name)");
  const byPatient = new Map<string, AdminPatient["doctors"]>();
  for (const c of (convs ?? []) as unknown as { id: string; doctor_id: string; patient_id: string; blocked_at: string | null; doctor: { id: string; full_name: string } }[]) {
    const list = byPatient.get(c.patient_id) ?? [];
    list.push({
      id: c.doctor.id,
      full_name: c.doctor.full_name,
      conversationId: c.id,
      blockedAt: c.blocked_at,
    });
    byPatient.set(c.patient_id, list);
  }

  return ((patients ?? []) as Profile[]).map((p) => ({
    ...p,
    doctors: byPatient.get(p.id) ?? [],
    accountBlocked: !!p.blocked_at,
  }));
}

/** Every clinic, with the doctors in it. */
export async function getAdminClinics(): Promise<(Clinic & { doctors: { id: string; full_name: string }[] })[]> {
  await requireProfile("admin");
  const client = createAdminClient();

  const { data: clinics, error } = await client.from("clinics").select("*").order("name", { ascending: true });
  if (error) {
    console.error("getAdminClinics failed", error);
    return [];
  }

  const { data: doctors } = await client
    .from("profiles")
    .select("id, full_name, clinic_id")
    .eq("role", "doctor")
    .order("full_name", { ascending: true });

  const byClinic = new Map<string, { id: string; full_name: string }[]>();
  for (const d of (doctors ?? []) as { id: string; full_name: string; clinic_id: string | null }[]) {
    if (!d.clinic_id) continue;
    const list = byClinic.get(d.clinic_id) ?? [];
    list.push({ id: d.id, full_name: d.full_name });
    byClinic.set(d.clinic_id, list);
  }

  return ((clinics ?? []) as Clinic[]).map((c) => ({ ...c, doctors: byClinic.get(c.id) ?? [] }));
}

/** The numbers on the admin overview (decision 56: counts only, no charts). */
export async function getAdminOverview(): Promise<{
  doctors: number;
  patients: number;
  conversations: number;
  meetingsThisWeek: number;
}> {
  await requireProfile("admin");
  const client = createAdminClient();

  const [doctors, patients, conversations, meetings] = await Promise.all([
    client.from("profiles").select("id", { count: "exact", head: true }).eq("role", "doctor"),
    client.from("profiles").select("id", { count: "exact", head: true }).eq("role", "patient"),
    client.from("conversations").select("id", { count: "exact", head: true }),
    // This week: from today (app time zone) to seven days ahead.
    client
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .gte("starts_at", `${todayInAppZone()}T00:00:00.000Z`)
      .lt("starts_at", `${addDays(7)}T00:00:00.000Z`),
  ]);

  return {
    doctors: doctors.count ?? 0,
    patients: patients.count ?? 0,
    conversations: conversations.count ?? 0,
    meetingsThisWeek: meetings.count ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────────
// Doctors (decisions 18, 44, 52)
// ─────────────────────────────────────────────────────────────────

/**
 * Create a one-time link a doctor can use to join (decision 44).
 * The link's one-time token is the boundary, like a patient invite link.
 */
export async function createDoctorInviteLink(input: {
  fullName: string;
}): Promise<ActionResult<{ url: string; expiresAt: string }>> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const fullName = input.fullName.trim();
  if (fullName.length < 2) return { ok: false, error: "Enter the doctor's full name." };

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const { data, error } = await client
    .from("invite_links")
    .insert({ token, role: "doctor", expires_at: expiresAt })
    .select("expires_at")
    .single();
  if (error || !data) {
    console.error("createDoctorInviteLink failed", error);
    return { ok: false, error: "We couldn't create a link. Please try again." };
  }

  await logAudit(client, admin, {
    action: "admin.doctor_invite_created",
    targetType: "invite_link",
    details: { full_name: fullName, role: "doctor" },
  });

  revalidatePath("/admin/doctors");
  return { ok: true, data: { url: `${await requestSiteUrl()}/join/${token}`, expiresAt: data.expires_at } };
}

/**
 * Create a one-time link a patient can use to join one doctor (decision 45).
 * The link's one-time token is the boundary. The link belongs to the chosen doctor,
 * so the patient lands in that doctor's chat.
 */
export async function createAdminPatientInviteLink(input: {
  fullName: string;
  doctorId: string;
}): Promise<ActionResult<{ url: string; expiresAt: string }>> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const fullName = input.fullName.trim();
  if (fullName.length < 2) return { ok: false, error: "Enter the patient's full name." };

  const { data: doctor } = await client.from("profiles").select("id, full_name").eq("id", input.doctorId).eq("role", "doctor").maybeSingle();
  if (!doctor) return { ok: false, error: "Doctor not found." };

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const { data, error } = await client
    .from("invite_links")
    .insert({ token, role: "patient", doctor_id: doctor.id, expires_at: expiresAt })
    .select("expires_at")
    .single();
  if (error || !data) {
    console.error("createAdminPatientInviteLink failed", error);
    return { ok: false, error: "We couldn't create a link. Please try again." };
  }

  await logAudit(client, admin, {
    action: "admin.patient_invite_created",
    targetType: "invite_link",
    details: { full_name: fullName, doctor_id: doctor.id },
  });

  revalidatePath("/admin/patients");
  return { ok: true, data: { url: `${await requestSiteUrl()}/join/${token}`, expiresAt: data.expires_at } };
}

export type DoctorJoinState = { error?: string; values?: { fullName: string; email: string; phone: string; specialty: string; regNo: string } };

/**
 * Public: the doctor makes their own account from the admin's link (decision 44).
 * The one-time token is the boundary, like a patient invite link. The doctor joins
 * alone: no patient, no conversation.
 */
export async function joinWithDoctorInviteLink(
  token: string,
  _prev: DoctorJoinState,
  formData: FormData,
): Promise<DoctorJoinState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const specialty = String(formData.get("specialty") ?? "").trim();
  const regNo = String(formData.get("regNo") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const values = { fullName, email, phone: phoneRaw, specialty, regNo };

  if (fullName.length < 2) return { error: "Enter your full name.", values };
  if (!email && !phoneRaw) return { error: "Add your email or your mobile number, so you can sign in later.", values };
  if (email && !EMAIL_RE.test(email)) return { error: "That email doesn't look right. Check it and try again.", values };
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (phoneRaw && !phone) return { error: "Enter a 10-digit Indian mobile number.", values };
  if (password.length < 8) return { error: "Use at least 8 characters for your password.", values };

  // The token is the boundary: it must be a valid, unused, unexpired doctor link.
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return { error: "This link doesn't work any more.", values };
  const client = createAdminClient();
  const { data: link } = await client
    .from("invite_links")
    .select("id, role, used_at, revoked_at, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!link || link.revoked_at || link.role !== "doctor") return { error: "This link doesn't work any more.", values };
  if (link.used_at) return { error: "This link has already been used.", values };
  if (new Date(link.expires_at).getTime() < Date.now()) return { error: "This link has expired. Ask CareConnect for a new one.", values };

  // Claim the link first, so it can't be used twice at the same moment.
  const { data: claimed } = await client
    .from("invite_links")
    .update({ used_at: new Date().toISOString() })
    .eq("id", link.id)
    .is("used_at", null)
    .is("revoked_at", null)
    .eq("role", "doctor")
    .select("id")
    .maybeSingle();
  if (!claimed) return { error: "This link has already been used.", values };
  const release = () => client.from("invite_links").update({ used_at: null }).eq("id", claimed.id);

  const authEmail = email || `${phone!.slice(1)}@${PHONE_EMAIL_DOMAIN}`;
  const { data: created, error: createError } = await client.auth.admin.createUser({
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
    console.error("joinWithDoctorInviteLink createUser failed", createError);
    return { error: "We couldn't create your account. Please try again.", values };
  }

  const doctorId = created.user.id;
  const { error: profileError } = await client
    .from("profiles")
    .update({
      role: "doctor",
      full_name: fullName,
      email: email || null,
      phone,
      specialty: specialty || null,
      reg_no: regNo || null,
      status: "active",
      activated_at: new Date().toISOString(),
    })
    .eq("id", doctorId);
  if (profileError) {
    // Remove the half-made account, so it can't sign in and the link can be used again.
    await client.auth.admin.deleteUser(doctorId);
    await release();
    console.error("joinWithDoctorInviteLink profile failed", profileError);
    return { error: "We couldn't set up your account. Please try again.", values };
  }

  await client.from("invite_links").update({ used_by: doctorId }).eq("id", claimed.id);
  await logAudit(client, null, {
    action: "invite.accepted",
    targetType: "profile",
    targetId: doctorId,
    details: { role: "doctor", invite_link_id: claimed.id },
  });

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: authEmail, password });
  if (signInError) redirect("/login");
  redirect("/doctor");
}

/** Invite a doctor by email: Supabase sends the invite, we set their profile. */
export async function inviteDoctorByEmail(input: {
  fullName: string;
  email: string;
  specialty?: string;
  regNo?: string;
}): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  if (fullName.length < 2) return { ok: false, error: "Enter the doctor's full name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };

  const { data: invited, error: inviteError } = await client.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${await requestSiteUrl()}/auth/confirm`,
  });
  if (inviteError) {
    if (!/already (been )?registered|already exists/i.test(inviteError.message)) {
      console.error("inviteDoctorByEmail failed", inviteError);
      return { ok: false, error: "We couldn't send the invitation. Check the email address and try again." };
    }
    return { ok: false, error: "This email already has an account." };
  }
  const doctorId = invited.user?.id;
  if (!doctorId) return { ok: false, error: "We couldn't create the invitation. Please try again." };

  const { error } = await client
    .from("profiles")
    .update({
      role: "doctor",
      full_name: fullName,
      specialty: input.specialty?.trim() || null,
      reg_no: input.regNo?.trim() || null,
    })
    .eq("id", doctorId);
  if (error) {
    console.error("inviteDoctorByEmail profile failed", error);
    return { ok: false, error: "The invitation was sent but the profile wasn't set up. Please try again." };
  }

  await logAudit(client, admin, {
    action: "admin.doctor_invited",
    targetType: "profile",
    targetId: doctorId,
    details: { email, full_name: fullName },
  });

  revalidatePath("/admin/doctors");
  return { ok: true };
}

/** The doctor's name, specialty, registration number and clinic. */
export type AdminDoctorDetails = {
  fullName: string;
  specialty: string;
  regNo: string;
  /** The clinic's id, or "" for no clinic. */
  clinicId: string;
};

/** Edit a doctor's details. */
export async function updateAdminDoctor(doctorId: string, input: AdminDoctorDetails): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const fullName = input.fullName.trim();
  if (fullName.length < 2) return { ok: false, error: "Enter the doctor's full name." };

  const { data: before } = await client
    .from("profiles")
    .select("full_name, specialty, reg_no, clinic_id")
    .eq("id", doctorId)
    .eq("role", "doctor")
    .maybeSingle();
  if (!before) return { ok: false, error: "Doctor not found." };

  const after = {
    full_name: fullName,
    specialty: input.specialty.trim() || null,
    reg_no: input.regNo.trim() || null,
    clinic_id: input.clinicId || null,
  };
  const { error } = await client.from("profiles").update(after).eq("id", doctorId).eq("role", "doctor");
  if (error) {
    console.error("updateAdminDoctor failed", error);
    return { ok: false, error: "We couldn't save these details. Please try again." };
  }

  await logAudit(client, admin, {
    action: "admin.doctor_updated",
    targetType: "profile",
    targetId: doctorId,
    details: { before, after },
  });

  revalidatePath("/admin/doctors");
  return { ok: true };
}

/**
 * Deactivate or reactivate a doctor (decision 52). Their patients can still read
 * their history, but nobody can send anything in their chats (can_write() checks it).
 */
export async function setDoctorDeactivated(doctorId: string, deactivated: boolean): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const { data: before } = await client
    .from("profiles")
    .select("full_name, deactivated_at")
    .eq("id", doctorId)
    .eq("role", "doctor")
    .maybeSingle();
  if (!before) return { ok: false, error: "Doctor not found." };

  const after = { deactivated_at: deactivated ? new Date().toISOString() : null };
  const { error } = await client.from("profiles").update(after).eq("id", doctorId).eq("role", "doctor");
  if (error) {
    console.error("setDoctorDeactivated failed", error);
    return {
      ok: false,
      error: deactivated
        ? "We couldn't deactivate this doctor. Please try again."
        : "We couldn't reactivate this doctor. Please try again.",
    };
  }

  await logAudit(client, admin, {
    action: deactivated ? "admin.doctor_deactivated" : "admin.doctor_reactivated",
    targetType: "profile",
    targetId: doctorId,
    details: { before, after },
  });

  revalidatePath("/admin/doctors");
  return { ok: true };
}

/**
 * The doctor's own settings: "also consults" (on / off / follow the clinic) and
 * "mark meetings complete automatically".
 */
export async function updateAdminDoctorSettings(
  doctorId: string,
  input: { showOtherDoctors: boolean | null; meetingAutoComplete: boolean },
): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const { data: before } = await client
    .from("profiles")
    .select("show_other_doctors, meeting_auto_complete")
    .eq("id", doctorId)
    .eq("role", "doctor")
    .maybeSingle();
  if (!before) return { ok: false, error: "Doctor not found." };

  const after = {
    show_other_doctors: input.showOtherDoctors,
    meeting_auto_complete: input.meetingAutoComplete,
  };
  const { error } = await client.from("profiles").update(after).eq("id", doctorId).eq("role", "doctor");
  if (error) {
    console.error("updateAdminDoctorSettings failed", error);
    return { ok: false, error: "We couldn't save these settings. Please try again." };
  }

  await logAudit(client, admin, {
    action: "admin.doctor_settings_updated",
    targetType: "profile",
    targetId: doctorId,
    details: { before, after },
  });

  revalidatePath("/admin/doctors");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
// Patients (decisions 12, 14, 45, 46)
// ─────────────────────────────────────────────────────────────────

/**
 * Add a doctor to a patient (decision 45). The conversation is created if it isn't
 * there yet. The patient's name and their first inviter are never overwritten
 * (decision 14).
 */
export async function addDoctorToPatient(patientId: string, doctorId: string): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const { data: patient } = await client
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", patientId)
    .eq("role", "patient")
    .maybeSingle();
  if (!patient) return { ok: false, error: "Patient not found." };

  const { data: doctor } = await client
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", doctorId)
    .eq("role", "doctor")
    .maybeSingle();
  if (!doctor) return { ok: false, error: "Doctor not found." };

  const { data: existing } = await client
    .from("conversations")
    .select("id")
    .eq("doctor_id", doctorId)
    .eq("patient_id", patientId)
    .maybeSingle();
  if (existing) {
    return { ok: false, error: `${doctor.full_name} already sees this patient.` };
  }

  const { data: conv, error } = await client
    .from("conversations")
    .insert({ doctor_id: doctorId, patient_id: patientId })
    .select("id")
    .single();
  if (error || !conv) {
    console.error("addDoctorToPatient failed", error);
    return { ok: false, error: "We couldn't add this doctor. Please try again." };
  }

  await logAudit(client, admin, {
    action: "admin.patient_doctor_added",
    targetType: "conversation",
    targetId: conv.id,
    details: { patient_id: patientId, doctor_id: doctorId },
  });

  revalidatePath("/admin/patients");
  return { ok: true };
}

/**
 * Invite a patient and assign them to one or more doctors (decision 45).
 * A patient who already has an account keeps their name and their first inviter
 * (decision 14); only the conversations are added.
 */
export async function inviteAdminPatient(input: {
  fullName: string;
  email: string;
  doctorIds: string[];
}): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  if (fullName.length < 2) return { ok: false, error: "Enter the patient's full name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (input.doctorIds.length === 0) return { ok: false, error: "Choose at least one doctor." };

  // Every chosen doctor must really be a doctor.
  const { data: doctors } = await client.from("profiles").select("id, full_name").in("id", input.doctorIds).eq("role", "doctor");
  if ((doctors ?? []).length !== input.doctorIds.length) {
    return { ok: false, error: "One of the chosen doctors isn't there any more. Please try again." };
  }

  // A patient who already has an account: reuse it, don't touch their name.
  const { data: existingProfile } = await client.from("profiles").select("id, full_name, role").eq("email", email).maybeSingle();
  if (existingProfile) {
    if (existingProfile.role !== "patient") return { ok: false, error: "This email belongs to a doctor or admin account." };
    const patientId = existingProfile.id;
    const { error: convError } = await client
      .from("conversations")
      .upsert(
        input.doctorIds.map((doctorId) => ({ doctor_id: doctorId, patient_id: patientId })),
        { onConflict: "doctor_id,patient_id" },
      );
    if (convError) {
      console.error("inviteAdminPatient conversations failed", convError);
      return { ok: false, error: "We couldn't connect this patient to their doctors. Please try again." };
    }
    await logAudit(client, admin, {
      action: "admin.patient_assigned",
      targetType: "profile",
      targetId: patientId,
      details: { email, doctor_ids: input.doctorIds, existing: true },
    });
    revalidatePath("/admin/patients");
    return { ok: true };
  }

  // A new patient: Supabase sends the invite email.
  const { data: invited, error: inviteError } = await client.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${await requestSiteUrl()}/auth/confirm`,
  });
  if (inviteError) {
    console.error("inviteAdminPatient invite failed", inviteError);
    return { ok: false, error: "We couldn't send the invitation. Check the email address and try again." };
  }
  const patientId = invited.user?.id;
  if (!patientId) return { ok: false, error: "We couldn't create the invitation. Please try again." };

  const { error: profileError } = await client
    .from("profiles")
    .update({ role: "patient", full_name: fullName })
    .eq("id", patientId);
  if (profileError) {
    console.error("inviteAdminPatient profile failed", profileError);
    return { ok: false, error: "The invitation was sent but the profile wasn't set up. Please try again." };
  }

  const { error: convError } = await client
    .from("conversations")
    .upsert(
      input.doctorIds.map((doctorId) => ({ doctor_id: doctorId, patient_id: patientId })),
      { onConflict: "doctor_id,patient_id" },
    );
  if (convError) {
    console.error("inviteAdminPatient conversations failed", convError);
    return { ok: false, error: "The invitation was sent but the chats couldn't be created. Please try again." };
  }

  await logAudit(client, admin, {
    action: "admin.patient_invited",
    targetType: "profile",
    targetId: patientId,
    details: { email, full_name: fullName, doctor_ids: input.doctorIds },
  });

  revalidatePath("/admin/patients");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
// Conversations, messages and files (decisions 47–50, 54–55, Q-J)
// ─────────────────────────────────────────────────────────────────

/**
 * The admin opens a chat (decision 55: views are recorded).
 * Called from the server page, once per conversation, not per re-render.
 */
export async function logAdminConversationView(conversationId: string): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const { data: conv } = await client
    .from("conversations")
    .select("id, doctor_id, patient_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv) return { ok: false, error: "Chat not found." };

  // The page re-renders after every admin action and file open. One "viewed" row per
  // visit is the record (decision 55); skip it if this admin viewed this chat in the last 30 minutes.
  const since = new Date(Date.now() - 30 * 60_000).toISOString();
  const { data: recent } = await client
    .from("audit_log")
    .select("id")
    .eq("actor_id", admin.id)
    .eq("action", "admin.conversation_viewed")
    .eq("target_id", conversationId)
    .gte("created_at", since)
    .limit(1);
  if (recent?.length) return { ok: true };

  await logAudit(client, admin, {
    action: "admin.conversation_viewed",
    targetType: "conversation",
    targetId: conversationId,
  });

  return { ok: true };
}

/**
 * The admin opens a report (decision 55: views of files are recorded too).
 * The file itself is served by getFileUrl() with the normal client, which RLS opens to
 * the admin.
 */
export async function logAdminFileView(messageId: string, conversationId: string): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const { data: message } = await client
    .from("messages")
    .select("id, file_name")
    .eq("id", messageId)
    .maybeSingle();
  if (!message) return { ok: false, error: "File not found." };

  await logAudit(client, admin, {
    action: "admin.file_viewed",
    targetType: "message",
    targetId: messageId,
    details: { conversation_id: conversationId, file_name: message.file_name },
  });

  return { ok: true };
}

/**
 * The admin sends a message (decision 48). It is labelled "CareConnect Admin" on both
 * sides (Q-J): the DB trigger sets sender_role from the admin's profile.
 */
export async function sendAdminMessage(conversationId: string, body: string): Promise<ActionResult<Message>> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const text = body.trim();
  if (!text) return { ok: false, error: "Type a message first." };
  if (text.length > 4000) return { ok: false, error: "That message is too long. Please split it up." };

  const { data: conv } = await client
    .from("conversations")
    .select("id, doctor_id, patient_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv) return { ok: false, error: "Chat not found." };

  const { data, error } = await client
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: admin.id, kind: "text", body: text })
    .select("*")
    .single();
  if (error || !data) {
    console.error("sendAdminMessage failed", error);
    return { ok: false, error: "Not sent. Check your internet and try again." };
  }

  await logAudit(client, admin, {
    action: "admin.message_sent",
    targetType: "message",
    targetId: data.id,
    details: { conversation_id: conversationId },
  });

  // Both sides get the same short note. Never the message itself.
  await notifyConversationAsSystem(conversationId, "message", "CareConnect Admin");
  revalidatePath(`/admin/c/${conversationId}`);
  return { ok: true, data: data as Message };
}

/**
 * Keeps the conversation's inbox preview honest after the admin edits or removes a
 * message. The DB trigger only runs on insert, so without this the inbox would keep
 * showing the old words.
 */
async function refreshConversationPreview(client: SupabaseClient, conversationId: string) {
  const { data } = await client
    .from("messages")
    .select("kind, body, file_name, created_at")
    .eq("conversation_id", conversationId)
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const last = (data ?? [])[0] as { kind: string; body: string | null; file_name: string | null } | undefined;
  if (!last) {
    await client.from("conversations").update({ last_message_preview: null, last_message_at: null }).eq("id", conversationId);
    return;
  }
  const preview =
    last.kind === "text"
      ? (last.body ?? "").slice(0, 140)
      : last.kind === "file"
        ? `Sent ${last.file_name ?? "a file"}`
        : last.kind === "meeting"
          ? "Video meeting"
          : last.kind === "check_in"
            ? "Check-in"
            : "Prescription";
  await client.from("conversations").update({ last_message_preview: preview }).eq("id", conversationId);
}

/**
 * The admin edits a message (decision 49). The body changes and edited_at is set, so
 * both sides see "Edited".
 */
export async function editAdminMessage(messageId: string, body: string): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const text = body.trim();
  if (!text) return { ok: false, error: "Type a message first." };
  if (text.length > 4000) return { ok: false, error: "That message is too long. Please split it up." };

  const { data: before } = await client
    .from("messages")
    .select("id, body, conversation_id, kind, removed_at")
    .eq("id", messageId)
    .maybeSingle();
  if (!before) return { ok: false, error: "Message not found." };
  if (before.removed_at) return { ok: false, error: "This message was removed." };
  if (before.kind !== "text") return { ok: false, error: "Only text messages can be edited." };

  const { error } = await client
    .from("messages")
    .update({ body: text, edited_at: new Date().toISOString() })
    .eq("id", messageId);
  if (error) {
    console.error("editAdminMessage failed", error);
    return { ok: false, error: "We couldn't change this message. Please try again." };
  }

  // The before/after body is the record decision 49 asks for.
  await logAudit(client, admin, {
    action: "message.edited",
    targetType: "message",
    targetId: messageId,
    details: { before: { body: before.body }, after: { body: text }, conversation_id: before.conversation_id },
  });

  // The inbox preview showed the old words.
  await refreshConversationPreview(client, before.conversation_id);
  revalidatePath(`/admin/c/${before.conversation_id}`);
  return { ok: true };
}

/**
 * The admin removes a message (decision 50). Everyone sees "Message removed by admin".
 * A file message also loses its file from Storage.
 */
export async function removeAdminMessage(messageId: string): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const { data: before } = await client
    .from("messages")
    .select("id, body, conversation_id, kind, file_path, file_name, removed_at")
    .eq("id", messageId)
    .maybeSingle();
  if (!before) return { ok: false, error: "Message not found." };
  if (before.removed_at) return { ok: false, error: "This message was already removed." };

  const removedAt = new Date().toISOString();
  // A removed report loses its file details too, like remove_report() does, so the
  // chat does not point at a file that is gone.
  const after = {
    removed_at: removedAt,
    removed_by: admin.id,
    ...(before.kind === "file" && before.file_path
      ? { file_path: null, file_name: null, file_size: null, file_type: null }
      : {}),
  };
  const { error } = await client
    .from("messages")
    .update(after)
    .eq("id", messageId)
    .is("removed_at", null);
  if (error) {
    console.error("removeAdminMessage failed", error);
    return { ok: false, error: "We couldn't remove this message. Please try again." };
  }

  // A report's file goes too, so nothing is left behind.
  if (before.kind === "file" && before.file_path) {
    const { error: storageError } = await client.storage.from(ATTACHMENTS_BUCKET).remove([before.file_path]);
    if (storageError) console.error("removeAdminMessage: file not deleted", before.file_path, storageError);
  }

  await logAudit(client, admin, {
    action: "message.removed",
    targetType: "message",
    targetId: messageId,
    details: {
      before: { body: before.body, file_name: before.file_name },
      after: { removed_at: removedAt, removed_by: admin.id },
      conversation_id: before.conversation_id,
    },
  });

  // The inbox preview showed the removed words.
  await refreshConversationPreview(client, before.conversation_id);
  revalidatePath(`/admin/c/${before.conversation_id}`);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
// Prescriptions (Q-C: cancel, and a correction on the doctor's behalf)
// ─────────────────────────────────────────────────────────────────

/**
 * The admin cancels an issued prescription (Q-C). The row stays on record and shows
 * as "Cancelled by admin"; nothing else about it changes. The DB trigger allows
 * exactly this one change, once.
 */
export async function cancelAdminPrescription(prescriptionId: string): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const { data: before } = await client
    .from("prescriptions")
    .select("id, status, cancelled_at, cancelled_by, doctor_id, conversation_id")
    .eq("id", prescriptionId)
    .maybeSingle();
  if (!before) return { ok: false, error: "Prescription not found." };
  if (before.cancelled_at) return { ok: false, error: "This prescription is already cancelled." };
  if (before.status !== "issued") return { ok: false, error: "Only an issued prescription can be cancelled." };

  const cancelledAt = new Date().toISOString();
  const { error } = await client
    .from("prescriptions")
    .update({ cancelled_at: cancelledAt, cancelled_by: admin.id })
    .eq("id", prescriptionId)
    .is("cancelled_at", null);
  if (error) {
    console.error("cancelAdminPrescription failed", error);
    return { ok: false, error: "We couldn't cancel this prescription. Please try again." };
  }

  await logAudit(client, admin, {
    action: "rx.cancelled_by_admin",
    targetType: "prescription",
    targetId: prescriptionId,
    details: {
      before: { cancelled_at: null, cancelled_by: null },
      after: { cancelled_at: cancelledAt, cancelled_by: admin.id },
      doctor_id: before.doctor_id,
      conversation_id: before.conversation_id,
    },
  });

  revalidatePath(`/admin/c/${before.conversation_id}`);
  revalidatePath("/prescriptions");
  return { ok: true };
}

/**
 * The admin writes a correction of an issued prescription, on the doctor's behalf (Q-C).
 *
 * The draft is created with the conversation's doctor as the doctor, so the doctor sees
 * it in their own panel and issues it from there: issue_prescription() checks auth.uid(),
 * so only the signed-in doctor can issue it. The admin never issues it.
 */
export async function createAdminCorrectionDraft(input: {
  conversationId: string;
  replacesId: string;
  items: DraftItem[];
  diagnosis?: string;
  advice?: string;
}): Promise<ActionResult<{ id: string }>> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const { data: conv } = await client
    .from("conversations")
    .select("id, doctor_id, patient_id")
    .eq("id", input.conversationId)
    .maybeSingle();
  if (!conv) return { ok: false, error: "Chat not found." };

  const { data: original } = await client
    .from("prescriptions")
    .select("id, status, doctor_id, conversation_id")
    .eq("id", input.replacesId)
    .maybeSingle();
  if (!original) return { ok: false, error: "Prescription not found." };
  if (original.status !== "issued") return { ok: false, error: "Only an issued prescription can be corrected." };
  if (original.conversation_id !== input.conversationId) {
    return { ok: false, error: "That prescription belongs to a different chat." };
  }

  const items = input.items
    .map((i) => ({
      medicine: i.medicine.trim(),
      dose: i.dose.trim(),
      frequency: i.frequency.trim(),
      duration: i.duration.trim(),
      timing: i.timing?.trim() || null,
    }))
    .filter((i) => i.medicine);
  if (!items.length) return { ok: false, error: "Add at least one medicine." };
  const incomplete = items.find((i) => !i.dose || !i.frequency || !i.duration);
  if (incomplete) return { ok: false, error: `Add dose, frequency and duration for ${incomplete.medicine}.` };

  const { data: draft, error } = await client
    .from("prescriptions")
    .insert({
      conversation_id: input.conversationId,
      doctor_id: conv.doctor_id,
      patient_id: conv.patient_id,
      replaces_id: input.replacesId,
      diagnosis: input.diagnosis?.trim() || null,
      advice: input.advice?.trim() || null,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !draft) {
    console.error("createAdminCorrectionDraft failed", error);
    return { ok: false, error: "We couldn't start the correction. Please try again." };
  }

  const { error: itemError } = await client
    .from("prescription_items")
    .insert(items.map((i, position) => ({ ...i, position, prescription_id: draft.id })));
  if (itemError) {
    // Don't leave a half-made draft behind.
    await client.from("prescription_items").delete().eq("prescription_id", draft.id);
    await client.from("prescriptions").delete().eq("id", draft.id);
    console.error("createAdminCorrectionDraft items failed", itemError);
    return { ok: false, error: "We couldn't save the medicines. Please try again." };
  }

  await logAudit(client, admin, {
    action: "admin.correction_draft_created",
    targetType: "prescription",
    targetId: draft.id,
    details: {
      before: { replaces_id: input.replacesId },
      after: { status: "draft", doctor_id: conv.doctor_id, medicines: items.map((i) => i.medicine) },
      conversation_id: input.conversationId,
    },
  });

  revalidatePath(`/admin/c/${input.conversationId}`);
  return { ok: true, data: { id: draft.id } };
}

/**
 * Block one chat (decision 11): the patient can't send in that doctor's chat only.
 * They keep their other chats and can still read this one.
 */
export async function setAdminConversationBlocked(conversationId: string, blocked: boolean): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const { data: before } = await client
    .from("conversations")
    .select("id, doctor_id, patient_id, blocked_at")
    .eq("id", conversationId)
    .maybeSingle();
  if (!before) return { ok: false, error: "Chat not found." };

  const after = { blocked_at: blocked ? new Date().toISOString() : null };
  const { error } = await client.from("conversations").update(after).eq("id", conversationId);
  if (error) {
    console.error("setAdminConversationBlocked failed", error);
    return { ok: false, error: blocked ? "We couldn't block this chat. Please try again." : "We couldn't unblock this chat. Please try again." };
  }

  await logAudit(client, admin, {
    action: blocked ? "conversation.blocked" : "conversation.unblocked",
    targetType: "conversation",
    targetId: conversationId,
    details: { before, after, by: "admin" },
  });

  revalidatePath("/admin/patients");
  return { ok: true };
}

/**
 * Block the whole account (decision 12): the patient can't sign in or send anywhere.
 * `profiles.blocked_at` is what `requireProfile()` and `can_write()` already check.
 */
export async function setAdminAccountBlocked(patientId: string, blocked: boolean): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const { data: before } = await client
    .from("profiles")
    .select("id, full_name, blocked_at")
    .eq("id", patientId)
    .eq("role", "patient")
    .maybeSingle();
  if (!before) return { ok: false, error: "Patient not found." };

  const after = { blocked_at: blocked ? new Date().toISOString() : null };
  const { error } = await client.from("profiles").update(after).eq("id", patientId).eq("role", "patient");
  if (error) {
    console.error("setAdminAccountBlocked failed", error);
    return { ok: false, error: blocked ? "We couldn't block this account. Please try again." : "We couldn't unblock this account. Please try again." };
  }

  await logAudit(client, admin, {
    action: blocked ? "profile.account_blocked" : "profile.account_unblocked",
    targetType: "profile",
    targetId: patientId,
    details: { before, after },
  });

  revalidatePath("/admin/patients");
  return { ok: true };
}

/** The patient's own "also consults" setting: on / off / follow the doctor. */
export async function updateAdminPatientSettings(
  patientId: string,
  input: { showOtherDoctors: boolean | null },
): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const { data: before } = await client
    .from("profiles")
    .select("show_other_doctors")
    .eq("id", patientId)
    .eq("role", "patient")
    .maybeSingle();
  if (!before) return { ok: false, error: "Patient not found." };

  const after = { show_other_doctors: input.showOtherDoctors };
  const { error } = await client.from("profiles").update(after).eq("id", patientId).eq("role", "patient");
  if (error) {
    console.error("updateAdminPatientSettings failed", error);
    return { ok: false, error: "We couldn't save this setting. Please try again." };
  }

  await logAudit(client, admin, {
    action: "admin.patient_settings_updated",
    targetType: "profile",
    targetId: patientId,
    details: { before, after },
  });

  revalidatePath("/admin/patients");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
// Clinics (Q-B)
// ─────────────────────────────────────────────────────────────────

/** Create a clinic. Its name is 2 to 120 characters (the database check). */
export async function createClinic(name: string): Promise<ActionResult<{ id: string }>> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const clean = name.trim();
  if (clean.length < 2) return { ok: false, error: "Enter the clinic's name." };
  if (clean.length > 120) return { ok: false, error: "That name is too long." };

  const { data, error } = await client.from("clinics").insert({ name: clean }).select("id").single();
  if (error || !data) {
    console.error("createClinic failed", error);
    return { ok: false, error: "We couldn't create the clinic. Please try again." };
  }

  await logAudit(client, admin, {
    action: "admin.clinic_created",
    targetType: "clinic",
    targetId: data.id,
    details: { name: clean },
  });

  revalidatePath("/admin/clinics");
  return { ok: true, data: { id: data.id } };
}

/** Rename a clinic. */
export async function renameClinic(clinicId: string, name: string): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const clean = name.trim();
  if (clean.length < 2) return { ok: false, error: "Enter the clinic's name." };
  if (clean.length > 120) return { ok: false, error: "That name is too long." };

  const { data: before } = await client.from("clinics").select("name").eq("id", clinicId).maybeSingle();
  if (!before) return { ok: false, error: "Clinic not found." };

  const { error } = await client.from("clinics").update({ name: clean }).eq("id", clinicId);
  if (error) {
    console.error("renameClinic failed", error);
    return { ok: false, error: "We couldn't rename the clinic. Please try again." };
  }

  await logAudit(client, admin, {
    action: "admin.clinic_renamed",
    targetType: "clinic",
    targetId: clinicId,
    details: { before, after: { name: clean } },
  });

  revalidatePath("/admin/clinics");
  return { ok: true };
}

/**
 * The clinic's "also consults" setting: on / off / follow the doctor (null = not set here).
 */
export async function updateClinicSettings(
  clinicId: string,
  input: { showOtherDoctors: boolean | null },
): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const { data: before } = await client.from("clinics").select("show_other_doctors").eq("id", clinicId).maybeSingle();
  if (!before) return { ok: false, error: "Clinic not found." };

  const after = { show_other_doctors: input.showOtherDoctors };
  const { error } = await client.from("clinics").update(after).eq("id", clinicId);
  if (error) {
    console.error("updateClinicSettings failed", error);
    return { ok: false, error: "We couldn't save this setting. Please try again." };
  }

  await logAudit(client, admin, {
    action: "admin.clinic_settings_updated",
    targetType: "clinic",
    targetId: clinicId,
    details: { before, after },
  });

  revalidatePath("/admin/clinics");
  return { ok: true };
}

/**
 * Put a doctor in a clinic, or take them out ("" = no clinic).
 * A doctor belongs to at most one clinic (Q-B).
 */
export async function setDoctorClinic(doctorId: string, clinicId: string): Promise<ActionResult> {
  const admin = await requireProfile("admin");
  const client = createAdminClient();

  const { data: before } = await client
    .from("profiles")
    .select("full_name, clinic_id")
    .eq("id", doctorId)
    .eq("role", "doctor")
    .maybeSingle();
  if (!before) return { ok: false, error: "Doctor not found." };

  const after = { clinic_id: clinicId || null };
  const { error } = await client.from("profiles").update(after).eq("id", doctorId).eq("role", "doctor");
  if (error) {
    console.error("setDoctorClinic failed", error);
    return { ok: false, error: "We couldn't change this doctor's clinic. Please try again." };
  }

  await logAudit(client, admin, {
    action: "admin.doctor_clinic_changed",
    targetType: "profile",
    targetId: doctorId,
    details: { before, after },
  });

  revalidatePath("/admin/clinics");
  revalidatePath("/admin/doctors");
  return { ok: true };
}
