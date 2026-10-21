"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

// The doctor's master medicine list. There is deliberately no delete: medicines are
// deactivated (hidden from suggestions) or merged into another, so nothing is ever lost.

function clean(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function refresh() {
  revalidatePath("/doctor/settings/medicines");
  revalidatePath("/doctor", "layout");
}

function duplicate(error: { code?: string } | null) {
  return error?.code === "23505";
}

export async function addMedicine(input: { name: string; defaultDose?: string }): Promise<ActionResult<{ id: string }>> {
  const doctor = await requireProfile("doctor");
  const name = clean(input.name);
  if (name.length < 2) return { ok: false, error: "Enter the medicine name and strength, e.g. Paracetamol 650 mg." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medicines")
    .insert({ doctor_id: doctor.id, name, default_dose: input.defaultDose?.trim() || null })
    .select("id")
    .single();
  if (duplicate(error)) return { ok: false, error: `${name} is already in your list.` };
  if (error || !data) return { ok: false, error: "We couldn't add this medicine. Please try again." };
  refresh();
  return { ok: true, data: { id: data.id } };
}

export async function updateMedicine(id: string, input: { name: string; defaultDose?: string }): Promise<ActionResult> {
  await requireProfile("doctor");
  const name = clean(input.name);
  if (name.length < 2) return { ok: false, error: "Enter the medicine name and strength." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("medicines")
    .update({ name, default_dose: input.defaultDose?.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("merged_into", null);
  if (duplicate(error)) return { ok: false, error: `${name} is already in your list.` };
  if (error) return { ok: false, error: "We couldn't save this medicine. Please try again." };
  refresh();
  return { ok: true };
}

export async function setMedicineActive(id: string, active: boolean): Promise<ActionResult> {
  await requireProfile("doctor");
  const supabase = await createClient();
  const { error } = await supabase
    .from("medicines")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("merged_into", null);
  if (error) return { ok: false, error: "We couldn't update this medicine. Please try again." };
  refresh();
  return { ok: true };
}

/** Fold a duplicate into the one to keep. The duplicate stays on record, inactive, pointing at the kept one. */
export async function mergeMedicine(duplicateId: string, keepId: string): Promise<ActionResult> {
  await requireProfile("doctor");
  if (duplicateId === keepId) return { ok: false, error: "Pick a different medicine to merge into." };
  const supabase = await createClient();
  const { data: keep } = await supabase.from("medicines").select("id, merged_into").eq("id", keepId).maybeSingle();
  if (!keep || keep.merged_into) return { ok: false, error: "That medicine can't be merged into. Pick another." };
  const { error } = await supabase
    .from("medicines")
    .update({ active: false, merged_into: keepId, updated_at: new Date().toISOString() })
    .eq("id", duplicateId)
    .is("merged_into", null);
  if (error) return { ok: false, error: "We couldn't merge these medicines. Please try again." };
  // Anything already merged into the duplicate now points at the kept one too.
  await supabase.from("medicines").update({ merged_into: keepId }).eq("merged_into", duplicateId);
  refresh();
  return { ok: true };
}
