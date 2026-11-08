import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getConversationBetween, getProfileById, getAppointments } from "@/lib/data";
import { ProfileSummary } from "@/components/profile/ProfileSummary";

export const metadata: Metadata = { title: "Your doctor" };

/**
 * The patient's page for one of their doctors (decision 77): the public details, and
 * what is coming up with that doctor. Nothing else — no chat, no prescriptions, no
 * reports of the other doctors.
 */
export default async function PatientDoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile("patient");
  const { id } = await params;

  // Only a doctor the patient actually talks to.
  const conversation = await getConversationBetween(id, profile.id);
  if (!conversation) notFound();

  const [doctor, appointments] = await Promise.all([getProfileById(id), getAppointments(conversation.id)]);
  if (!doctor) notFound();

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-6 pb-32">
      <ProfileSummary
        viewerRole="patient"
        person={doctor}
        specialty={doctor.specialty}
        clinicName={doctor.clinicName}
        meetings={appointments.meetings}
        checkIns={appointments.checkIns}
      />
    </main>
  );
}
