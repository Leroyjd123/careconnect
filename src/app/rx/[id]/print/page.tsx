import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getPrescription } from "@/lib/data";
import { Logo } from "@/components/ui/Logo";
import { PrescriptionView } from "@/components/rx/PrescriptionView";
import { AutoPrint } from "./AutoPrint";

export const metadata: Metadata = { title: "Print prescription" };

/** Plain white sheet for printing or "Save as PDF". Both roles can open their own prescriptions. */
export default async function PrintPrescription({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;

  const prescription = await getPrescription(id);
  const mine = prescription && (prescription.doctor_id === profile.id || prescription.patient_id === profile.id);
  if (!prescription || !mine || prescription.status !== "issued") notFound();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-5 bg-white p-8 print:p-0">
      <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
        <Logo />
        <AutoPrint />
      </div>
      <PrescriptionView prescription={prescription} variant="print" />
      <p className="border-t border-line pt-4 text-[13px] text-ink-2">
        Issued through CareConnect. Keep this with your records.
      </p>
    </main>
  );
}
