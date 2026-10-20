import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Conversation, InboxRow, Message, Prescription, Profile } from "@/lib/types";

// All server-side reads live here. Pages call these; they never build queries inline.
// Every query runs as the signed-in user, so RLS decides what comes back.

/** Conversations for the signed-in user, newest first, with unread counts. */
export const getMyConversations = cache(async (): Promise<InboxRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_conversations");
  if (error) throw new Error(`my_conversations failed: ${error.message}`);
  return ((data ?? []) as InboxRow[]).map((r) => ({ ...r, unread_count: Number(r.unread_count) }));
});

export type ConversationWithPeople = Conversation & { doctor: Profile; patient: Profile };

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

const RX_SELECT = "*, prescription_items(*)";

function sortItems(rx: Prescription): Prescription {
  return { ...rx, prescription_items: [...(rx.prescription_items ?? [])].sort((a, b) => a.position - b.position) };
}

/** Prescriptions in a conversation, newest first. Patients only ever get issued ones (RLS). */
export async function getPrescriptions(conversationId: string): Promise<Prescription[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prescriptions")
    .select(RX_SELECT)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`prescriptions failed: ${error.message}`);
  return ((data ?? []) as Prescription[]).map(sortItems);
}

/** Every issued prescription for the signed-in patient, newest first. */
export async function getMyIssuedPrescriptions(): Promise<Prescription[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prescriptions")
    .select(RX_SELECT)
    .eq("status", "issued")
    .order("issued_at", { ascending: false });
  if (error) throw new Error(`prescriptions failed: ${error.message}`);
  return ((data ?? []) as Prescription[]).map(sortItems);
}

export const getPrescription = cache(async (id: string): Promise<Prescription | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("prescriptions").select(RX_SELECT).eq("id", id).maybeSingle();
  return data ? sortItems(data as Prescription) : null;
});

/** IDs of prescriptions that a newer issued one replaces (to show "Replaced"). */
export function replacedIds(list: Prescription[]): Set<string> {
  return new Set(list.filter((p) => p.status === "issued" && p.replaces_id).map((p) => p.replaces_id as string));
}
