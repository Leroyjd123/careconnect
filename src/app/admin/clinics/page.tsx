import type { Metadata } from "next";
import { getAdminClinics, getAdminDoctors } from "@/app/actions/admin";
import { AdminClinics } from "./AdminClinics";

export const metadata: Metadata = { title: "Clinics · Admin" };

/**
 * The admin's clinic list (PLAN §7 Phase E, Q-B): a clinic has a name, an "also
 * consults" setting, and the doctors in it. A doctor belongs to at most one clinic.
 */
export default async function AdminClinicsPage() {
  const [clinics, doctors] = await Promise.all([getAdminClinics(), getAdminDoctors()]);
  return <AdminClinics clinics={clinics} doctors={doctors} />;
}
