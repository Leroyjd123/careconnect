import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { getMyConversations, getMyIssuedPrescriptions, replacedIds } from "@/lib/data";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { PrescriptionCard } from "@/components/rx/PrescriptionCard";
import { DoctorFilter } from "./DoctorFilter";

export const metadata: Metadata = { title: "My prescriptions" };

export default async function PrescriptionsPage({ searchParams }: { searchParams: Promise<{ doctor?: string }> }) {
  const [prescriptions, inbox, { doctor }] = await Promise.all([
    getMyIssuedPrescriptions(),
    getMyConversations(),
    searchParams,
  ]);
  const replaced = new Set(replacedIds(prescriptions));
  // "Latest" is the newest one of the whole list, so the badge keeps meaning the same thing.
  const latestId = prescriptions.find((p) => !replaced.has(p.id))?.id;

  // The chips come from the prescriptions themselves, so a card can always be filtered by
  // its own doctor — even when that doctor is no longer in the patient's chats (Q-L).
  const byDoctor = new Map<string, string>();
  for (const rx of prescriptions) {
    if (rx.doctor?.id && !byDoctor.has(rx.doctor.id)) byDoctor.set(rx.doctor.id, rx.doctor.full_name);
  }
  const doctors = [...byDoctor.entries()].map(([id, name]) => ({ id, name }));
  const manyDoctors = doctors.length > 1;
  const selected = manyDoctors && doctor && doctors.some((d) => d.id === doctor) ? doctor : null;
  const visible = selected ? prescriptions.filter((p) => p.doctor_id === selected) : prescriptions;

  return (
    <main className="flex flex-col gap-4 p-3 pb-32">
      <PageHeader
        backHref="/home"
        backLabel="Back to home"
        title="My prescriptions"
        subtitle={manyDoctors ? "From all your doctors" : doctors[0] ? `From ${doctors[0].name}` : undefined}
      />

      {manyDoctors ? <DoctorFilter doctors={doctors} selected={selected} /> : null}

      {visible.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={selected ? "Nothing from this doctor yet" : "No prescriptions yet"}
          action={!selected && inbox[0] ? <ButtonLink href={`/chat/${inbox[0].id}`}>Go to chat</ButtonLink> : undefined}
        >
          {selected
            ? `When ${doctors.find((d) => d.id === selected)?.name} sends one, it will appear here and in your chat.`
            : `When ${inbox[0] ? inbox[0].other_name : "your doctor"} sends one, it will appear here and in your chat.`}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((rx) => (
            <li key={rx.id}>
              <PrescriptionCard
                issuedAt={rx.issued_at ?? rx.created_at}
                medicines={(rx.prescription_items ?? []).map((i) => i.medicine)}
                replaced={replaced.has(rx.id)}
                latest={rx.id === latestId}
                doctorName={rx.doctor.full_name}
                actions={
                  <ButtonLink href={`/prescriptions/${rx.id}`} variant="outline">
                    View prescription
                  </ButtonLink>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
