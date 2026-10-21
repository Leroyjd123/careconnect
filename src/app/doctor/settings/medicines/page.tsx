import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getMyMedicines } from "@/lib/data";
import { MedicineList } from "@/components/doctor/MedicineList";

export const metadata: Metadata = { title: "Master medicines" };

export default async function MedicinesPage() {
  await requireProfile("doctor");
  const medicines = await getMyMedicines();
  return <MedicineList medicines={medicines} />;
}
