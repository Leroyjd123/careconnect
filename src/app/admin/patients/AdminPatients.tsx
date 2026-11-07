"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, Clock, Pencil, UserPlus, Users } from "lucide-react";
import { type AdminDoctor, type AdminPatient } from "@/app/actions/admin";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Banner, EmptyState } from "@/components/ui/Feedback";
import { Field, TextInput } from "@/components/ui/Field";
import { PatientDialog } from "./PatientDialog";
import { InvitePatientDialog } from "./InvitePatientDialog";

type Props = {
  patients: AdminPatient[];
  doctors: AdminDoctor[];
  /** Only show this doctor's patients (from "View patients" on the doctors page). */
  filterDoctorId?: string;
};

/**
 * The admin's patient list: search, a filter by doctor, and the per-patient popup
 * with edit, block and "add a doctor".
 */
export function AdminPatients({ patients, doctors, filterDoctorId }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminPatient | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      if (filterDoctorId && !p.doctors.some((d) => d.id === filterDoctorId)) return false;
      if (!q) return true;
      return (
        p.full_name.toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q) ||
        (p.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [patients, query, filterDoctorId]);

  const filterDoctor = filterDoctorId ? doctors.find((d) => d.id === filterDoctorId) : null;

  return (
    <Card tone="subtle" className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Patients</h1>
          <p className="text-[15px] text-ink-2">
            {filterDoctor ? `Patients of ${filterDoctor.full_name}` : `${patients.length} on CareConnect`}
          </p>
        </div>
        <div className="flex gap-2">
          {filterDoctor ? (
            <ButtonLink href="/admin/patients" variant="secondary" size="sm">
              All patients
            </ButtonLink>
          ) : null}
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus aria-hidden="true" className="size-[18px]" />
            Invite patient
          </Button>
        </div>
      </div>

      <Field id="admin-patient-search" label="Search patients">
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, mobile number or email"
          aria-label="Search patients"
          className="h-11"
        />
      </Field>

      {notice ? <Banner tone={notice.tone}>{notice.text}</Banner> : null}


      {visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title={patients.length === 0 ? "No patients yet" : "No patients match that"}
          action={patients.length === 0 ? <Button onClick={() => setInviteOpen(true)}>Invite a patient</Button> : undefined}
        >
          {patients.length === 0
            ? "Invite a patient and assign them to a doctor."
            : "Try another name, or clear the search."}
        </EmptyState>
      ) : (
        <ul className="-mx-1 min-h-0 flex-1 overflow-auto px-1">
          {visible.map((patient) => {
            const invited = patient.status === "invited";
            return (
              <li key={patient.id} className="mb-2 flex flex-wrap items-center gap-3 rounded-tile bg-white/80 p-3">
                <Avatar name={patient.full_name} seed={patient.id} size="sm" pending={invited} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-semibold">{patient.full_name}</span>
                  <span className="truncate text-[13px] text-ink-2">
                    {[patient.email, patient.phone].filter(Boolean).join(" · ") || "No contact yet"}
                  </span>
                  {patient.doctors.length ? (
                    <span className="truncate text-[13px] text-ink-2">
                      With {patient.doctors.map((d) => d.full_name).join(", ")}
                    </span>
                  ) : (
                    <span className="text-[13px] text-ink-2">No doctor yet</span>
                  )}
                </div>
                {patient.accountBlocked ? (
                  <Badge tone="danger" icon={<Ban aria-hidden="true" />}>
                    Account blocked
                  </Badge>
                ) : invited ? (
                  <Badge tone="neutral" icon={<Clock aria-hidden="true" />}>
                    Invite pending
                  </Badge>
                ) : (
                  <Badge tone="brand" icon={<Check aria-hidden="true" />}>
                    Active
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={() => setEditing(patient)}>
                  <Pencil aria-hidden="true" className="size-4" />
                  Manage
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <PatientDialog
          patient={editing}
          doctors={doctors}
          onClose={() => setEditing(null)}
          onNotice={(tone, text) => {
            setNotice({ tone, text });
            router.refresh();
          }}
        />
      ) : null}

      {inviteOpen ? (
        <InvitePatientDialog
          doctors={doctors}
          onClose={() => setInviteOpen(false)}
          onNotice={(tone, text) => {
            setNotice({ tone, text });
            router.refresh();
          }}
        />
      ) : null}
    </Card>
  );
}
