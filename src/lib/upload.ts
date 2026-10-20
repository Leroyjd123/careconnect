"use client";

import { getBrowserClient } from "@/lib/supabase/client";
import { ACCEPTED_FILE_TYPES, ATTACHMENTS_BUCKET, MAX_UPLOAD_BYTES } from "@/lib/constants";

export type UploadedFile = { path: string; name: string; size: number; type: string };

/**
 * Upload a file straight from the browser to private Storage (bypasses Vercel's 4.5 MB body limit).
 * Then call the sendAttachment server action with the result.
 */
export async function uploadAttachment(conversationId: string, file: File): Promise<UploadedFile> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("That file is larger than 10 MB.");
  if (!ACCEPTED_FILE_TYPES.split(",").includes(file.type)) throw new Error("Please send a PDF or a photo (JPG, PNG, HEIC).");

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-80) || "file";
  const path = `${conversationId}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await getBrowserClient().storage.from(ATTACHMENTS_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error("Upload failed. Check your internet and try again.");

  return { path, name: file.name, size: file.size, type: file.type };
}
