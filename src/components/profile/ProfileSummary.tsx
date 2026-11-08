import type { ReactNode } from "react";
import Link from "next/link";
import {
  Ban,
  Building2,
  CalendarClock,
  Check,
  CircleSlash,
  ClipboardList,
  FileText,
  Languages,
  MessageCircle,
  Pill,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { AppointmentCard } from "@/components/chat/AppointmentCard";
import { PrescriptionCard } from "@/components/rx/PrescriptionCard";
import { FileCard } from "@/components/chat/FileCard";
import { ageFrom, formatDate, formatRelative } from "@/lib/utils";
import type { CheckIn, Meeting, Message, OtherDoctor, PrescriptionWithPeople, Profile } from "@/lib/types";

/** Who is looking. The scope of the page changes with it. */
export type ProfileViewerRole = "admin" | "doctor" | "patient";

export type ProfileSummaryProps = {
  /** Who is looking. The admin sees everything, a doctor and a patient see their own scope. */
  viewerRole: ProfileViewerRole;
  /** The person this page is about. */
  person: Profile;
  /** The person's clinic, if they have one. */
  clinicName?: string | null;
  /** The person's specialty (a doctor). */
  specialty?: string | null;
  /** The one chat the doctor or patient is limited to. */
  conversationId?: string | null;
  /** The chats this person has, for the admin. */
  chats?: { id: string; otherName: string; otherRole: "doctor" | "patient"; blockedAt?: string | null }[];
  /** The prescriptions, for the admin and the doctor. */
  prescriptions?: PrescriptionWithPeople[];
  /** The report (file) messages, for the admin and the doctor. */
  reports?: Message[];
  /** The meetings, for the admin, the doctor and the patient. */
  meetings?: Meeting[];
  /** The check-ins, for the admin, the doctor and the patient. */
  checkIns?: CheckIn[];
  /** The patient's other doctors, by name only (decision 26). */
  otherDoctors?: OtherDoctor[];
  /** The counts, for the admin's doctor page. */
  stats?: { label: string; value: number | string }[];
  /** Where a report opens (the audited ?file= flow). */
  fileHrefBase?: string;
  /** Where a prescription opens in its chat. Defaults to the admin's chat. */
  rxHrefBase?: string;
  /** Extra buttons under the header: the admin's edit / deactivate. */
  actions?: ReactNode;
  /** The page's own heading area, above the summary. */
  header?: ReactNode;
};

/** A small labelled fact, like "Specialty: General Medicine". */
function Fact({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[16px] text-ink-2">{label}</span>
      <span className="text-[16px] font-medium text-ink">{value}</span>
    </div>
  );
}

/** The status badge for a person: Active / Deactivated / Invite pending / Account blocked. */
function statusBadge(person: Profile) {
  if (person.blocked_at) return <Badge tone="danger" icon={<Ban aria-hidden="true" />}>Account blocked</Badge>;
  if (person.role === "doctor" && person.deactivated_at) {
    return <Badge tone="danger" icon={<Ban aria-hidden="true" />}>Deactivated</Badge>;
  }
  if (person.status === "invited") return <Badge tone="neutral" icon={<CircleSlash aria-hidden="true" />}>Invite pending</Badge>;
  return <Badge tone="brand" icon={<Check aria-hidden="true" />}>Active</Badge>;
}

/** The language of a patient, in their own words. */
const LANGUAGES: Record<string, string> = { en: "English", kn: "Kannada", ml: "Malayalam" };

/**
 * The collated profile page (decision 77). One body for three roles:
 * the admin sees everything about a doctor or a patient, a doctor sees one patient
 * limited to their own chat with them, and a patient sees their doctor's public details.
 *
 * What each role sees is decided by the page that renders this, and again by RLS.
 */
export function ProfileSummary({
  viewerRole,
  person,
  clinicName,
  specialty,
  conversationId,
  chats = [],
  prescriptions = [],
  reports = [],
  meetings = [],
  checkIns = [],
  otherDoctors = [],
  stats = [],
  fileHrefBase,
  rxHrefBase,
  actions,
  header,
}: ProfileSummaryProps) {
  const isPatient = person.role === "patient";
  const admin = viewerRole === "admin";
  const doctor = viewerRole === "doctor";
  const patient = viewerRole === "patient";

  // The patient sees only their doctor's public details (decision 77).
  const showPrivateDetails = admin || doctor;
  const showHealth = showPrivateDetails && isPatient;
  const showReports = showPrivateDetails;
  const showPrescriptions = showPrivateDetails;
  const showChats = admin;
  // A patient's contact details are private. A patient never sees their doctor's email.
  const showContact = showPrivateDetails || isPatient;

  // The appointments that are still to come, and the ones that are past.
  const now = Date.now();
  const upcomingMeetings = meetings.filter((m) => m.status === "scheduled" && Date.parse(m.starts_at) >= now);
  const upcomingCheckIns = checkIns.filter((c) => c.status === "scheduled");
  const pastMeetings = meetings.filter((m) => !upcomingMeetings.includes(m));
  const pastCheckIns = checkIns.filter((c) => !upcomingCheckIns.includes(c));

  return (
    <div className="flex flex-col gap-4">
      {header}

      {/* Who this is. */}
      <Card tone="solid" className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={person.full_name} seed={person.id} doctor={!isPatient} size="lg" ring />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[22px] font-semibold tracking-tight text-ink">{person.full_name || "Unnamed"}</span>
            <span className="text-[16px] text-ink-2">{isPatient ? "Patient" : (specialty ?? "Doctor")}</span>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {statusBadge(person)}
              {clinicName ? (
                <Badge tone="outline" icon={<Building2 aria-hidden="true" />}>
                  {clinicName}
                </Badge>
              ) : null}
              {isPatient ? (
                <Badge tone="outline" icon={<Languages aria-hidden="true" />}>
                  {LANGUAGES[person.language] ?? "English"}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        {/* The facts. */}
        <dl className="grid grid-cols-2 gap-4 border-t border-line-soft pt-4 sm:grid-cols-3">
          {!isPatient ? <Fact label="Specialty" value={specialty ?? "Not set"} /> : null}
          {!isPatient ? <Fact label="Registration number" value={person.reg_no ?? "Not set"} /> : null}
          {!isPatient ? <Fact label="Clinic" value={clinicName ?? "No clinic"} /> : null}
          {showHealth ? (
            <Fact label="Date of birth" value={person.date_of_birth ? `${formatDate(person.date_of_birth)} (${ageFrom(person.date_of_birth)})` : "Not set"} />
          ) : null}
          {showHealth ? <Fact label="Height" value={person.height_cm ? `${person.height_cm} cm` : "Not set"} /> : null}
          {showHealth ? <Fact label="Weight" value={person.weight_kg ? `${person.weight_kg} kg` : "Not set"} /> : null}
          {showContact ? <Fact label="Email" value={person.email ?? "Not set"} /> : null}
          {showContact ? <Fact label="Mobile" value={person.phone ?? "Not set"} /> : null}
          {showPrivateDetails ? <Fact label="Joined" value={formatDate(person.created_at)} /> : null}
        </dl>

        {actions ? <div className="flex flex-wrap gap-2 border-t border-line-soft pt-4">{actions}</div> : null}
      </Card>

      {/* The counts, for the admin. */}
      {admin && stats.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <li key={stat.label}>
              <Card tone="solid" className="flex flex-col gap-1 p-4">
                <span className="text-[28px] leading-none font-semibold tracking-tight text-ink">{stat.value}</span>
                <span className="text-[14px] text-ink-2">{stat.label}</span>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}

      {/* The chats, for the admin. */}
      {showChats ? (
        <Card tone="solid" className="flex flex-col gap-3 p-5">
          <h2 className="flex items-center gap-2 text-[17px] font-semibold text-ink">
            <MessageCircle aria-hidden="true" className="size-5 text-ink-2" />
            {isPatient ? "Chats" : "Patients"}
          </h2>
          {chats.length === 0 ? (
            <p className="text-[15px] text-ink-2">No chats yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <Link
                    href={`/admin/c/${chat.id}`}
                    className="flex min-h-11 items-center gap-3 rounded-tile bg-white/70 px-3 py-2.5 text-ink no-underline hover:bg-white hover:text-ink"
                  >
                    <UserRound aria-hidden="true" className="size-5 shrink-0 text-ink-2" />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{chat.otherName}</span>
                    {chat.blockedAt ? (
                      <Badge tone="warning" icon={<Ban aria-hidden="true" />}>
                        Chat blocked
                      </Badge>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {/* The patient's other doctors, by name only (decision 26). */}
      {doctor && isPatient && otherDoctors.length > 0 ? (
        <Card tone="solid" className="flex flex-col gap-3 p-5">
          <h2 className="flex items-center gap-2 text-[17px] font-semibold text-ink">
            <Stethoscope aria-hidden="true" className="size-5 text-ink-2" />
            Also consults
          </h2>
          <ul className="flex flex-wrap gap-2">
            {otherDoctors.map((d) => (
              <li key={d.id}>
                <Badge tone="outline">{d.full_name}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* The prescriptions. */}
      {showPrescriptions ? (
        <Card tone="solid" className="flex flex-col gap-3 p-5">
          <h2 className="flex items-center gap-2 text-[17px] font-semibold text-ink">
            <Pill aria-hidden="true" className="size-5 text-ink-2" />
            Prescriptions
          </h2>
          {prescriptions.length === 0 ? (
            <p className="text-[15px] text-ink-2">No prescriptions yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {prescriptions.map((rx) => (
                <li key={rx.id}>
                  <PrescriptionCard
                    issuedAt={rx.issued_at ?? rx.created_at}
                    medicines={(rx.prescription_items ?? []).map((i) => i.medicine)}
                    draft={rx.status === "draft"}
                    cancelled={!!rx.cancelled_at}
                    doctorName={isPatient ? rx.doctor.full_name : undefined}
                    actions={
                      conversationId ? (
                        <ButtonLink
                          href={`${rxHrefBase ?? `/admin/c/${conversationId}`}?rx=${rx.id}`}
                          variant="outline"
                          size="sm"
                        >
                          View in chat
                        </ButtonLink>
                      ) : null
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {/* The reports. */}
      {showReports ? (
        <Card tone="solid" className="flex flex-col gap-3 p-5">
          <h2 className="flex items-center gap-2 text-[17px] font-semibold text-ink">
            <FileText aria-hidden="true" className="size-5 text-ink-2" />
            Reports
          </h2>
          {reports.length === 0 ? (
            <p className="text-[15px] text-ink-2">No reports yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {reports.map((report) => (
                <li key={report.id}>
                  <FileCard
                    name={report.file_name ?? "Attachment"}
                    size={report.file_size}
                    type={report.file_type}
                    meta={formatRelative(report.created_at)}
                    href={fileHrefBase ? `${fileHrefBase}${report.id}` : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {/* What is coming up. */}
      {upcomingMeetings.length > 0 || upcomingCheckIns.length > 0 ? (
        <Card tone="solid" className="flex flex-col gap-3 p-5">
          <h2 className="flex items-center gap-2 text-[17px] font-semibold text-ink">
            <CalendarClock aria-hidden="true" className="size-5 text-ink-2" />
            Coming up
          </h2>
          <ul className="flex flex-col gap-3">
            {upcomingMeetings.map((m) => (
              <li key={m.id}>
                <AppointmentCard type="meeting" meeting={m} viewerRole={viewerRole} compact />
              </li>
            ))}
            {upcomingCheckIns.map((c) => (
              <li key={c.id}>
                <AppointmentCard type="check_in" checkIn={c} viewerRole={viewerRole} compact />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* What already happened. */}
      {admin && (pastMeetings.length > 0 || pastCheckIns.length > 0) ? (
        <Card tone="solid" className="flex flex-col gap-3 p-5">
          <h2 className="flex items-center gap-2 text-[17px] font-semibold text-ink">
            <ClipboardList aria-hidden="true" className="size-5 text-ink-2" />
            Past
          </h2>
          <ul className="flex flex-col gap-3">
            {pastMeetings.map((m) => (
              <li key={m.id}>
                <AppointmentCard type="meeting" meeting={m} viewerRole="admin" compact />
              </li>
            ))}
            {pastCheckIns.map((c) => (
              <li key={c.id}>
                <AppointmentCard type="check_in" checkIn={c} viewerRole="admin" compact />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* A patient with nothing scheduled yet. */}
      {patient && !upcomingMeetings.length && !upcomingCheckIns.length ? (
        <Card tone="solid" className="p-5">
          <EmptyState icon={CalendarClock} title="Nothing scheduled yet">
            Your doctor will add a meeting or a check-in here.
          </EmptyState>
        </Card>
      ) : null}
    </div>
  );
}


