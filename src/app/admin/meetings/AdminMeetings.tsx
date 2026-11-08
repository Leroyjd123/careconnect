"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Filter, MessageCircle, X } from "lucide-react";
import { AppointmentCard } from "@/components/chat/AppointmentCard";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { Field, TextInput } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import type { AdminAppointment } from "@/lib/data";

type Props = {
  rows: AdminAppointment[];
  total: number;
  meetingCount: number;
  checkInCount: number;
  page: number;
  doctors: { id: string; full_name: string }[];
  patients: { id: string; full_name: string }[];
  clinics: { id: string; name: string }[];
  filters: { type: string; status: string; doctor: string; patient: string; clinic: string; from: string; to: string };
};

const PER_PAGE = 50;

const TYPES = [
  { value: "all", label: "All" },
  { value: "meeting", label: "Meetings" },
  { value: "check_in", label: "Check-ins" },
];

const STATUSES = [
  { value: "", label: "Any status" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

/** The query string for the pager, keeping the filters. */
function buildQuery(filters: Props["filters"], page: number): string {
  const params = new URLSearchParams();
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.doctor) params.set("doctor", filters.doctor);
  if (filters.patient) params.set("patient", filters.patient);
  if (filters.clinic) params.set("clinic", filters.clinic);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  params.set("page", String(page));
  return params.toString();
}

/**
 * The admin's appointments list (decision 76): every meeting and check-in, upcoming
 * first. Read-only: the doctor schedules and changes their own.
 */
export function AdminMeetings({ rows, total, meetingCount, checkInCount, page, doctors, patients, clinics, filters }: Props) {
  const router = useRouter();
  const [doctor, setDoctor] = useState(filters.doctor);
  const [patient, setPatient] = useState(filters.patient);
  const [from, setFrom] = useState(filters.from);
  const [to, setTo] = useState(filters.to);

  /** The URL for a set of filters. The query string is the state. */
  function url(next: Partial<typeof filters> = {}) {
    const merged = { ...filters, ...next };
    const params = new URLSearchParams();
    if (merged.type && merged.type !== "all") params.set("type", merged.type);
    if (merged.status) params.set("status", merged.status);
    if (merged.doctor) params.set("doctor", merged.doctor);
    if (merged.patient) params.set("patient", merged.patient);
    if (merged.clinic) params.set("clinic", merged.clinic);
    if (merged.from) params.set("from", merged.from);
    if (merged.to) params.set("to", merged.to);
    const query = params.toString();
    router.push(query ? `/admin/meetings?${query}` : "/admin/meetings");
  }

  const filtered = Boolean(filters.doctor || filters.patient || filters.clinic || filters.status || filters.from || filters.to);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Meetings</h1>
          <p className="text-[15px] text-ink-2">Every meeting and check-in on CareConnect.</p>
        </div>
        {filtered ? (
          <ButtonLink href="/admin/meetings" variant="ghost" size="sm">
            <X aria-hidden="true" className="size-4" />
            Clear filters
          </ButtonLink>
        ) : null}
      </div>

      {/* The counts. */}
      <div className="flex flex-wrap gap-2">
        <Badge tone="outline">{meetingCount} meetings</Badge>
        <Badge tone="outline">{checkInCount} check-ins</Badge>
        <Badge tone="brand">{total} in total</Badge>
      </div>

      {/* The filters. */}
      <Card tone="solid" className="flex flex-col gap-4 p-4">
        <Segmented
          label="Filter by what it is"
          value={filters.type}
          onChange={(value) => url({ type: value })}
          options={TYPES}
        />

        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            url({ doctor, patient, from, to });
          }}
        >
          <Field id="am-doctor" label="Doctor">
            <select
              id="am-doctor"
              value={filters.doctor}
              onChange={(e) => {
                setDoctor(e.target.value);
                url({ doctor: e.target.value });
              }}
              className="h-11 w-full rounded-field border border-line bg-white/80 px-3 text-[15px] text-ink"
            >
              <option value="">Every doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
          </Field>

          <Field id="am-patient" label="Patient">
            <select
              id="am-patient"
              value={filters.patient}
              onChange={(e) => {
                setPatient(e.target.value);
                url({ patient: e.target.value });
              }}
              className="h-11 w-full rounded-field border border-line bg-white/80 px-3 text-[15px] text-ink"
            >
              <option value="">Every patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </Field>

          <Field id="am-clinic" label="Clinic">
            <select
              id="am-clinic"
              value={filters.clinic}
              onChange={(e) => url({ clinic: e.target.value })}
              className="h-11 w-full rounded-field border border-line bg-white/80 px-3 text-[15px] text-ink"
            >
              <option value="">Every clinic</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field id="am-status" label="Status">
            <select
              id="am-status"
              value={filters.status}
              onChange={(e) => url({ status: e.target.value })}
              className="h-11 w-full rounded-field border border-line bg-white/80 px-3 text-[15px] text-ink"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field id="am-from" label="From">
            <TextInput id="am-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>

          <Field id="am-to" label="To">
            <TextInput id="am-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>

          <div className="flex items-end sm:col-span-2">
            <Button type="submit" block>
              <Filter aria-hidden="true" className="size-[18px]" />
              Apply filters
            </Button>
          </div>
        </form>
      </Card>

      {/* The list. */}
      {rows.length === 0 ? (
        <Card tone="solid" className="flex flex-1 items-center justify-center p-6">
          <EmptyState icon={CalendarClock} title="Nothing here">
            {filtered ? "No appointment matches these filters." : "No meetings or check-ins yet."}
          </EmptyState>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={`${row.type}-${row.id}`}>
              <Card tone="solid" className="flex flex-col gap-3 p-4">
                <AppointmentCard
                  type={row.type}
                  meeting={row.meeting}
                  checkIn={row.checkIn}
                  viewerRole="admin"
                  compact
                />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink-2">
                  <span className="font-medium text-ink">{row.doctorName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-ink">{row.patientName}</span>
                  {row.clinicName ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{row.clinicName}</span>
                    </>
                  ) : null}
                </div>
                <div>
                  <ButtonLink href={`/admin/c/${row.conversationId}`} variant="outline" size="sm">
                    <MessageCircle aria-hidden="true" className="size-4" />
                    Open the chat
                  </ButtonLink>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {/* The pager. */}
      {pages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-ink-2">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <ButtonLink href={`/admin/meetings?${buildQuery(filters, page - 1)}`} variant="secondary" size="sm">
                Previous
              </ButtonLink>
            ) : null}
            {page < pages ? (
              <ButtonLink href={`/admin/meetings?${buildQuery(filters, page + 1)}`} variant="secondary" size="sm">
                Next
              </ButtonLink>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
