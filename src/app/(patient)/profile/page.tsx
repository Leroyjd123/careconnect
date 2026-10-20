import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, LogOut, ShieldCheck } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { APP_VERSION } from "@/lib/releases";
import { getMyConversations } from "@/lib/data";
import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { LanguagePicker } from "./LanguagePicker";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const profile = await requireProfile("patient");
  const [inbox] = await getMyConversations();

  return (
    <main className="flex flex-col gap-4 p-3 pb-32">
      <PageHeader backHref="/home" backLabel="Back to home" title="Profile" />

      <Card className="flex items-center gap-4 p-5">
        <Avatar name={profile.full_name || "You"} seed={profile.id} size="lg" ring />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xl font-semibold tracking-tight">{profile.full_name || "You"}</span>
          {profile.email ? <span className="truncate text-[15px] text-ink-2">{profile.email}</span> : null}
          {inbox ? <span className="text-[13px] text-ink-2">Your doctor: {inbox.other_name}</span> : null}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-[17px] font-semibold">Language</h2>
        <LanguagePicker value={profile.language} />
      </Card>

      <Card as={Link} href="/privacy" className="flex items-center gap-3.5 p-5 text-ink no-underline hover:text-ink">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-mint-200 text-forest">
          <ShieldCheck aria-hidden="true" className="size-[22px]" />
        </span>
        <span className="flex flex-col">
          <span className="font-semibold">Privacy notice</span>
          <span className="text-[13px] text-ink-2">What we keep and who can see it.</span>
        </span>
      </Card>

      <Card as={Link} href="/chat" className="flex items-center gap-3.5 p-5 text-ink no-underline hover:text-ink">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-mint-200 text-forest">
          <LifeBuoy aria-hidden="true" className="size-[22px]" />
        </span>
        <span className="flex flex-col">
          <span className="font-semibold">Help</span>
          <span className="text-[13px] text-ink-2">
            {inbox ? `Message ${inbox.other_name} and they'll help.` : "Contact your doctor's clinic."}
          </span>
        </span>
      </Card>

      <form action={signOut}>
        <Button type="submit" variant="danger" size="lg" block>
          <LogOut aria-hidden="true" className="size-[18px]" />
          Sign out
        </Button>
      </form>

      <p className="text-center text-[13px] text-ink-2">CareConnect version {APP_VERSION}</p>
    </main>
  );
}
