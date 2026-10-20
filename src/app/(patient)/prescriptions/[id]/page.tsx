import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download, MessageCircle } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getMyIssuedPrescriptions, getPrescription, replacedIds } from "@/lib/data";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { PrescriptionView } from "@/components/rx/PrescriptionView";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Prescription" };

export default async function PrescriptionDetail({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile("patient");
  const { id } = await params;

  const [prescription, all] = await Promise.all([getPrescription(id), getMyIssuedPrescriptions()]);
  if (!prescription || prescription.patient_id !== profile.id || prescription.status !== "issued") notFound();

  const replaced = replacedIds(all).includes(prescription.id);

  return (
    <main className="flex flex-col gap-4 p-3 pb-32">
      <PageHeader
        backHref="/prescriptions"
        backLabel="Back to my prescriptions"
        title="Prescription"
        subtitle={formatDate(prescription.issued_at ?? prescription.created_at)}
      />
      <PrescriptionView
        prescription={prescription}
        replaced={replaced}
        actions={
          <>
            <ButtonLink href={`/rx/${prescription.id}/print`} target="_blank" variant="secondary" block>
              <Download aria-hidden="true" className="size-[18px]" />
              Download PDF
            </ButtonLink>
            <ButtonLink href="/chat" block>
              <MessageCircle aria-hidden="true" className="size-[18px]" />
              Ask {prescription.doctor.full_name} about this
            </ButtonLink>
          </>
        }
      />
    </main>
  );
}
