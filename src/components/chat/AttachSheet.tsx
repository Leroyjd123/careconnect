"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, FileUp, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, FieldError, TextArea } from "@/components/ui/Field";
import { FileCard } from "@/components/chat/FileCard";
import { ACCEPTED_FILE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";

type AttachSheetProps = {
  open: boolean;
  onClose: () => void;
  /** "Dr. Sharma" or the patient's first name: used in the send button. */
  recipientName: string;
  /** The conversation uploads and sends; this sheet only picks and previews. */
  onSend: (file: File, note: string) => void;
};

/** Pick a photo or a PDF, preview it, add a note, send. Patient flow B3/B4. */
export function AttachSheet({ open, onClose, recipientName, onSend }: AttachSheetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!file?.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function reset() {
    setFile(null);
    setNote("");
    setError(null);
    Object.values(inputs.current).forEach((el) => el && (el.value = ""));
  }

  function close() {
    reset();
    onClose();
  }

  function pick(chosen: File | undefined) {
    if (!chosen) return;
    if (chosen.size > MAX_UPLOAD_BYTES) {
      setError(`That file is ${formatBytes(chosen.size)}. Please send something under 10 MB.`);
      return;
    }
    if (!ACCEPTED_FILE_TYPES.split(",").includes(chosen.type)) {
      setError("Please send a PDF or a photo (JPG, PNG, HEIC).");
      return;
    }
    setError(null);
    setFile(chosen);
  }

  const choices = [
    { key: "camera", label: "Take a photo", icon: Camera, accept: "image/*", capture: "environment" as const },
    { key: "photo", label: "Choose a photo", icon: ImageIcon, accept: "image/*" },
    { key: "file", label: "Choose a file", icon: FileUp, accept: "application/pdf" },
  ];

  return (
    <Dialog
      open={open}
      onClose={close}
      variant="sheet"
      title={file ? `Send to ${recipientName}` : "Send a photo or file"}
      description={file ? `${recipientName} will see this in the chat.` : "A photo of a report, or a PDF. Up to 10 MB."}
    >
      <div className="flex flex-col gap-3">
        {error ? <FieldError>{error}</FieldError> : null}

        {choices.map(({ key, accept, capture }) => (
          <input
            key={key}
            ref={(el) => {
              inputs.current[key] = el;
            }}
            type="file"
            accept={accept}
            capture={capture}
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        ))}

        {!file ? (
          <>
            {choices.map(({ key, label, icon: Icon }) => (
              <Button key={key} variant="secondary" size="lg" block onClick={() => inputs.current[key]?.click()}>
                <Icon aria-hidden="true" className="size-5" />
                {label}
              </Button>
            ))}
            <Button variant="ghost" block onClick={close}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            {previewUrl ? (
              // Blob URL from the file the user just picked: next/image can't optimise it.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={file.name} className="max-h-64 w-full rounded-tile object-contain" />
            ) : (
              <FileCard name={file.name} size={file.size} type={file.type} />
            )}
            <Field id="attach-note" label="Add a note" optional hint="Shown to your doctor with the file.">
              <TextArea
                id="attach-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Blood test from Friday"
              />
            </Field>
            <Button
              size="lg"
              block
              onClick={() => {
                onSend(file, note);
                close();
              }}
            >
              Send to {recipientName}
            </Button>
            <Button variant="ghost" block onClick={reset}>
              Choose something else
            </Button>
          </>
        )}
      </div>
    </Dialog>
  );
}
