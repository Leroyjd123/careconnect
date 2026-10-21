import type { Metadata } from "next";
import Link from "next/link";
import { FileText, MessageCircle, Upload, UserRound } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getMyConversations } from "@/lib/data";
import { formatRelative } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { CountBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";
import { EmptyState } from "@/components/ui/Feedback";

export const metadata: Metadata = { title: "Home" };

export default async function PatientHome() {
  const profile = await requireProfile("patient");
  const [doctor] = await getMyConversations(); // MVP: one doctor per patient

  return (
    <main className="flex flex-col gap-5 px-5 pt-6 pb-32">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-base text-ink-2">Hello,</p>
          <h1 className="text-[28px] font-semibold tracking-tight">{profile.full_name || "there"}</h1>
        </div>
        <Link href="/profile" aria-label="Profile" className="glass flex size-12 items-center justify-center rounded-full text-forest">
          <UserRound aria-hidden="true" className="size-5" />
        </Link>
      </div>

      {!doctor ? (
        <EmptyState icon={MessageCircle} title="No doctor connected yet">
          Your doctor&apos;s clinic will connect you. Please contact them if this takes long.
        </EmptyState>
      ) : (
        <>
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3.5">
              <Avatar name={doctor.other_name} doctor size="lg" ring />
              <div className="flex flex-col">
                <span className="text-xs font-semibold tracking-wider text-ink-label uppercase">Your doctor</span>
                <span className="text-xl font-semibold">{doctor.other_name}</span>
                {doctor.other_specialty ? <span className="text-sm text-ink-2">{doctor.other_specialty}</span> : null}
              </div>
            </div>
            {doctor.last_message_preview && doctor.last_message_at ? (
              <div className="flex flex-col gap-1.5 rounded-tile bg-mint/85 px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-ink-2">Latest message · {formatRelative(doctor.last_message_at)}</span>
                  <CountBadge count={doctor.unread_count} />
                </div>
                <p className="line-clamp-2 text-base leading-snug">{doctor.last_message_preview}</p>
              </div>
            ) : null}
            <ButtonLink href="/chat" size="lg" block>
              <MessageCircle aria-hidden="true" className="size-[22px]" />
              Chat with {doctor.other_name}
            </ButtonLink>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card as={Link} href="/prescriptions" radius="tile" className="flex min-h-32 flex-col gap-2 p-4 text-ink no-underline hover:text-ink">
              <IconTile><FileText aria-hidden="true" className="size-[22px]" /></IconTile>
              <span className="font-semibold">My prescriptions</span>
            </Card>
            <Card as={Link} href="/chat?attach=1" radius="tile" className="flex min-h-32 flex-col gap-2 p-4 text-ink no-underline hover:text-ink">
              <IconTile><Upload aria-hidden="true" className="size-[22px]" /></IconTile>
              <span className="font-semibold">Send a report</span>
              <span className="text-[15px] text-ink-2">Photo or PDF</span>
            </Card>
          </div>
        </>
      )}
    </main>
  );
}
