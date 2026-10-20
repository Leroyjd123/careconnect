import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { getMyConversations, getMyIssuedPrescriptions, replacedIds } from "@/lib/data";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { PrescriptionCard } from "@/components/rx/PrescriptionCard";

export const metadata: Metadata = { title: "My prescriptions" };

export default async function PrescriptionsPage() {
  const [prescriptions, [inbox]] = await Promise.all([getMyIssuedPrescriptions(), getMyConversations()]);
  const replaced = new Set(replacedIds(prescriptions));
  const latestId = prescriptions.find((p) => !replaced.has(p.id))?.id;

  return (
    <main className="flex flex-col gap-4 p-3 pb-32">
      <PageHeader backHref="/home" backLabel="Back to home" title="My prescriptions" subtitle={inbox ? `From ${inbox.other_name}` : undefined} />

      {prescriptions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No prescriptions yet"
          action={inbox ? <ButtonLink href="/chat">Go to chat</ButtonLink> : undefined}
        >
          When {inbox ? inbox.other_name : "your doctor"} sends one, it will appear here and in your chat.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {prescriptions.map((rx) => (
            <li key={rx.id}>
              <PrescriptionCard
                issuedAt={rx.issued_at ?? rx.created_at}
                medicines={(rx.prescription_items ?? []).map((i) => i.medicine)}
                replaced={replaced.has(rx.id)}
                latest={rx.id === latestId}
                actions={
                  <ButtonLink href={`/prescriptions/${rx.id}`} variant="secondary">
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
