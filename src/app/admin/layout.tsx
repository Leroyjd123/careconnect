import { cookies } from "next/headers";
import { LAYOUT_COOKIES } from "@/lib/constants";
import { requireProfile } from "@/lib/auth";
import { AppSidebar, type AppNavItem } from "@/components/layout/AppSidebar";

/**
 * The admin's links (PLAN §7 Phase E). Only names and paths cross to the client
 * component; the icons live inside it.
 */
const ADMIN_NAV: AppNavItem[] = [
  { href: "/admin", label: "Overview", icon: "overview", exact: true },
  { href: "/admin/conversations", label: "Conversations", icon: "conversations" },
  { href: "/admin/meetings", label: "Meetings", icon: "meetings" },
  { href: "/admin/doctors", label: "Doctors", icon: "doctors" },
  { href: "/admin/patients", label: "Patients", icon: "patients" },
  { href: "/admin/clinics", label: "Clinics", icon: "clinics" },
  { href: "/admin/audit", label: "Audit log", icon: "audit" },
];

/**
 * The admin app: the same glass sidebar as the doctor, with the admin's links.
 * Only an admin gets in: requireProfile("admin") sends everyone else to their own home.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile("admin");
  const navCollapsed = (await cookies()).get(LAYOUT_COOKIES.nav)?.value === "on";

  return (
    <div className="flex h-dvh gap-4 p-3 sm:p-4">
      <AppSidebar name={profile.full_name || "Admin"} items={ADMIN_NAV} collapsed={navCollapsed} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-[86px] lg:pb-0">{children}</div>
    </div>
  );
}
