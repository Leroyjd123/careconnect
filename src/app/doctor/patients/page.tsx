import type { Metadata } from "next";
import { getMyPatients } from "@/lib/data";
import { PatientsTable } from "@/components/doctor/PatientsTable";

export const metadata: Metadata = { title: "Patients" };

export default async function PatientsPage() {
  const rows = await getMyPatients();
  return <PatientsTable rows={rows} />;
}
