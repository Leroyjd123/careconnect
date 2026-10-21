import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ConversationWithPeople, InboxRow, Medicine, MedicineOption, Message, Prescription, PrescriptionWithPeople, Profile } from "@/lib/types";

// All server-side reads live here. Pages call these; they never build queries inline.
// Every query runs as the signed-in user, so RLS decides what comes back.

/** Conversations for the signed-in user, newest first, with unread counts. */
export const getMyConversations = cache(async (): Promise<InboxRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_conversations");
  if (error) throw new Error(`my_conversations failed: ${error.message}`);
  return ((data ?? []) as InboxRow[]).map((r) => ({ ...r, unread_count: Number(r.unread_count) }));
});

/** One conversation plus both people. null if it doesn't exist or isn't yours. */
export const getConversation = cache(async (id: string): Promise<ConversationWithPeople | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("*, doctor:profiles!conversations_doctor_id_fkey(*), patient:profiles!conversations_patient_id_fkey(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as ConversationWithPeople | null) ?? null;
});

/** The doctor's patients, newest conversation first. */
export const getMyPatients = cache(async (): Promise<{ conversationId: string; patient: Profile }[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, created_at, patient:profiles!conversations_patient_id_fkey(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`patients failed: ${error.message}`);
  return ((data ?? []) as unknown as { id: string; patient: Profile }[]).map((r) => ({ conversationId: r.id, patient: r.patient }));
});

/** Latest messages, oldest first (ready to render top-to-bottom). */
export async function getMessages(conversationId: string, limit = 200): Promise<Message[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`messages failed: ${error.message}`);
  return ((data ?? []) as Message[]).reverse();
}

const RX_SELECT =
  "*, prescription_items(*), doctor:profiles!prescriptions_doctor_id_fkey(*), patient:profiles!prescriptions_patient_id_fkey(*)";

function sortItems(rx: PrescriptionWithPeople): PrescriptionWithPeople {
  return { ...rx, prescription_items: [...(rx.prescription_items ?? [])].sort((a, b) => a.position - b.position) };
}

/** Prescriptions in a conversation, newest first. Patients only ever get issued ones (RLS). */
export async function getPrescriptions(conversationId: string): Promise<PrescriptionWithPeople[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prescriptions")
    .select(RX_SELECT)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`prescriptions failed: ${error.message}`);
  return ((data ?? []) as unknown as PrescriptionWithPeople[]).map(sortItems);
}

/** Every issued prescription for the signed-in patient, newest first. */
export async function getMyIssuedPrescriptions(): Promise<PrescriptionWithPeople[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prescriptions")
    .select(RX_SELECT)
    .eq("status", "issued")
    .order("issued_at", { ascending: false });
  if (error) throw new Error(`prescriptions failed: ${error.message}`);
  return ((data ?? []) as unknown as PrescriptionWithPeople[]).map(sortItems);
}

export const getPrescription = cache(async (id: string): Promise<PrescriptionWithPeople | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("prescriptions").select(RX_SELECT).eq("id", id).maybeSingle();
  return data ? sortItems(data as unknown as PrescriptionWithPeople) : null;
});

/** The doctor's active master medicines, for the composer's suggestions (0004). */
export async function getMedicineSuggestions(): Promise<MedicineOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("medicines").select("name, default_dose").eq("active", true).order("name");
  return (data ?? []) as MedicineOption[];
}

/** Every medicine in the doctor's master list, including inactive and merged ones (Settings). */
export async function getMyMedicines(): Promise<Medicine[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("medicines").select("*").order("name");
  return (data ?? []) as Medicine[];
}

/** IDs of prescriptions that a newer issued one replaces (to show "Replaced"). */
export function replacedIds(list: Prescription[]): string[] {
  return list.filter((p) => p.status === "issued" && p.replaces_id).map((p) => p.replaces_id as string);
}
