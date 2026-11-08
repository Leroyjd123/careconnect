import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getAdminActorNames, getAdminAuditLog } from "@/lib/data";
import { AdminAudit } from "./AdminAudit";

export const metadata: Metadata = { title: "Audit log · Admin" };

type Search = {
  page?: string;
  /** Search the actor's name. "system" finds the cron. */
  actor?: string;
  /** The action group: all, views, messages, prescriptions, people, meetings. */
  action?: string;
  from?: string;
  to?: string;
};

/**
 * The admin's audit log (decisions 54–55): who did what, and when.
 * The filters live in the query string, so a filtered view can be shared or bookmarked.
 */
export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireProfile("admin");
  const { page, actor, action, from, to } = await searchParams;

  const pageNumber = Math.max(1, Number(page) || 1);
  const { rows, total } = await getAdminAuditLog({
    page: pageNumber,
    actorQuery: actor,
    actionGroup: action,
    from,
    to,
  });

  // The names of the people who did these things.
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((id): id is string => !!id))];
  const actorNames = await getAdminActorNames(actorIds);

  // The pager and the filters keep the other filters.
  const params = new URLSearchParams();
  if (actor) params.set("actor", actor);
  if (action && action !== "all") params.set("action", action);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const queryBase = `/admin/audit${params.toString() ? `?${params.toString()}&` : "?"}`;

  return (
    <AdminAudit
      rows={rows}
      actorNames={actorNames}
      total={total}
      page={pageNumber}
      queryBase={queryBase}
      filters={{ actor: actor ?? "", action: action ?? "all", from: from ?? "", to: to ?? "" }}
    />
  );
}
