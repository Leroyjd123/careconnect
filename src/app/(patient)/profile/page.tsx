import type { Metadata } from "next";
import { FileText, LifeBuoy, LogOut, ShieldCheck } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { APP_VERSION } from "@/lib/releases";
import { getMyConversations } from "@/lib/data";
import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsRow } from "@/components/layout/SettingsRow";
import { NotificationToggle } from "@/components/layout/NotificationToggle";
import { formatDate } from "@/lib/utils";
import { HealthDetailsSection } from "./HealthDetailsSection";
import { LanguagePicker } from "./LanguagePicker";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const profile = await requireProfile("patient");
  const inbox = await getMyConversations();

  // The three values the patient keeps up to date themselves (decision 28).
  const healthDetails = {
    dateOfBirth: profile.date_of_birth ?? "",
    heightCm: profile.height_cm?.toString() ?? "",
    weightKg: profile.weight_kg?.toString() ?? "",
  };
  const healthSummary = [
    profile.date_of_birth ? `Born ${formatDate(profile.date_of_birth)}` : "Date of birth not added",
    profile.height_cm ? `${profile.height_cm} cm` : "Height not added",
    profile.weight_kg ? `${profile.weight_kg} kg` : "Weight not added",
  ];

  return (
    <main className="flex flex-col gap-4 p-3 pb-32">
      <PageHeader backHref="/home" backLabel="Back to home" title="Profile" />

      <Card className="flex items-center gap-4 p-5">
        <Avatar name={profile.full_name || "You"} seed={profile.id} size="lg" ring />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xl font-semibold tracking-tight">{profile.full_name || "You"}</span>
          {profile.email ? <span className="truncate text-[15px] text-ink-2">{profile.email}</span> : null}
          {inbox.length ? (
            <span className="text-[13px] text-ink-2">
              {inbox.length === 1 ? `Your doctor: ${inbox[0].other_name}` : `Your doctors: ${inbox.map((c) => c.other_name).join(", ")}`}
            </span>
          ) : null}
        </div>
      </Card>

      <NotificationToggle audience="patient" />

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-[17px] font-semibold">Health details</h2>
        <HealthDetailsSection details={healthDetails} summary={healthSummary} />
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-[17px] font-semibold">Language</h2>
        <LanguagePicker value={profile.language} />
      </Card>

      <SettingsRow href="/privacy" icon={ShieldCheck} title="Privacy notice" hint="What we keep and who can see it." />
      <SettingsRow href="/terms" icon={FileText} title="Terms of use" hint="The short version of the rules." />
      <SettingsRow
        href="/chat"
        icon={LifeBuoy}
        title="Help"
        hint={inbox[0] ? `Message ${inbox[0].other_name} and they'll help.` : "Contact your doctor's clinic."}
      />

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
