"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import type { AdminDoctor, AdminPatient } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { PatientDialog } from "../../patients/PatientDialog";
import { FileViewer } from "@/components/chat/FileViewer";

type Props = {
  patient: AdminPatient;
  doctors: AdminDoctor[];
  /** The report the admin opened, if any. */
  openFile?: string;
  /** The reports of every chat this patient has, so the opened one can be shown. */
  reports?: { id: string; file_name: string | null; file_path: string | null; file_size: number | null; file_type: string | null; conversation_id: string }[];
  /** The collated profile, built by the page. */
  summary: React.ReactNode;
};

/**
 * The admin's page for one patient. The only actions are the same dialog the patients
 * list uses (edit, block, add a doctor) — no new actions here.
 */
export function AdminPatientProfile({ patient, doctors, openFile, reports = [], summary }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // The report the admin opened, if any.
  const file = openFile ? reports.find((r) => r.id === openFile) : undefined;


  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-5">
      <PageHeader
        backHref="/admin/patients"
        backLabel="Back to patients"
        leading={<Avatar name={patient.full_name} seed={patient.id} size="sm" />}
        title={patient.full_name}
        subtitle="Patient"
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

      {/* The report the admin opened. Opening it is recorded, like every admin view. */}
      {file && file.file_path ? (
        <FileViewer
          message={{
            id: file.id,
            conversation_id: file.conversation_id,
            sender_id: "",
            kind: "file",
            body: null,
            file_path: file.file_path,
            file_name: file.file_name,
            file_size: file.file_size,
            file_type: file.file_type,
            prescription_id: null,
            read_at: null,
            deleted_at: null,
            meeting_id: null,
            check_in_id: null,
            sender_role: "patient",
            edited_at: null,
            removed_at: null,
            removed_by: null,
            created_at: new Date().toISOString(),
          }}
          backHref={`/admin/patients/${patient.id}`}
          className="fixed inset-0 z-20"
        />
      ) : null}

      {editing ? (
        <PatientDialog
          patient={patient}
          doctors={doctors}
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
