"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import type { AdminDoctor } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { DoctorDialog } from "../../doctors/DoctorDialog";
import type { Clinic } from "@/lib/types";

type Props = {
  doctor: AdminDoctor;
  clinics: Clinic[];
  /** The collated profile, built by the page. */
  summary: React.ReactNode;
};

/**
 * The admin's page for one doctor. The only actions are the same dialog the doctors
 * list uses (edit, deactivate, clinic) — no new actions here.
 */
export function AdminDoctorProfile({ doctor, clinics, summary }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-5">
      <PageHeader
        backHref="/admin/doctors"
        backLabel="Back to doctors"
        leading={<Avatar name={doctor.full_name} seed={doctor.id} doctor size="sm" />}
        title={doctor.full_name}
        subtitle={doctor.specialty ?? "Doctor"}
        actions={
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil aria-hidden="true" className="size-4" />
            Manage
          </Button>
        }
      />

      {notice ? (
        <p className="text-[15px] font-medium text-forest" role="status">
          {notice}
        </p>
      ) : null}

      {summary}

      {editing ? (
        <DoctorDialog
          doctor={doctor}
          clinics={clinics}
          onClose={() => setEditing(false)}
          onNotice={(tone, text) => {
            setNotice(text);
            if (tone === "success") router.refresh();
          }}
        />
      ) : null}
    </main>
  );
}
