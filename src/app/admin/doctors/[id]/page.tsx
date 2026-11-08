import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getAdminDoctors, getAdminClinics } from "@/app/actions/admin";
import { getAppointmentsOfPerson, getChatsOfPerson, getDoctorStats, getPrescriptionsOfPerson, getProfileById } from "@/lib/data";
import { ProfileSummary } from "@/components/profile/ProfileSummary";
import { AdminDoctorProfile } from "./AdminDoctorProfile";

export const metadata: Metadata = { title: "Doctor · Admin" };

/**
 * The admin's page for one doctor (decision 77): their details, their patients, their
 * counts, and what is coming up. The actions are the same dialogs the doctor list uses.
 */
export default async function AdminDoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile("admin");
  const { id } = await params;

  const [doctor, doctors, clinics] = await Promise.all([getProfileById(id), getAdminDoctors(), getAdminClinics()]);
  if (!doctor || doctor.role !== "doctor") notFound();
  // The row the admin's dialogs expect (it carries the clinic name and the patient count).
  const adminDoctor = doctors.find((d) => d.id === id);
  if (!adminDoctor) notFound();

  const [chats, prescriptions, appointments, stats] = await Promise.all([
    getChatsOfPerson(id, "doctor"),
    getPrescriptionsOfPerson(id, "doctor"),
    getAppointmentsOfPerson(id, "doctor"),
    getDoctorStats(id),
  ]);

  return (
    <AdminDoctorProfile
      doctor={adminDoctor}
      clinics={clinics}
      summary={
        <ProfileSummary
          viewerRole="admin"
          person={doctor}
          specialty={doctor.specialty}
          clinicName={doctor.clinicName}
          chats={chats.map((c) => ({ id: c.id, otherName: c.patientName, otherRole: "patient" as const, blockedAt: c.blockedAt }))}
          prescriptions={prescriptions}
          meetings={appointments.meetings}
          checkIns={appointments.checkIns}
          stats={[
            { label: "Patients", value: chats.length },
            { label: "Prescriptions issued", value: stats.prescriptions },
            { label: "Meetings this month", value: stats.meetingsThisMonth },
          ]}
        />
      }
    />
  );
}
