"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, DraftItem } from "@/lib/types";

export type DraftInput = {
  id?: string; // omit to create a new draft
  conversationId: string;
  patientId: string;
  diagnosis?: string;
  advice?: string;
  replacesId?: string | null; // set when issuing a correction of an earlier prescription
  items: DraftItem[];
};

function cleanItems(items: DraftItem[]) {
  return items
    .map((i) => ({
      medicine: i.medicine.trim(),
      dose: i.dose.trim(),
      frequency: i.frequency.trim(),
      duration: i.duration.trim(),
      timing: i.timing?.trim() || null,
    }))
    .filter((i) => i.medicine);
}

/** Create or update a draft. Drafts are private to the doctor until issued. */
export async function saveDraft(input: DraftInput): Promise<ActionResult<{ id: string }>> {
  const doctor = await requireProfile("doctor");
  const items = cleanItems(input.items);
  const incomplete = items.find((i) => !i.dose || !i.frequency || !i.duration);
  if (incomplete) return { ok: false, error: `Add dose, frequency and duration for ${incomplete.medicine}.` };

  const supabase = await createClient();
  const fields = { diagnosis: input.diagnosis?.trim() || null, advice: input.advice?.trim() || null };

  let id = input.id;
  if (id) {
    // RLS only matches the doctor's own drafts, so 0 rows = issued or not yours.
    const { data: updated, error } = await supabase.from("prescriptions").update(fields).eq("id", id).eq("status", "draft").select("id").maybeSingle();
    if (error || !updated) return { ok: false, error: "This prescription can't be changed. It may already be issued." };
    // Note: not one transaction. If the insert below fails the draft keeps its fields but loses items; saving again fixes it.
    const { error: delError } = await supabase.from("prescription_items").delete().eq("prescription_id", id);
    if (delError) return { ok: false, error: "We couldn't save the draft. Please try again." };
  } else {
    const { data, error } = await supabase
      .from("prescriptions")
      .insert({
        ...fields,
        conversation_id: input.conversationId,
        patient_id: input.patientId,
        doctor_id: doctor.id,
        replaces_id: input.replacesId ?? null,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: "We couldn't save the draft. Please try again." };
    id = data.id as string;
  }

  if (items.length) {
    const { error } = await supabase.from("prescription_items").insert(items.map((i, position) => ({ ...i, position, prescription_id: id })));
    if (error) return { ok: false, error: "We couldn't save the medicines. Please try again." };
  }

  revalidatePath(`/doctor/c/${input.conversationId}`);
  return { ok: true, data: { id: id! } };
}

/** Lock the draft and post it to the chat (one DB transaction, see issue_prescription in the migration). */
export async function issuePrescription(id: string, conversationId: string): Promise<ActionResult> {
  await requireProfile("doctor");
  const supabase = await createClient();
  const { error } = await supabase.rpc("issue_prescription", { rx: id });
  if (error) {
    const msg = /at least one medicine/i.test(error.message) ? "Add at least one medicine before issuing." : "We couldn't issue this prescription. Please try again.";
    return { ok: false, error: msg };
  }
  revalidatePath(`/doctor/c/${conversationId}`);
  revalidatePath("/prescriptions");
  return { ok: true };
}

export async function deleteDraft(id: string, conversationId: string): Promise<ActionResult> {
  await requireProfile("doctor");
  const supabase = await createClient();
  const { error } = await supabase.from("prescriptions").delete().eq("id", id).eq("status", "draft");
  if (error) return { ok: false, error: "We couldn't delete this draft." };
  revalidatePath(`/doctor/c/${conversationId}`);
  return { ok: true };
}
