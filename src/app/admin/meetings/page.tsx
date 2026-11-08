import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getAdminAppointments } from "@/lib/data";
import { getAdminDoctors, getAdminPatients, getAdminClinics } from "@/app/actions/admin";
import { AdminMeetings } from "./AdminMeetings";

export const metadata: Metadata = { title: "Meetings · Admin" };

type Search = {
  /** "all" | "meeting" | "check_in". */
  type?: string;
  status?: string;
  doctor?: string;
  patient?: string;
  clinic?: string;
  from?: string;
  to?: string;
  page?: string;
};

/**
 * The admin's appointments (decision 76): every meeting and check-in on CareConnect.
 * Read-only here — the doctor schedules and changes their own.
 */
export default async function AdminMeetingsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireProfile("admin");
  const { type, status, doctor, patient, clinic, from, to, page } = await searchParams;

  const [appointments, doctors, patients, clinics] = await Promise.all([
    getAdminAppointments({
      type,
      status,
      doctorId: doctor,
      patientId: patient,
      clinicId: clinic,
      from,
      to,
      page: Math.max(1, Number(page) || 1),
    }),
    getAdminDoctors(),
    getAdminPatients(),
    getAdminClinics(),
  ]);

  return (
    <AdminMeetings
      rows={appointments.rows}
      total={appointments.total}
      meetingCount={appointments.meetingCount}
      checkInCount={appointments.checkInCount}
      page={Math.max(1, Number(page) || 1)}
      doctors={doctors.map((d) => ({ id: d.id, full_name: d.full_name }))}
      patients={patients.map((p) => ({ id: p.id, full_name: p.full_name }))}
      clinics={clinics.map((c) => ({ id: c.id, name: c.name }))}
      filters={{ type: type ?? "all", status: status ?? "", doctor: doctor ?? "", patient: patient ?? "", clinic: clinic ?? "", from: from ?? "", to: to ?? "" }}
    />
  );
}
