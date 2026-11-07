import type { Metadata } from "next";
import { getAdminDoctors, getAdminClinics } from "@/app/actions/admin";
import { AdminDoctors } from "./AdminDoctors";

export const metadata: Metadata = { title: "Doctors · Admin" };

/**
 * The admin's doctor list (PLAN §7 Phase E): everyone with a doctor account,
 * with their clinic, how many patients they have, and whether they are active.
 */
export default async function AdminDoctorsPage() {
  const [doctors, clinics] = await Promise.all([getAdminDoctors(), getAdminClinics()]);
  return <AdminDoctors doctors={doctors} clinics={clinics} />;
}
