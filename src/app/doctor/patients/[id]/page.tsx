import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import {
  getConversationBetween,
  getConversationReports,
  getOtherDoctors,
  getPrescriptions,
  getAppointments,
  getProfileById,
} from "@/lib/data";
import { ProfileSummary } from "@/components/profile/ProfileSummary";
import { DoctorPatientProfile } from "./DoctorPatientProfile";

export const metadata: Metadata = { title: "Patient" };

/**
 * The doctor's page for one patient (decision 77). It only exists for a patient the
 * doctor actually has a chat with, and everything on it is from that one chat.
 */
export default async function DoctorPatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const doctor = await requireProfile("doctor");
  const { id } = await params;

  // Only a patient the doctor talks to. RLS would refuse the data anyway; this makes
  // the page a clean "not found" instead of an empty screen.
  const conversation = await getConversationBetween(doctor.id, id);
  if (!conversation) notFound();

  const [patient, prescriptions, appointments, reports, otherDoctors] = await Promise.all([
    getProfileById(id),
    getPrescriptions(conversation.id),
    getAppointments(conversation.id),
    getConversationReports(conversation.id),
    getOtherDoctors(id),
  ]);
  if (!patient) notFound();

  return (
    <DoctorPatientProfile
      summary={
        <ProfileSummary
          viewerRole="doctor"
          person={patient}
          conversationId={conversation.id}
          prescriptions={prescriptions}
          reports={reports}
          meetings={appointments.meetings}
          checkIns={appointments.checkIns}
          otherDoctors={otherDoctors}
          fileHrefBase={`/doctor/c/${conversation.id}?file=`}
          rxHrefBase={`/doctor/c/${conversation.id}`}
        />
      }
    />
  );
}
