import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getAdminDoctors, getAdminPatients } from "@/app/actions/admin";
import { logAdminFileView } from "@/app/actions/admin";
import {
  getAppointmentsOfPerson,
  getChatsOfPerson,
  getConversationReports,
  getPrescriptionsOfPerson,
  getProfileById,
} from "@/lib/data";
import { ProfileSummary } from "@/components/profile/ProfileSummary";
import { AdminPatientProfile } from "./AdminPatientProfile";

export const metadata: Metadata = { title: "Patient · Admin" };

/**
 * The admin's page for one patient (decision 77): their details, their doctors, every
 * chat, their prescriptions, their reports, and their appointments.
 */
export default async function AdminPatientProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ file?: string }>;
}) {
  await requireProfile("admin");
  const { id } = await params;
  const { file } = await searchParams;

  const [patient, patients, doctors] = await Promise.all([getProfileById(id), getAdminPatients(), getAdminDoctors()]);
  if (!patient || patient.role !== "patient") notFound();
  const adminPatient = patients.find((p) => p.id === id);
  if (!adminPatient) notFound();

  const [chats, prescriptions, appointments] = await Promise.all([
    getChatsOfPerson(id, "patient"),
    getPrescriptionsOfPerson(id, "patient"),
    getAppointmentsOfPerson(id, "patient"),
  ]);

  // The reports of every chat this patient has.
  const reports = (await Promise.all(chats.map((c) => getConversationReports(c.id)))).flat();

  // Opening a report is recorded, like every other admin view (decision 55).
  if (file && reports.some((r) => r.id === file)) {
    const report = reports.find((r) => r.id === file)!;
    await logAdminFileView(file, report.conversation_id);
  }

  return (
    <AdminPatientProfile
      patient={adminPatient}
      doctors={doctors}
      openFile={file}
      reports={reports.map((r) => ({
        id: r.id,
        file_name: r.file_name,
        file_path: r.file_path,
        file_size: r.file_size,
        file_type: r.file_type,
        conversation_id: r.conversation_id,
      }))}
      summary={
        <ProfileSummary
          viewerRole="admin"
          person={patient}
          clinicName={null}
          chats={chats.map((c) => ({ id: c.id, otherName: c.doctorName, otherRole: "doctor" as const, blockedAt: c.blockedAt }))}
          prescriptions={prescriptions}
          reports={reports}
          meetings={appointments.meetings}
          checkIns={appointments.checkIns}
          stats={[
            { label: "Doctors", value: chats.length },
            { label: "Prescriptions", value: prescriptions.length },
            { label: "Reports", value: reports.length },
          ]}
          fileHrefBase={`/admin/patients/${id}?file=`}
        />
      }
    />
  );
}

