"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, X } from "lucide-react";
import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, TextInput } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import type { AuditEntry } from "@/lib/types";

type Props = {
  rows: AuditEntry[];
  actorNames: Record<string, string>;
  total: number;
  page: number;
  queryBase: string;
  filters: { actor: string; action: string; from: string; to: string };
};

const GROUPS = [
  { value: "all", label: "All" },
  { value: "views", label: "Views" },
  { value: "messages", label: "Messages" },
  { value: "prescriptions", label: "Prescriptions" },
  { value: "people", label: "People" },
  { value: "meetings", label: "Meetings" },
];

/**
 * The admin's audit log screen: the filters, then the table.
 * Every filter goes into the query string, so the view can be shared and the pager
 * keeps the filters.
 */
export function AdminAudit({ rows, actorNames, total, page, queryBase, filters }: Props) {
  const router = useRouter();
  const [actor, setActor] = useState(filters.actor);
  const [from, setFrom] = useState(filters.from);
  const [to, setTo] = useState(filters.to);

  /** Builds the URL for a set of filters. */
  function url(next: { actor?: string; action?: string; from?: string; to?: string }) {
    const params = new URLSearchParams();
    const a = next.actor ?? filters.actor;
    const g = next.action ?? filters.action;
    const f = next.from ?? filters.from;
    const t = next.to ?? filters.to;
    if (a) params.set("actor", a);
    if (g && g !== "all") params.set("action", g);
    if (f) params.set("from", f);
    if (t) params.set("to", t);
    const query = params.toString();
    router.push(query ? `/admin/audit?${query}` : "/admin/audit");
  }

  const filtered = filters.actor || filters.action !== "all" || filters.from || filters.to;

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Audit log</h1>
          <p className="text-[15px] text-ink-2">Everything an admin has changed, newest first.</p>
        </div>
        {filtered ? (
          <ButtonLink href="/admin/audit" variant="ghost" size="sm">
            <X aria-hidden="true" className="size-4" />
            Clear filters
          </ButtonLink>
        ) : null}
      </div>

      {/* The filters. */}
      <Card tone="subtle" className="flex flex-col gap-4 p-4">
        <Segmented
          label="Filter by what happened"
          value={filters.action}
          onChange={(value) => url({ action: value })}
          options={GROUPS}
          columnsClass="[--seg-cols:2] sm:[--seg-cols:3] lg:[--seg-cols:6]"
        />

        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            url({ actor, from, to });
          }}
        >
          <Field id="audit-actor" label="Who">
            <TextInput
              id="audit-actor"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="Name, or system"
            />
          </Field>
          <Field id="audit-from" label="From">
            <TextInput id="audit-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field id="audit-to" label="To">
            <TextInput id="audit-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" block>
              <Filter aria-hidden="true" className="size-[18px]" />
              Apply filters
            </Button>
          </div>
        </form>
      </Card>

      <AuditLogTable rows={rows} actorNames={actorNames} total={total} page={page} queryBase={queryBase} />
    </main>
  );
}
