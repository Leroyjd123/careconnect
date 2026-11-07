import type { Metadata } from "next";
import { getAdminDoctors, getAdminPatients } from "@/app/actions/admin";
import { AdminPatients } from "./AdminPatients";

export const metadata: Metadata = { title: "Patients · Admin" };

/**
 * The admin's patient list (PLAN §7 Phase E): everyone with a patient account, the
 * doctors they see, and whether they are blocked.
 */
export default async function AdminPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string }>;
}) {
  const { doctor } = await searchParams;
  const [patients, doctors] = await Promise.all([getAdminPatients(), getAdminDoctors()]);
  return <AdminPatients patients={patients} doctors={doctors} filterDoctorId={doctor} />;
}
