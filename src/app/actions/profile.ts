"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LANGUAGES } from "@/lib/constants";
import { validateHealthDetails, type HealthDetailsInput } from "@/lib/utils";
import type { ActionResult, Language } from "@/lib/types";

/** Users can change only name, phone and language (column grants in the migration). */
export async function updateMyProfile(input: { fullName?: string; language?: Language; phone?: string }): Promise<ActionResult> {
  const profile = await requireProfile();
  const patch: Record<string, string | null> = {};
  if (input.fullName !== undefined) {
    if (input.fullName.trim().length < 2) return { ok: false, error: "Enter your full name." };
    patch.full_name = input.fullName.trim();
  }
  if (input.language !== undefined) {
    if (!LANGUAGES.some((l) => l.value === input.language)) return { ok: false, error: "Unknown language." };
    patch.language = input.language;
  }
  if (input.phone !== undefined) patch.phone = input.phone.trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(patch).eq("id", profile.id);
  if (error) return { ok: false, error: "We couldn't save that. Please try again." };
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * A patient edits their own date of birth, height and weight (decision 28).
 * The normal client is enough: RLS allows it and the column grant allows it.
 * The database trigger profiles_details_audit writes the audit row for us.
 */
export async function updateMyHealthDetails(input: HealthDetailsInput): Promise<ActionResult> {
  const profile = await requireProfile("patient");

  const health = validateHealthDetails(input);
  if (!health.ok) return { ok: false, error: health.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(health.values)
    .eq("id", profile.id)
    .eq("role", "patient");
  if (error) {
    console.error("updateMyHealthDetails failed", error);
    return { ok: false, error: "We couldn't save these details. Please try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
