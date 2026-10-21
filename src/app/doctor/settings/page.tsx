import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { APP_VERSION, RELEASES } from "@/lib/releases";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ReleaseNotes } from "@/components/doctor/ReleaseNotes";
import { NotificationToggle } from "@/components/layout/NotificationToggle";

export const metadata: Metadata = { title: "Settings" };

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[13px] font-semibold text-ink-label">{label}</dt>
      <dd className={value ? "text-[15px]" : "text-[15px] text-ink-2"}>{value || "Not set"}</dd>
    </div>
  );
}

export default async function SettingsPage() {
  const profile = await requireProfile("doctor");

  return (
    <Card tone="subtle" className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-5">
      <h1 className="text-[22px] font-semibold tracking-tight">Settings</h1>

      <Card tone="solid" radius="tile" className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <Avatar name={profile.full_name || "Doctor"} doctor />
          <div className="flex min-w-0 flex-col">
            <h2 className="truncate text-[17px] font-semibold">{profile.full_name || "Doctor"}</h2>
            <span className="truncate text-[15px] text-ink-2">{profile.email}</span>
          </div>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Detail label="Specialty" value={profile.specialty} />
          <Detail label="Registration number" value={profile.reg_no} />
        </dl>
        <p className="text-[13px] text-ink-2">
          These print on every prescription. To change them, ask whoever manages your CareConnect setup.
        </p>
        <form action={signOut} className="lg:hidden">
          <Button type="submit" variant="danger" block>
            <LogOut aria-hidden="true" className="size-[18px]" />
            Sign out
          </Button>
        </form>
      </Card>

      <NotificationToggle audience="doctor" />

      <section aria-labelledby="releases" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="releases" className="text-[17px] font-semibold">
            What&apos;s new
          </h2>
          <span className="text-[13px] text-ink-2">You&apos;re on version {APP_VERSION}</span>
        </div>
        <ReleaseNotes releases={RELEASES} />
      </section>
    </Card>
  );
}
