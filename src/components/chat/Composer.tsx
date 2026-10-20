"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Feedback";

const MAX_HEIGHT = 140;

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** Leave out to disable the attach button (doctor keeps text-only for now). */
  onAttach?: () => void;
  offline?: boolean;
  placeholder?: string;
};

/** The floating input pill at the bottom of every conversation. */
export function Composer({ value, onChange, onSend, onAttach, offline, placeholder = "Type a message" }: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [enterSends, setEnterSends] = useState(false);

  // On a phone, Enter makes a new line. With a keyboard it sends.
  useEffect(() => setEnterSends(window.matchMedia("(pointer: fine)").matches), []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  function send() {
    if (!value.trim()) return;
    onSend();
    ref.current?.focus();
  }

  return (
    <div className="flex flex-col gap-2 pt-2">
      {offline ? <Banner tone="offline">You&apos;re offline. Messages will send when you&apos;re back online.</Banner> : null}
      <div className="glass flex items-end gap-1.5 rounded-[26px] p-1.5 shadow-float">
        {onAttach ? (
          <IconButton label="Attach a photo or file" tone="soft" icon={<Paperclip className="size-5" />} onClick={onAttach} />
        ) : null}
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && enterSends) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={placeholder}
          aria-label="Message"
          className="max-h-[140px] min-h-11 flex-1 resize-none bg-transparent py-2.5 pr-1 pl-3 text-base leading-relaxed text-ink placeholder:text-ink-2/70 focus:outline-none"
        />
        <IconButton label="Send message" tone="primary" icon={<Send className="size-5" />} onClick={send} disabled={!value.trim()} />
      </div>
    </div>
  );
}
