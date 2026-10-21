"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { deletePushSubscription, savePushSubscription } from "@/app/actions/notifications";
import { PUSH_COOKIE } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";
import { Banner } from "@/components/ui/Feedback";
import type { PushSubscriptionInput } from "@/lib/types";

export type NotificationState = "loading" | "unsupported" | "install" | "denied" | "off" | "on";
type State = NotificationState;

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function keyBytes(base64url: string) {
  const b64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// Lets signOut() forget this device without a client round-trip.
function rememberEndpoint(endpoint: string | null) {
  document.cookie = endpoint
    ? `${PUSH_COOKIE}=${encodeURIComponent(endpoint)}; path=/; max-age=31536000; samesite=lax; secure`
    : `${PUSH_COOKIE}=; path=/; max-age=0`;
}

async function registration() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

/**
 * "Turn on notifications" card for Profile (patient) and Settings (doctor). One component for both.
 * Handles every browser state: unsupported, iPhone not installed, blocked, off, on.
 * `preview` (styleguide only) pins a state and makes the buttons do nothing: no permission prompt, no saving.
 */
export function NotificationToggle({
  audience,
  preview,
  previewError,
}: {
  audience: "doctor" | "patient";
  preview?: NotificationState;
  previewError?: string;
}) {
  const [state, setState] = useState<State>(preview ?? "loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(previewError ?? null);

  useEffect(() => {
    if (preview) return;
    (async () => {
      const supported = !!PUBLIC_KEY && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const installed = window.matchMedia("(display-mode: standalone)").matches;
      if (!supported) return setState(ios && !installed ? "install" : "unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const sub = await (await registration()).pushManager.getSubscription();
      if (sub) {
        // Re-save on every visit: keys may have rotated, or someone else signed in on this device.
        await savePushSubscription(sub.toJSON() as PushSubscriptionInput, navigator.userAgent);
        rememberEndpoint(sub.endpoint);
      }
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, [preview]);

  async function turnOn() {
    if (preview) return;
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await registration();
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY!) }));
      const result = await savePushSubscription(sub.toJSON() as PushSubscriptionInput, navigator.userAgent);
      if (!result.ok) {
        await sub.unsubscribe();
        setError(result.error);
        return;
      }
      rememberEndpoint(sub.endpoint);
      setState("on");
    } catch {
      setError("We couldn't turn on notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    if (preview) return;
    setBusy(true);
    setError(null);
    try {
      const sub = await (await registration()).pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      rememberEndpoint(null);
      setState("off");
    } catch {
      setError("We couldn't turn off notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const what = audience === "patient" ? "your doctor replies or sends a prescription" : "a patient sends a message or report";
  const description: Record<State, string> = {
    loading: "Checking this device…",
    on: `On for this device. We'll let you know when ${what}.`,
    off: `Get an alert on this device when ${what}. Alerts never show what the message says.`,
    install: "On iPhone, first add CareConnect to your Home Screen: tap Share, then “Add to Home Screen”. Open it from there and turn notifications on.",
    denied: "Notifications are blocked for this site. Allow them in your browser’s site settings, then come back here.",
    unsupported: "This browser can’t show notifications. Try Chrome, Edge, Firefox or Safari.",
  };

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start gap-3.5">
        <IconTile>{state === "on" ? <Bell aria-hidden="true" className="size-[22px]" /> : <BellOff aria-hidden="true" className="size-[22px]" />}</IconTile>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-[17px] font-semibold">Notifications</h2>
          <p className="text-[15px] text-ink-2" aria-live="polite">
            {description[state]}
          </p>
        </div>
      </div>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {state === "off" ? (
        <Button variant="soft" size={audience === "patient" ? "lg" : "md"} block={audience === "patient"} loading={busy} onClick={turnOn}>
          <Bell aria-hidden="true" className="size-[18px]" />
          Turn on notifications
        </Button>
      ) : null}
      {state === "on" ? (
        <Button variant="secondary" size={audience === "patient" ? "lg" : "md"} block={audience === "patient"} loading={busy} onClick={turnOff}>
          <BellOff aria-hidden="true" className="size-[18px]" />
          Turn off notifications
        </Button>
      ) : null}
    </Card>
  );
}
