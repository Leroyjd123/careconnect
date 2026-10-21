"use client";

import { useMemo, useState } from "react";
import { Check, Clock, UserPlus, Users } from "lucide-react";
import { resendInvite } from "@/app/actions/patients";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Banner, EmptyState } from "@/components/ui/Feedback";
import { TextInput } from "@/components/ui/Field";
import { formatDate } from "@/lib/utils";
import type { ActionResult, Profile } from "@/lib/types";

type Row = { conversationId: string; patient: Profile };

const FILTERS = ["All", "Active", "Invite pending"];

/**
 * Everyone this doctor has invited, with their status and the two actions that matter.
 * onResend defaults to the real action; /styleguide passes a no-op.
 */
export function PatientsTable({
  rows,
  onResend = resendInvite,
}: {
  rows: Row[];
  onResend?: (patientId: string) => Promise<ActionResult>;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ patient }) => {
      const matchesFilter =
        filter === "All" || (filter === "Active" ? patient.status === "active" : patient.status === "invited");
      const matchesQuery =
        !q || patient.full_name.toLowerCase().includes(q) || (patient.email ?? "").toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [rows, query, filter]);

  async function resend(patient: Profile) {
    setBusyId(patient.id);
    const result = await onResend(patient.id);
    setBusyId(null);
    setNotice(
      result.ok
        ? { tone: "success", text: `Invitation sent again to ${patient.email}.` }
        : { tone: "danger", text: result.error },
    );
  }

  return (
    <Card tone="subtle" className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold tracking-tight">Patients</h1>
        <ButtonLink href="/doctor/patients?invite=1">
          <UserPlus aria-hidden="true" className="size-[18px]" />
          Invite patient
        </ButtonLink>
      </div>

      <TextInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email"
        aria-label="Search patients"
        className="h-11"
      />
      <ChipGroup label="Show" options={FILTERS} value={filter} onChange={setFilter} />

      {notice ? <Banner tone={notice.tone}>{notice.text}</Banner> : null}

      {visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title={rows.length === 0 ? "No patients yet" : "No patients match that"}
          action={rows.length === 0 ? <ButtonLink href="/doctor/patients?invite=1">Invite patient</ButtonLink> : undefined}
        >
          {rows.length === 0 ? "Invite someone and they'll appear here with their status." : "Try another name or clear the filter."}
        </EmptyState>
      ) : (
        <div className="-mx-1 min-h-0 flex-1 overflow-auto px-1">
          <table className="w-full min-w-[620px] border-separate border-spacing-y-1.5 text-left">
            <thead className="text-[13px] text-ink-label">
              <tr>
                <th scope="col" className="px-3 pb-1 font-semibold">
                  Patient
                </th>
                <th scope="col" className="px-3 pb-1 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-3 pb-1 font-semibold">
                  Joined
                </th>
                <th scope="col" className="px-3 pb-1 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ conversationId, patient }) => {
                const invited = patient.status === "invited";
                return (
                  <tr key={patient.id} className="bg-white/80">
                    <td className="rounded-l-tile px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={patient.full_name} seed={patient.id} size="sm" pending={invited} />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-[15px] font-semibold">{patient.full_name}</span>
                          <span className="truncate text-[13px] text-ink-2">{patient.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {invited ? (
                        <Badge tone="neutral" icon={<Clock aria-hidden="true" />}>
                          Invite pending
                        </Badge>
                      ) : (
                        <Badge tone="brand" icon={<Check aria-hidden="true" />}>
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[15px] text-ink-2">
                      {patient.activated_at ? formatDate(patient.activated_at) : "—"}
                    </td>
                    <td className="rounded-r-tile px-3 py-3">
                      <div className="flex justify-end gap-2">
                        {invited ? (
                          <Button variant="secondary" size="sm" loading={busyId === patient.id} onClick={() => resend(patient)}>
                            Resend
                          </Button>
                        ) : null}
                        <ButtonLink href={`/doctor/c/${conversationId}`} variant="soft" size="sm">
                          Open chat
                        </ButtonLink>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
