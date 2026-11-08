"use client";

import { PageHeader } from "@/components/layout/PageHeader";

type Props = {
  /** The collated profile, built by the page. */
  summary: React.ReactNode;
};

/**
 * The doctor's page for one patient (decision 77). Everything on it comes from the one
 * chat the doctor has with that patient.
 */
export function DoctorPatientProfile({ summary }: Props) {
  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-5">
      <PageHeader backHref="/doctor/patients" backLabel="Back to patients" title="Patient" />
      {summary}
    </main>
  );
}
