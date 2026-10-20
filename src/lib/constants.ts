import type { Language } from "@/lib/types";

export const APP_NAME = "CareConnect";
export const TAGLINE = "Better care starts with a conversation.";

export const LANGUAGES: { value: Language; label: string; english: string }[] = [
  { value: "en", label: "English", english: "English" },
  { value: "kn", label: "ಕನ್ನಡ", english: "Kannada" },
  { value: "hi", label: "हिन्दी", english: "Hindi" },
];

/** Storage bucket from the migration. Files live under <conversation_id>/<uuid>-<name>. */
export const ATTACHMENTS_BUCKET = "attachments";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = "application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif";
export const PREVIEWABLE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

/** Prescription quick picks. Never pre-select one: the doctor always chooses. */
export const FREQUENCY_OPTIONS = ["1-0-0", "0-0-1", "1-0-1", "1-1-1", "Once a week", "When needed"];
export const DURATION_OPTIONS = ["3 days", "5 days", "7 days", "15 days", "30 days", "8 weeks"];
export const TIMING_OPTIONS = ["Before food", "After food", "With milk"];

/** "1-0-1" → which of morning / afternoon / night get a dose. null when not a slot pattern. */
export function frequencySlots(frequency: string): [boolean, boolean, boolean] | null {
  const m = frequency.trim().match(/^([01])-([01])-([01])$/);
  if (!m) return null;
  return [m[1] === "1", m[2] === "1", m[3] === "1"];
}
