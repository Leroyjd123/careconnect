"use server";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ATTACHMENTS_BUCKET, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { notifyConversation } from "@/lib/push";
import { revalidatePath } from "next/cache";
import type { ActionResult, Message } from "@/lib/types";

// Chat writes. Shared by doctor and patient: RLS checks membership, so no role branching here.

export async function sendMessage(conversationId: string, body: string): Promise<ActionResult<Message>> {
  const profile = await requireProfile();
  const text = body.trim();
  if (!text) return { ok: false, error: "Type a message first." };
  if (text.length > 4000) return { ok: false, error: "That message is too long. Please split it up." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: profile.id, kind: "text", body: text })
    .select("*")
    .single();
  if (error) return { ok: false, error: "Not sent. Check your internet and try again." };
  await notifyConversation(conversationId, "message");
  return { ok: true, data: data as Message };
}

/**
 * After the browser has uploaded a file to Storage (lib/upload.ts), record it as a chat message.
 * The path must sit under the conversation's folder; Storage RLS already enforced that on upload.
 */
export async function sendAttachment(input: {
  conversationId: string;
  path: string;
  name: string;
  size: number;
  type: string;
  note?: string;
}): Promise<ActionResult<Message>> {
  const profile = await requireProfile();
  if (!input.path.startsWith(`${input.conversationId}/`)) return { ok: false, error: "Upload failed. Please try again." };
  if (input.size > MAX_UPLOAD_BYTES) return { ok: false, error: "That file is larger than 10 MB." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: profile.id,
      kind: "file",
      body: input.note?.trim() || null,
      file_path: input.path,
      file_name: input.name,
      file_size: input.size,
      file_type: input.type,
    })
    .select("*")
    .single();
  if (error) return { ok: false, error: "Not sent. Check your internet and try again." };
  await notifyConversation(input.conversationId, "file");
  return { ok: true, data: data as Message };
}

/** Short-lived private link to view or download an attachment. Never store or share it. */
export async function getFileUrl(path: string, download = false): Promise<ActionResult<{ url: string }>> {
  await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(ATTACHMENTS_BUCKET).createSignedUrl(path, 300, { download });
  if (error || !data) return { ok: false, error: "We couldn't open this file." };
  return { ok: true, data: { url: data.signedUrl } };
}

/** Mark the other person's messages as read. Call when a conversation is opened or receives a message while open. */
export async function markRead(conversationId: string): Promise<void> {
  await requireProfile();
  const supabase = await createClient();
  await supabase.rpc("mark_read", { conv: conversationId });
}

/**
 * Doctor removes a report. The chat keeps a "Report removed" line (the record stays honest);
 * the file itself is deleted from Storage. Only the doctor of that conversation; RLS and remove_report() check it.
 */
export async function removeReport(messageId: string, conversationId: string): Promise<ActionResult> {
  await requireProfile("doctor");
  const supabase = await createClient();
  const { data: path, error } = await supabase.rpc("remove_report", { msg: messageId });
  if (error || !path) return { ok: false, error: "We couldn't remove this report. Please try again." };

  const { error: storageError } = await supabase.storage.from(ATTACHMENTS_BUCKET).remove([path as string]);
  // The message is already marked removed; a leftover file is invisible to everyone, so log it and move on.
  if (storageError) console.error("removeReport: file not deleted", path, storageError);

  revalidatePath(`/doctor/c/${conversationId}`);
  return { ok: true };
}
