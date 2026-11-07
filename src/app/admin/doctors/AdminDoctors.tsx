"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, Pencil, Stethoscope, Users } from "lucide-react";
import { type AdminDoctor } from "@/app/actions/admin";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Banner, EmptyState } from "@/components/ui/Feedback";
import { Field, TextInput } from "@/components/ui/Field";
import { DoctorDialog } from "./DoctorDialog";
import { InviteDoctorDialog } from "./InviteDoctorDialog";
import type { Clinic } from "@/lib/types";

type Props = {
  doctors: AdminDoctor[];
  clinics: Clinic[];
};

/**
 * The admin's doctor list. Every row can be edited, deactivated, and pointed at a
 * clinic; the "Manage" button opens the popup for that doctor.
 */
export function AdminDoctors({ doctors, clinics }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminDoctor | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const visible = doctors.filter((d) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return d.full_name.toLowerCase().includes(q) || (d.specialty ?? "").toLowerCase().includes(q) || (d.email ?? "").toLowerCase().includes(q);
  });

  return (
    <Card tone="subtle" className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Doctors</h1>
          <p className="text-[15px] text-ink-2">{doctors.length} on CareConnect</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <Stethoscope aria-hidden="true" className="size-[18px]" />
          Invite doctor
        </Button>
      </div>

      <Field id="admin-doctor-search" label="Search doctors">
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, specialty or email"
          aria-label="Search doctors"
          className="h-11"
        />
      </Field>

      {notice ? <Banner tone={notice.tone}>{notice.text}</Banner> : null}

      {visible.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title={doctors.length === 0 ? "No doctors yet" : "No doctors match that"}
          action={doctors.length === 0 ? <Button onClick={() => setInviteOpen(true)}>Invite a doctor</Button> : undefined}
        >
          {doctors.length === 0 ? "Invite a doctor and they'll appear here." : "Try another name, or clear the search."}
        </EmptyState>
      ) : (
        <ul className="-mx-1 min-h-0 flex-1 overflow-auto px-1">
          {visible.map((doctor) => (
            <li key={doctor.id} className="mb-2 flex flex-wrap items-center gap-3 rounded-tile bg-white/80 p-3">
              <Avatar name={doctor.full_name} seed={doctor.id} doctor size="sm" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-semibold">{doctor.full_name}</span>
                <span className="truncate text-[13px] text-ink-2">
                  {[doctor.specialty, doctor.clinicName].filter(Boolean).join(" · ") || "No specialty set"}
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-[13px] text-ink-2">
                <Users aria-hidden="true" className="size-3.5" />
                {doctor.patientCount} {doctor.patientCount === 1 ? "patient" : "patients"}
              </span>
              {doctor.deactivated_at ? (
                <Badge tone="danger" icon={<Ban aria-hidden="true" />}>
                  Deactivated
                </Badge>
              ) : (
                <Badge tone="brand" icon={<Check aria-hidden="true" />}>
                  Active
                </Badge>
              )}
              <div className="flex gap-2">
                <ButtonLink href={`/admin/patients?doctor=${doctor.id}`} variant="ghost" size="sm">
                  Patients
                </ButtonLink>
                <Button variant="outline" size="sm" onClick={() => setEditing(doctor)}>
                  <Pencil aria-hidden="true" className="size-4" />
                  Manage
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <DoctorDialog
          doctor={editing}
          clinics={clinics}
          onClose={() => setEditing(null)}
          onNotice={(tone, text) => {
            setNotice({ tone, text });
            router.refresh();
          }}
        />
      ) : null}

      {inviteOpen ? (
        <InviteDoctorDialog
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
