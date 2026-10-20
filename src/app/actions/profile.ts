"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LANGUAGES } from "@/lib/constants";
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
