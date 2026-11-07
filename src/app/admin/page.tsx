import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, MessageCircle, Stethoscope, Users } from "lucide-react";
import { getAdminOverview } from "@/app/actions/admin";
import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";

export const metadata: Metadata = { title: "Admin" };

/**
 * The admin overview (decision 56): plain counts, no charts.
 * Every card links to the screen where that number can be acted on.
 */
export default async function AdminOverviewPage() {
  const counts = await getAdminOverview();

  const tiles = [
    { href: "/admin/doctors", label: "Doctors", value: counts.doctors, Icon: Stethoscope, hint: "Everyone with a CareConnect account" },
    { href: "/admin/patients", label: "Patients", value: counts.patients, Icon: Users, hint: "People who talk to a doctor" },
    { href: "/admin", label: "Chats", value: counts.conversations, Icon: MessageCircle, hint: "One per doctor and patient" },
    { href: "/admin/doctors", label: "Meetings this week", value: counts.meetingsThisWeek, Icon: CalendarClock, hint: "Scheduled in the next seven days" },
  ];

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-5">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Overview</h1>
        <p className="text-base text-ink-2">Everything on CareConnect, at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ href, label, value, Icon, hint }) => (
          <Card key={label} as={Link} href={href} className="flex flex-col gap-3 p-5 text-ink no-underline hover:text-ink">
            <IconTile>
              <Icon aria-hidden="true" className="size-[22px]" />
            </IconTile>
            <span className="text-[34px] leading-none font-semibold tracking-tight">{value}</span>
            <span className="flex flex-col">
              <span className="text-[15px] font-semibold">{label}</span>
              <span className="text-[13px] text-ink-2">{hint}</span>
            </span>
          </Card>
        ))}
      </div>
    </main>
  );
}
