"use client";

import { useState, useTransition } from "react";
import { updateMyProfile } from "@/app/actions/profile";
import { Banner } from "@/components/ui/Feedback";
import { Segmented } from "@/components/ui/Segmented";
import { LANGUAGES } from "@/lib/constants";
import type { Language } from "@/lib/types";

/** Saves straight away: there's nothing to submit. */
export function LanguagePicker({ value }: { value: Language }) {
  const [language, setLanguage] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function change(next: Language) {
    const previous = language;
    setLanguage(next);
    setError(null);
    startTransition(async () => {
      const result = await updateMyProfile({ language: next });
      if (!result.ok) {
        setLanguage(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Segmented
        label="Language"
        value={language}
        onChange={change}
        options={LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
      />
      <p className="text-[13px] text-ink-2">CareConnect is in English for now. We&apos;ll use your choice when more languages arrive.</p>
      {error ? <Banner tone="danger">{error}</Banner> : null}
    </div>
  );
}
