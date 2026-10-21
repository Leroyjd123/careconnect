"use client";

import { Suspense, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  ChevronRight,
  MoveDiagonal2,
  ArrowUp,
  Bell,
  BellOff,
  Camera,
  Check,
  ChevronLeft,
  CircleAlert,
  Clock,
  Download,
  FilePlus2,
  FileQuestion,
  FileText,
  FileUp,
  House,
  Image as ImageIcon,
  Inbox,
  Info,
  LifeBuoy,
  Lock,
  LogOut,
  MessageCircle,
  MessageSquare,
  Moon,
  Paperclip,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Sunrise,
  Trash2,
  TriangleAlert,
  Upload,
  UserPlus,
  UserRound,
  Users,
  WifiOff,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, CountBadge } from "@/components/ui/Badge";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Dialog } from "@/components/ui/Dialog";
import { Banner, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { Field, InputAddon, TextArea, TextInput } from "@/components/ui/Field";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { Segmented } from "@/components/ui/Segmented";
import { ChatDivider, MessageBubble } from "@/components/chat/MessageBubble";
import { FileCard, FileTypeTile } from "@/components/chat/FileCard";
import { MessageItem } from "@/components/chat/MessageItem";
import { Composer } from "@/components/chat/Composer";
import { AttachSheet } from "@/components/chat/AttachSheet";
import { PrescriptionCard } from "@/components/rx/PrescriptionCard";
import { DoseSchedule } from "@/components/rx/DoseSchedule";
import { MedicineFields } from "@/components/rx/MedicineFields";
import { PrescriptionView } from "@/components/rx/PrescriptionView";
import { ReviewIssueDialog } from "@/components/rx/ReviewIssueDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { TabBar } from "@/components/layout/TabBar";
import { DoctorSidebar } from "@/components/layout/DoctorSidebar";
import { NotificationToggle, type NotificationState } from "@/components/layout/NotificationToggle";
import { ErrorScreen } from "@/components/layout/ErrorScreen";
import { SettingsRow } from "@/components/layout/SettingsRow";
import { IconTile } from "@/components/ui/IconTile";
import { ConversationList } from "@/components/doctor/ConversationList";
import { PatientPanel } from "@/components/doctor/PatientPanel";
import { PatientsTable } from "@/components/doctor/PatientsTable";
import { ReleaseNotes } from "@/components/doctor/ReleaseNotes";
import { InviteDialog } from "@/components/doctor/InviteDialog";
import { FileViewer } from "@/components/chat/FileViewer";
import { LoginForm } from "@/app/login/LoginForm";
import { SetPasswordForm } from "@/app/set-password/SetPasswordForm";
import { JoinForm } from "@/app/join/[token]/JoinForm";
import { APP_VERSION, RELEASES } from "@/lib/releases";
import { DURATION_OPTIONS, FREQUENCY_OPTIONS, LANGUAGES, TIMING_OPTIONS } from "@/lib/constants";
import type { ActionResult, DraftItem } from "@/lib/types";
import * as demo from "./demo";

/* ───────────────────────── page scaffolding ───────────────────────── */

const GROUPS: { group: string; items: [id: string, title: string][] }[] = [
  { group: "Foundations", items: [["colors", "Colours"], ["type", "Typography"], ["shape", "Radius & shadow"], ["glass", "Glass surfaces"], ["icons", "Icons"], ["focus", "Keyboard focus"], ["brand", "Logo"]] },
  { group: "Primitives", items: [["buttons", "Buttons"], ["fields", "Form fields"], ["choices", "Segmented & chips"], ["avatars", "Avatars & badges"], ["tiles", "Icon tile & settings row"], ["cards", "Cards"]] },
  { group: "Feedback", items: [["banners", "Banners"], ["empty", "Empty & error states"], ["loading", "Loading"]] },
  { group: "Overlays", items: [["dialogs", "Dialogs & sheets"]] },
  { group: "Navigation", items: [["nav", "Tab bar & sidebar"], ["header", "Page header"]] },
  { group: "Chat", items: [["bubbles", "Bubbles & dividers"], ["files", "File cards"], ["messages", "Message rows"], ["composer", "Composer"], ["viewer", "File viewer"]] },
  { group: "Prescriptions", items: [["rxcards", "Prescription cards"], ["dose", "Dose schedule"], ["medicine", "Medicine row"], ["rxview", "Full prescription"], ["print", "Print / PDF"]] },
  { group: "Doctor", items: [["inbox", "Conversation list"], ["panel", "Patient panel"], ["table", "Patients table"], ["releases", "Release notes"]] },
  { group: "Account", items: [["signin", "Sign in & password"], ["notifications", "Notifications"]] },
  { group: "Edge cases", items: [["edges", "Long, empty, many"]] },
  { group: "Review", items: [["coverage", "Coverage"], ["review", "Merge & fix list"]] },
];

function Section({ id, title, file, use, issues, children }: { id: string; title: string; file: string; use?: string; issues?: string[]; children: ReactNode }) {
  const linked = REVIEW.filter((r) => issues?.includes(r.id));
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-4 lg:scroll-mt-6 [&:target_h3]:text-forest">
      <div className="flex flex-col gap-1">
        <h3 className="text-[17px] font-semibold tracking-tight">{title}</h3>
        <code className="text-[13px] text-ink-2">{file}</code>
        {use ? <p className="text-[15px] text-ink-2">{use}</p> : null}
        {linked.length ? (
          <ul aria-label="Open review items" className="mt-1 flex flex-wrap gap-2">
            {linked.map((r) => (
              <li key={r.id}>
                <a href={`#review-${r.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-3 py-1 text-[13px] font-semibold text-warning no-underline hover:text-warning">
                  <TriangleAlert aria-hidden="true" className="size-3.5" />
                  <span className="sr-only">Review item:</span>
                  {r.kind}: {r.title}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <Card tone="subtle" className="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
        {children}
      </Card>
    </section>
  );
}

function GroupTitle({ children }: { children: ReactNode }) {
  return <h2 className="border-b border-line pb-3 text-[22px] font-semibold tracking-tight text-forest">{children}</h2>;
}

/** Label under a specimen. */
function Spec({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
      <p className="mt-1.5 text-[13px] text-ink-2">{label}</p>
    </div>
  );
}

/** A specimen with a plain-English name and the exact prop that produces it. */
function Variant({ name, code, children, className }: { name: string; code?: string; children: ReactNode; className?: string }) {
  return (
    <figure className={`flex flex-col items-start gap-2 ${className ?? ""}`}>
      {children}
      <figcaption className="flex flex-col">
        <span className="text-[13px] font-semibold text-ink">{name}</span>
        {code ? <code className="text-[13px] text-ink-2">{code}</code> : null}
      </figcaption>
    </figure>
  );
}

/** `position: fixed` children (TabBar) position against a transformed ancestor, so they can be shown inline. */
function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`relative overflow-hidden rounded-card border border-line bg-ground [transform:translateZ(0)] ${className ?? ""}`}>{children}</div>;
}

/* ───────────────────────── foundations data ───────────────────────── */

const COLORS: { group: string; tokens: [token: string, name: string, use: string][] }[] = [
  { group: "Brand", tokens: [["forest", "Eucalyptus", "Primary actions, selected, links"], ["forest-700", "Eucalyptus Deep", "Hover / pressed"], ["sage", "Sage", "Background light, pending outline"]] },
  { group: "Surfaces", tokens: [["ground", "Garden Ground", "App background"], ["mint", "Mint Mist", "Soft fills"], ["mint-200", "Mint Leaf", "Soft button, active tab"], ["mint-300", "Mint Bud", "My bubble, avatars"], ["ivory", "Ivory", "Sheets, dialogs"]] },
  { group: "Text & lines", tokens: [["ink", "Forest Ink", "Primary text"], ["ink-2", "Moss Ink", "Secondary text"], ["ink-label", "Bark Ink", "Labels"], ["line", "Leaf Line", "Input borders"], ["line-soft", "Soft Line", "Dividers"]] },
  { group: "Status", tokens: [["danger", "Clay", "Errors"], ["danger-bg", "Clay bg", ""], ["warning", "Ochre", "Drafts, pending"], ["warning-bg", "Ochre bg", ""], ["file-pdf", "PDF Terracotta", "PDF tile only"], ["file-pdf-bg", "PDF bg", ""]] },
  { group: "Avatar tones", tokens: [["tone-sky", "Sky", ""], ["tone-sky-bg", "Sky bg", ""], ["tone-rose", "Rose", ""], ["tone-rose-bg", "Rose bg", ""]] },
];

// Tailwind needs literal class names, so the swatch classes are listed rather than built.
const SWATCH: Record<string, string> = {
  forest: "bg-forest", "forest-700": "bg-forest-700", sage: "bg-sage", ground: "bg-ground", mint: "bg-mint", "mint-200": "bg-mint-200",
  "mint-300": "bg-mint-300", ivory: "bg-ivory", ink: "bg-ink", "ink-2": "bg-ink-2", "ink-label": "bg-ink-label", line: "bg-line", "line-soft": "bg-line-soft",
  danger: "bg-danger", "danger-bg": "bg-danger-bg", warning: "bg-warning", "warning-bg": "bg-warning-bg", "file-pdf": "bg-file-pdf",
  "file-pdf-bg": "bg-file-pdf-bg", "tone-sky": "bg-tone-sky", "tone-sky-bg": "bg-tone-sky-bg", "tone-rose": "bg-tone-rose", "tone-rose-bg": "bg-tone-rose-bg",
};

const TYPE: [cls: string, label: string, sample: string][] = [
  ["text-[34px] font-semibold tracking-tight", "Display · 34 / 600 · patient home greeting", "Good morning"],
  ["text-[28px] font-semibold tracking-tight", "Display small · 28 / 600 · patient's name on Home", "Ravi Kumar"],
  ["text-[22px] font-semibold tracking-tight", "Headline · 22 / 600 · screen, dialog & empty-state titles", "Choose a password"],
  ["text-[17px] font-semibold", "Title · 17 / 600 · card titles, names in panels", "Dr. Sharma"],
  ["text-base", "Body · 16 / 400 · all patient reading text", "Please share your recent reports when you can."],
  ["text-[15px]", "Body compact · 15 / 400 · doctor lists, supporting lines", "Last message 2 hours ago"],
  ["text-sm", "14 / 400 · small buttons, table cells", "Resend invitation"],
  ["text-[13px] font-semibold", "Label · 13 / 600 · field labels, chips, meta", "Patient's full name"],
  ["text-xs font-semibold", "Caption · 12 / 600 · badges, tab labels, file-type tile", "Invite pending"],
  ["text-[11px] font-semibold", "11 / 600 · unread counter only", "99+"],
];

// Every lucide icon the app imports today. Explicit, so this page doesn't pull in the whole library.
const APP_ICONS: [name: string, Icon: LucideIcon][] = [
  ["Bell", Bell],
  ["BellOff", BellOff],
  ["Camera", Camera],
  ["Check", Check],
  ["ChevronLeft", ChevronLeft],
  ["CircleAlert", CircleAlert],
  ["Clock", Clock],
  ["Download", Download],
  ["FilePlus2", FilePlus2],
  ["FileQuestion", FileQuestion],
  ["FileText", FileText],
  ["FileUp", FileUp],
  ["House", House],
  ["Image", ImageIcon],
  ["Inbox", Inbox],
  ["Info", Info],
  ["LifeBuoy", LifeBuoy],
  ["Lock", Lock],
  ["LogOut", LogOut],
  ["MessageCircle", MessageCircle],
  ["MessageSquare", MessageSquare],
  ["Moon", Moon],
  ["Paperclip", Paperclip],
  ["Plus", Plus],
  ["Printer", Printer],
  ["RefreshCw", RefreshCw],
  ["Search", Search],
  ["Send", Send],
  ["Settings", Settings],
  ["ShieldCheck", ShieldCheck],
  ["Sparkles", Sparkles],
  ["Sun", Sun],
  ["Sunrise", Sunrise],
  ["Trash2", Trash2],
  ["TriangleAlert", TriangleAlert],
  ["Upload", Upload],
  ["UserPlus", UserPlus],
  ["UserRound", UserRound],
  ["Users", Users],
  ["WifiOff", WifiOff],
  ["Wrench", Wrench],
  ["X", X],
];

/* ───────────────────────── safe demo handlers ───────────────────────── */
// Composites that normally call server actions get these instead, so nothing on this page has side effects.

async function noop() {}

async function demoResend(): Promise<ActionResult> {
  return { ok: true };
}

async function demoInvite(): Promise<ActionResult<{ conversationId: string }>> {
  return { ok: true, data: { conversationId: "demo" } };
}

// Image: a real public file. Everything else: fails, so the error state shows.
async function demoCreateLink(): Promise<ActionResult<{ url: string; expiresAt: string }>> {
  return { ok: true, data: { url: "https://careconnect.example/join/demo-link-not-real", expiresAt: "2026-10-28T10:00:00.000Z" } };
}

async function demoJoin() {
  return { error: "Add your email or your mobile number, so you can sign in later.", values: { fullName: "Ravi Kumar", email: "", phone: "" } };
}

async function demoRemove(): Promise<ActionResult> {
  return { ok: false, error: "Example only: nothing was removed." };
}

async function demoFileUrl(path: string): Promise<ActionResult<{ url: string }>> {
  return path.endsWith(".png") ? { ok: true, data: { url: "/apple-icon" } } : { ok: false, error: "demo" };
}

async function demoLogin(_prev: { email: string }, formData: FormData) {
  return { email: String(formData.get("email") ?? ""), error: "That email and password don't match. Please try again." };
}

async function demoSetPassword() {
  return { error: "The two passwords don't match." };
}

const LONG_NAME = "Venkatasubramanian Raghunathan Iyer";

/** What this page shows, and what only the running app can show (and why). */
const COVERAGE: [component: string, where: string, status: "shown" | "app"][] = [
  ["Button, IconButton, ButtonLink", "#buttons", "shown"],
  ["Field, TextInput, TextArea, InputAddon", "#fields", "shown"],
  ["Segmented, ChipGroup", "#choices", "shown"],
  ["Avatar, Badge, CountBadge", "#avatars", "shown"],
  ["IconTile, SettingsRow", "#tiles", "shown"],
  ["Card", "#cards", "shown"],
  ["ErrorScreen", "#empty", "shown"],
  ["Banner, EmptyState, Skeleton", "#banners", "shown"],
  ["Dialog, AttachSheet, ReviewIssueDialog, InviteDialog", "#dialogs", "shown"],
  ["TabBar, DoctorSidebar, PageHeader", "#nav", "shown"],
  ["MessageBubble, ChatDivider, MessageItem, FileCard, Composer", "#bubbles", "shown"],
  ["FileViewer", "#viewer", "shown"],
  ["PrescriptionCard, DoseSchedule, MedicineFields, PrescriptionView", "#rxcards", "shown"],
  ["ConversationList, PatientPanel, PatientsTable, ReleaseNotes", "#inbox", "shown"],
  ["LoginForm, JoinForm, SetPasswordForm, NotificationToggle", "#signin", "shown"],
  ["Logo, LogoMark", "#brand", "shown"],
  ["Conversation (live chat: realtime, sending queue, offline)", "/chat · /doctor/c/[id]", "app"],
  ["PrescriptionComposer (autosave + issue)", "/doctor/c/[id]?rx=new", "app"],
  ["PatientTabBar (patient items for TabBar)", "/home", "app"],
  ["BackgroundScene (behind this whole page)", "every page", "app"],
];

const NOTIFICATION_STATES: [NotificationState, string, "patient" | "doctor", string?][] = [
  ["off", "Off · patient", "patient"],
  ["on", "On · patient", "patient"],
  ["install", "iPhone, not on Home Screen", "patient"],
  ["denied", "Blocked in the browser", "patient"],
  ["unsupported", "Browser can't notify", "doctor"],
  ["off", "Error · doctor", "doctor", "We couldn't turn on notifications. Please try again."],
];

/* ───────────────────────── review list ───────────────────────── */

type ReviewItem = {
  id: string;
  kind: "Merge" | "Fix" | "Check";
  title: string;
  /** Plain English: what's wrong and what the change would be. */
  detail: string;
  /** Sections where it shows up. */
  sections: [id: string, title: string][];
  compare: ReactNode;
};

const REVIEW: ReviewItem[] = [
  {
    id: "indic",
    kind: "Check",
    title: "Hindi and Kannada text",
    detail: "Nothing is translated yet. This is the prescription card with sample Hindi button labels: buttons that can't wrap must stack, and long names must not be cut off. Check again when real translations land.",
    sections: [["rxcards", "Prescription cards"]],
    compare: (
      <div className="grid gap-4 md:grid-cols-2">
        <Variant name="English">
          <PrescriptionCard issuedAt={demo.NOW} medicines={["Dolo 650"]} actions={<><Button variant="outline">View prescription</Button><Button variant="soft">Ask about this</Button></>} />
        </Variant>
        <Variant name="Hindi (sample)">
          <PrescriptionCard issuedAt={demo.NOW} medicines={["डोलो 650"]} actions={<><Button variant="outline">पर्चा देखें</Button><Button variant="soft">डॉक्टर से इसके बारे में पूछें</Button></>} />
        </Variant>
      </div>
    ),
  },
];

const KIND_ORDER = { Fix: 0, Merge: 1, Check: 2 } as const;
const DECISIONS = [...REVIEW].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
/** Section ids that have at least one open review item (for the dot in the menu). */
const SECTIONS_WITH_ISSUES = new Set(REVIEW.flatMap((r) => r.sections.map(([id]) => id)));
const SECTION_TITLES = Object.fromEntries(GROUPS.flatMap((g) => g.items));

/** Boxes for live components: the width they ship at, a set height, and a visible resize hint. */
function Stage({ size, height = "tall", children }: { size: "phone" | "panel" | "full"; height?: "tall" | "short"; children: ReactNode }) {
  const width = size === "phone" ? "max-w-[390px]" : size === "panel" ? "max-w-md" : "";
  return (
    <div className={`flex w-full flex-col gap-1.5 ${width}`}>
      <div className={`flex w-full resize-y overflow-auto rounded-card ${height === "tall" ? "h-[500px]" : "h-[320px]"}`}>{children}</div>
      <span className="flex items-center gap-1.5 self-end text-[13px] text-ink-2">
        <MoveDiagonal2 aria-hidden="true" className="size-3.5" />
        {size === "phone" ? "Phone 390px" : size === "panel" ? "Panel 448px" : "Full width"} · drag the corner to resize
      </span>
    </div>
  );
}

/* ───────────────────────── the page ───────────────────────── */

const PHONE = 390;

/**
 * framed: the page is running inside the phone preview iframe, so it drops its own chrome
 * and the real phone breakpoints apply (Tailwind reads the iframe's width, not a box's).
 */
export function Styleguide({ framed = false }: { framed?: boolean }) {
  const now = demo.NOW;
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [lang, setLang] = useState<string>("en");
  const [freq, setFreq] = useState<string | null>(null);
  const [dur, setDur] = useState<string | null>("3 days");
  const [timing, setTiming] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [attach, setAttach] = useState(false);
  const [review, setReview] = useState(false);
  const [draft, setDraft] = useState("I'll send the report tonight.");
  const [medicine, setMedicine] = useState<DraftItem>(demo.medicine);
  const [hex, setHex] = useState<Record<string, string>>({});
  const [phone, setPhone] = useState(false);
  const [wouldOpen, setWouldOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const iframe = useRef<HTMLIFrameElement>(null);

  // Examples render real components with real links. Keep the reviewer on this page:
  // in-page anchors and /styleguide links work; anything else shows where it would have gone.
  function keepOnPage(e: MouseEvent) {
    const a = (e.target as HTMLElement).closest("a[href]");
    if (!a) return;
    const url = new URL((a as HTMLAnchorElement).href, window.location.href);
    if (url.origin === window.location.origin && url.pathname === "/styleguide") return;
    e.preventDefault();
    e.stopPropagation();
    setWouldOpen(url.pathname + url.search);
  }

  useEffect(() => {
    if (!wouldOpen) return;
    const t = setTimeout(() => setWouldOpen(null), 3500);
    return () => clearTimeout(t);
  }, [wouldOpen]);
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);

  // Scroll-spy: the section nearest the top of the screen is "current" in the menu.
  useEffect(() => {
    const sections = GROUPS.flatMap((g) => g.items.map(([id]) => document.getElementById(id))).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    sections.forEach((el) => observer.observe(el));
    const onScroll = () => setScrolled(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  const [hash, setHash] = useState("");

  // Tell the phone preview where we are; inside the preview, follow those messages.
  useEffect(() => {
    if (phone && active) iframe.current?.contentWindow?.postMessage({ scrollTo: active }, window.location.origin);
  }, [phone, active]);

  useEffect(() => {
    if (!framed) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || typeof e.data?.scrollTo !== "string") return;
      document.getElementById(e.data.scrollTo)?.scrollIntoView({ block: "start" });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [framed]);

  // Keep the jump menu in step with the address bar.
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // Read token values from the CSS so this page never hard-codes a colour.
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    setHex(Object.fromEntries(Object.keys(SWATCH).map((t) => [t, css.getPropertyValue(`--color-${t}`).trim()])));
  }, []);

  return (
    <div className={framed ? "flex px-3 py-4" : `mx-auto flex max-w-[1440px] gap-8 px-4 py-8 sm:px-6 ${phone ? "lg:pr-[452px]" : ""}`}>
      {/* Table of contents */}
      {framed ? null : (
      <nav aria-label="Styleguide sections" className="glass sticky top-6 hidden h-[calc(100dvh-3rem)] w-56 shrink-0 flex-col gap-4 overflow-y-auto rounded-card p-4 shadow-float lg:flex">
        <a href="#decisions" className="sr-only focus:not-sr-only focus:rounded-field focus:bg-white focus:px-2 focus:py-1.5">
          Skip to decisions
        </a>
        <Logo />
        <TextInput aria-label="Filter sections" placeholder="Filter sections" value={filter} onChange={(e) => setFilter(e.target.value)} className="h-11 text-[15px]" />
        {GROUPS.map(({ group, items }) => {
          const q = filter.trim().toLowerCase();
          const shown = q ? items.filter(([, t]) => t.toLowerCase().includes(q) || group.toLowerCase().includes(q)) : items;
          if (!shown.length) return null;
          const open = !!q || items.some(([id]) => id === active) || group === "Review";
          return (
            <details key={group} open={open} className="group/toc">
              <summary className="flex min-h-9 cursor-pointer items-center justify-between rounded-field px-2 text-[13px] font-semibold text-ink-label hover:bg-white/50">
                {group}
                {group === "Review" ? <CountBadge count={DECISIONS.length} /> : null}
              </summary>
              <div className="flex flex-col gap-0.5 pt-0.5">
                {shown.map(([id, title]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    aria-current={active === id ? "location" : undefined}
                    className={
                      active === id
                        ? "flex items-center gap-2 rounded-field bg-white/90 px-2 py-1.5 text-sm font-semibold text-forest no-underline shadow-lift hover:text-forest"
                        : "flex items-center gap-2 rounded-field px-2 py-1.5 text-sm text-ink no-underline hover:bg-white/60 hover:text-ink"
                    }
                  >
                    <span className="flex-1">{title}</span>
                    {SECTIONS_WITH_ISSUES.has(id) ? (
                      <span className="size-2 rounded-full bg-warning" role="img" aria-label="has open review items" />
                    ) : null}
                  </a>
                ))}
              </div>
            </details>
          );
        })}
      </nav>
      )}

      <main id="top" onClickCapture={keepOnPage} className="flex min-w-0 flex-1 scroll-mt-6 flex-col gap-14">
        {framed ? null : (
          <>
          <div className="glass sticky top-3 z-30 -mb-8 flex items-center rounded-full p-1.5 pl-4 shadow-float lg:hidden">
            <label className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-[13px] font-semibold text-ink-label">Jump to</span>
              <select
                className="h-11 min-w-0 flex-1 rounded-full border border-line bg-white px-3 text-[15px]"
                value={active || hash.slice(1)}
                onChange={(e) => {
                  window.location.hash = e.target.value;
                }}
              >
                <option value="" disabled>
                  Choose a section
                </option>
                {GROUPS.map(({ group, items }) => (
                  <optgroup key={group} label={group}>
                    {items.map(([id, title]) => (
                      <option key={id} value={id}>
                        {title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>
          <div className="hidden justify-end lg:flex">
              <Segmented
                label="Preview width"
                value={phone ? "phone" : "page"}
                onChange={(v) => setPhone(v === "phone")}
                options={[
                  { value: "page", label: "This window" },
                  { value: "phone", label: `+ Phone ${PHONE}px` },
                ]}
              />
          </div>
          </>
        )}
        <header className="flex flex-col gap-2">
          <h1 className="text-[34px] font-semibold tracking-tight">CareConnect design system</h1>
          <p className="max-w-2xl text-ink-2">
            Every token and shared component on one page, with real states. Safe to click: nothing here signs you out, sends, saves or connects, and links in examples stay on this page. Amber notes under a title flag things to fix or merge;
            the full list is under <a href="#review">Review</a>. Tokens live in <code>src/app/globals.css</code>; the written rules in{" "}
            <code>DESIGN.md</code>.
          </p>
        </header>

        <section aria-labelledby="decisions" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="decisions" className="text-[22px] font-semibold tracking-tight text-forest">
              Decisions needed <span className="text-ink-2">({DECISIONS.length})</span>
            </h2>
            <span className="text-[13px] text-ink-2">Status as of version {APP_VERSION}</span>
          </div>
          <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {DECISIONS.map((r) => (
              <li key={r.id}>
                <a href={`#review-${r.id}`} className="glass flex min-h-11 items-center gap-2.5 rounded-tile px-3.5 py-2.5 text-[15px] text-ink no-underline shadow-lift hover:bg-white/85 hover:text-ink">
                  <Badge tone={r.kind === "Fix" ? "warning" : r.kind === "Merge" ? "brand" : "neutral"}>{r.kind}</Badge>
                  <span className="min-w-0 flex-1">{r.title}</span>
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-2" />
                </a>
              </li>
            ))}
          </ol>
        </section>

        {/* ═════════ FOUNDATIONS ═════════ */}
        <div className="flex flex-col gap-10">
          <GroupTitle>Foundations</GroupTitle>

          <Section id="colors" title="Colours" file="src/app/globals.css · @theme" use="Use the token class (bg-forest, text-ink-2). Never a hex value in a component.">
            {COLORS.map(({ group, tokens }) => (
              <div key={group} className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-ink-label">{group}</span>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  {tokens.map(([token, name, use]) => (
                    <div key={token} className="overflow-hidden rounded-tile border border-line-soft bg-white">
                      <div className={`h-16 ${SWATCH[token]}`} />
                      <div className="flex flex-col p-2.5">
                        <span className="text-[13px] font-semibold">{name}</span>
                        <code className="text-[13px] text-ink-2">{token}</code>
                        <code className="text-[13px] text-ink-2">{hex[token] || "…"}</code>
                        {use ? <span className="mt-1 text-[13px] leading-snug text-ink-2">{use}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Section>

          <Section id="type" title="Typography" file="Inter Variable (self-hosted)" use="One family. Hierarchy from size, weight and tight tracking. These ten sizes are the whole scale.">
            <Card tone="solid" className="flex flex-col divide-y divide-line-soft p-0">
              {TYPE.map(([cls, label, sample]) => (
                <div key={label} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-baseline sm:gap-6">
                  <span className="w-72 shrink-0 text-[13px] text-ink-2">{label}</span>
                  <span className={cls}>{sample}</span>
                </div>
              ))}
            </Card>
          </Section>

          <Section id="shape" title="Radius & shadow" file="--radius-* · --shadow-*">
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              <Spec label="field · 14px · inputs">
                <div className="h-20 rounded-field border border-line bg-white" />
              </Spec>
              <Spec label="tile · 20px · rows, tiles">
                <div className="h-20 rounded-tile border border-line bg-white" />
              </Spec>
              <Spec label="card · 28px · cards, panels">
                <div className="h-20 rounded-card border border-line bg-white" />
              </Spec>
              <Spec label="full · pills, chips, avatars">
                <div className="flex h-20 items-center">
                  <div className="h-12 w-full rounded-full border border-line bg-white" />
                </div>
              </Spec>
              <Spec label="shadow-float · cards, tab bar">
                <div className="h-20 rounded-tile bg-white shadow-float" />
              </Spec>
              <Spec label="shadow-lift · solid items on glass">
                <div className="h-20 rounded-tile bg-white shadow-lift" />
              </Spec>
              <Spec label="shadow-cta · primary button only">
                <div className="h-20 rounded-tile bg-forest shadow-cta" />
              </Spec>
              <Spec label="shadow-modal · dialogs">
                <div className="h-20 rounded-tile bg-white shadow-modal" />
              </Spec>
            </div>
          </Section>

          <Section id="glass" title="Glass surfaces" file="globals.css · @utility glass / glass-subtle / glass-strong" use="Three strengths only. Never write backdrop-filter in a component.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Spec label="glass-subtle · large panels (chat column)">
                <div className="glass-subtle h-28 rounded-card shadow-float" />
              </Spec>
              <Spec label="glass · default card">
                <div className="glass h-28 rounded-card shadow-float" />
              </Spec>
              <Spec label="glass-strong · dialogs, sheets">
                <div className="glass-strong h-28 rounded-card shadow-modal" />
              </Spec>
            </div>
          </Section>

          <Section id="icons" title="Icons" file="lucide-react" use="Every icon the app uses today. Patients always get a text label next to an icon.">
            <Card tone="solid" className="grid grid-cols-3 gap-1 p-3 sm:grid-cols-6 xl:grid-cols-8">
              {APP_ICONS.map(([name, Icon]) => {
                return (
                  <div key={name} className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-ink">
                    <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
                    <span className="text-[13px] text-ink-2">{name}</span>
                  </div>
                );
              })}
            </Card>
          </Section>

          <Section id="focus" title="Keyboard focus" file="globals.css · :focus-visible" use="Press Tab anywhere on this page to see the real ring. Below, the same ring drawn on so you can review it without a keyboard.">
            <div className="flex flex-wrap items-center gap-6">
              <Variant name="Main button" code="2px eucalyptus, 2px gap">
                <Button className="outline-2 outline-offset-2 outline-forest">Send message</Button>
              </Variant>
              <Variant name="Secondary on white">
                <Button variant="outline" className="outline-2 outline-offset-2 outline-forest">View prescription</Button>
              </Variant>
              <Variant name="Icon button">
                <IconButton label="Attach" tone="soft" className="outline-2 outline-offset-2 outline-forest" icon={<Paperclip className="size-5" />} />
              </Variant>
              <Variant name="Text field" code="border + soft halo" className="w-64">
                <TextInput aria-label="Focused field example" defaultValue="ravi@example.com" className="border-forest ring-4 ring-forest/10" />
              </Variant>
              <Variant name="Link">
                <a href="#focus" className="outline-2 outline-offset-2 outline-forest">Privacy notice</a>
              </Variant>
            </div>
          </Section>

          <Section id="brand" title="Logo" file="components/ui/Logo.tsx">
            <div className="flex flex-wrap items-end gap-8">
              <Spec label="Logo md">
                <Logo />
              </Spec>
              <Spec label="Logo lg">
                <Logo size="lg" />
              </Spec>
              <Spec label="LogoMark 48">
                <LogoMark size={48} />
              </Spec>
              <Spec label="LogoMark 24">
                <LogoMark size={24} />
              </Spec>
            </div>
          </Section>
        </div>

        {/* ═════════ PRIMITIVES ═════════ */}
        <div className="flex flex-col gap-10">
          <GroupTitle>Primitives</GroupTitle>

          <Section id="buttons" title="Buttons" file="components/ui/Button.tsx" use="One primary per screen. Secondary on glass, outline on solid white.">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-start gap-6">
                <Variant name="Main action (one per screen)" code="variant=&quot;primary&quot;">
                  <Button>Send message</Button>
                </Variant>
                <Variant name="Secondary, on glass" code='variant="secondary"'>
                  <Button variant="secondary">Cancel</Button>
                </Variant>
                <Variant name="Secondary, on white" code='variant="outline"'>
                  <Button variant="outline">View prescription</Button>
                </Variant>
                <Variant name="Brand, quieter" code='variant="soft"'>
                  <Button variant="soft">
                    <Plus className="size-4" aria-hidden="true" /> New prescription
                  </Button>
                </Variant>
                <Variant name="Text-only" code='variant="ghost"'>
                  <Button variant="ghost">Change email</Button>
                </Variant>
                <Variant name="Destructive" code='variant="danger"'>
                  <Button variant="danger">Sign out</Button>
                </Variant>
              </div>
              <div className="flex flex-wrap items-end gap-6">
                <Variant name="Small · 44px" code='size="sm"'>
                  <Button size="sm">Resend</Button>
                </Variant>
                <Variant name="Medium · 48px" code='size="md"'>
                  <Button>Resend</Button>
                </Variant>
                <Variant name="Large · 56px · patient main action" code='size="lg"'>
                  <Button size="lg">Continue</Button>
                </Variant>
                <Variant name="Working" code="loading">
                  <Button loading>Saving</Button>
                </Variant>
                <Variant name="Not available" code="disabled">
                  <Button disabled>Send message</Button>
                </Variant>
                <Variant name="Looks like a button, goes to a page" code="ButtonLink">
                  <ButtonLink href="#buttons" variant="soft">Open chat</ButtonLink>
                </Variant>
              </div>
              <div className="flex flex-wrap items-start gap-6">
                <Variant name="Icon, soft" code='IconButton tone="soft"'>
                  <IconButton label="Attach" tone="soft" icon={<Paperclip className="size-5" />} />
                </Variant>
                <Variant name="Icon, main" code='tone="primary"'>
                  <IconButton label="Send" tone="primary" icon={<Send className="size-5" />} />
                </Variant>
                <Variant name="Icon, glass" code='tone="glass"'>
                  <IconButton label="Download" tone="glass" icon={<Download className="size-5" />} />
                </Variant>
                <Variant name="Icon, plain" code='tone="plain"'>
                  <IconButton label="Search" tone="plain" icon={<Search className="size-5" />} />
                </Variant>
              </div>
              <Variant name="Full width · patient main action" code='size="lg" block' className="max-w-md">
                <Button size="lg" block>
                  Sign in
                </Button>
              </Variant>
            </div>
          </Section>

          <Section id="fields" title="Form fields" file="components/ui/Field.tsx" use="Every input goes through Field: label, control, hint or error.">
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <Field id="sg-name" label="Default">
                <TextInput id="sg-name" placeholder="e.g. Ravi Kumar" />
              </Field>
              <Field id="sg-hint" label="With hint" hint="Use the email your doctor's clinic has.">
                <TextInput id="sg-hint" type="email" placeholder="you@example.com" />
              </Field>
              <Field id="sg-email" label="Error" error="Enter a valid email address.">
                <TextInput id="sg-email" invalid defaultValue="ravi@" aria-describedby="sg-email-error" />
              </Field>
              <Field id="sg-dis" label="Disabled">
                <TextInput id="sg-dis" disabled defaultValue="Ravi Kumar" />
              </Field>
              <Field id="sg-addon" label="With addon">
                <div className="flex gap-2">
                  <InputAddon>+91</InputAddon>
                  <TextInput id="sg-addon" inputMode="tel" placeholder="98765 43210" />
                </div>
              </Field>
              <Field id="sg-pw" label="Password">
                <TextInput id="sg-pw" type="password" defaultValue="secret-pass" />
              </Field>
              <Field id="sg-note" label="Textarea, optional" optional hint="Shown to the doctor with the file." className="sm:col-span-2">
                <TextArea id="sg-note" rows={2} placeholder="e.g. Blood test from Friday" />
              </Field>
            </div>
          </Section>

          <Section id="choices" title="Segmented & chips" file="components/ui/Segmented.tsx · ChipGroup.tsx" use="Segmented: exactly one of 2–3 views. ChipGroup: quick picks; nothing clinical is pre-selected.">
            <div className="flex flex-col gap-5">
              <Segmented label="Filter" value={tab} onChange={setTab} options={[{ value: "all", label: "All patients" }, { value: "unread", label: "Unread · 2" }]} className="max-w-md" />
              <Segmented label="Language" value={lang} onChange={setLang} options={LANGUAGES.map((l) => ({ value: l.value, label: l.label }))} className="max-w-md" />
              <ChipGroup label="Frequency (nothing selected)" options={FREQUENCY_OPTIONS} value={freq} onChange={setFreq} />
              <ChipGroup label="Duration (selected)" options={DURATION_OPTIONS} value={dur} onChange={setDur} />
              <ChipGroup label="Timing (with Custom…)" options={TIMING_OPTIONS} value={timing} onChange={setTiming} allowCustom size="md" />
            </div>
          </Section>

          <Section id="avatars" title="Avatars & badges" file="components/ui/Avatar.tsx · Badge.tsx" use="Badges always carry words; colour alone never means anything.">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-end gap-4">
                <Spec label="doctor">
                  <Avatar name="Dr. Sharma" doctor />
                </Spec>
                <Spec label="patient tones">
                  <div className="flex gap-2">
                    <Avatar name="Ravi Kumar" />
                    <Avatar name="Priya Mehta" />
                    <Avatar name="Amit Patel" />
                  </div>
                </Spec>
                <Spec label="pending">
                  <Avatar name="Kavya Nair" pending />
                </Spec>
                <Spec label="sm / md / lg + ring">
                  <div className="flex items-end gap-2">
                    <Avatar name="Ravi Kumar" size="sm" />
                    <Avatar name="Ravi Kumar" />
                    <Avatar name="Ravi Kumar" size="lg" ring />
                  </div>
                </Spec>
              </div>
              <div className="flex flex-wrap items-start gap-6">
                <Variant name="Done / locked" code='tone="brand"'><Badge tone="brand" icon={<Lock />}>Issued</Badge></Variant>
                <Variant name="Newest" code='tone="solid"'><Badge tone="solid">Latest</Badge></Variant>
                <Variant name="Waiting on someone" code='tone="neutral"'><Badge tone="neutral" icon={<Clock />}>Invite pending</Badge></Variant>
                <Variant name="Not sent / replaced" code='tone="outline"'><Badge tone="outline">Not sent</Badge></Variant>
                <Variant name="Needs attention" code='tone="warning"'><Badge tone="warning">Draft</Badge></Variant>
                <Variant name="Problem" code='tone="danger"'><Badge tone="danger" icon={<TriangleAlert />}>Email not delivered</Badge></Variant>
                <Variant name="Unread count" code="CountBadge"><CountBadge count={2} /></Variant>
                <Variant name="Over 99" code="CountBadge"><CountBadge count={120} /></Variant>
              </div>
            </div>
          </Section>

          <Section id="tiles" title="Icon tile & settings row" file="components/ui/IconTile.tsx · components/layout/SettingsRow.tsx" use="The one icon square, and the tappable settings line built from it.">
            <div className="flex flex-wrap items-start gap-6">
              <Variant name="Soft" code='IconTile tone="soft"'>
                <IconTile><ShieldCheck aria-hidden="true" className="size-[22px]" /></IconTile>
              </Variant>
              <Variant name="Solid" code='tone="solid"'>
                <IconTile tone="solid"><FileText aria-hidden="true" className="size-5" /></IconTile>
              </Variant>
            </div>
            <div className="flex max-w-md flex-col gap-3">
              <SettingsRow href="/privacy" icon={ShieldCheck} title="Privacy notice" hint="What we keep and who can see it." />
              <SettingsRow href="/chat" icon={LifeBuoy} title="Help" hint="Message Dr. Sharma and they'll help." />
            </div>
          </Section>

          <Section id="cards" title="Cards" file="components/ui/Card.tsx" use="The one surface component. radius=&quot;tile&quot; for smaller rows.">
            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
              {(
                [
                  ["glass", "Default card"],
                  ["subtle", "Big panel (chat column)"],
                  ["strong", "Dialog or sheet"],
                  ["solid", "On top of glass"],
                  ["dashed", "Not sent yet (draft)"],
                ] as const
              ).map(([t, name]) => (
                <Variant key={t} name={name} code={`tone="${t}"`} className="w-full">
                  <Card tone={t} className="h-28 w-full" />
                </Variant>
              ))}
            </div>
          </Section>
        </div>

        {/* ═════════ FEEDBACK ═════════ */}
        <div className="flex flex-col gap-10">
          <GroupTitle>Feedback</GroupTitle>

          <Section id="banners" title="Banners" file="components/ui/Feedback.tsx · Banner" use="Inline status. Danger is announced to screen readers immediately.">
            <div className="flex max-w-2xl flex-col gap-3">
              <Banner tone="success">Prescription issued. Ravi can see it in chat and under Prescriptions.</Banner>
              <Banner tone="info">Draft · saved 10:19 AM · not visible to the patient</Banner>
              <Banner tone="offline">You&apos;re offline. Messages will send when you&apos;re back online.</Banner>
              <Banner tone="danger" action={<Button size="sm" variant="outline">Try again</Button>}>
                Not sent. Check your internet and try again.
              </Banner>
            </div>
          </Section>

          <Section id="empty" title="Empty & error states" file="components/ui/Feedback.tsx · EmptyState · app/*/error.tsx">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <EmptyState icon={FileText} title="No prescriptions yet" action={<ButtonLink href="#empty">Go to chat</ButtonLink>}>
                  When Dr. Sharma sends one, it will appear here and in your chat.
                </EmptyState>
              </Card>
              <Variant name="Error screen (both apps)" code="ErrorScreen" className="w-full">
                <Card className="w-full">
                  <ErrorScreen onRetry={() => {}} backHref="#empty" backLabel="Back to home" />
                </Card>
              </Variant>
            </div>
          </Section>

          <Section id="loading" title="Loading" file="Skeleton · app/*/loading.tsx · Button loading">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-16 rounded-3xl" />
                <Skeleton className="h-28 rounded-card" />
                <Skeleton className="h-16 rounded-card" />
              </div>
              <div className="flex items-start">
                <Button loading>Sending</Button>
              </div>
            </div>
          </Section>
        </div>

        {/* ═════════ OVERLAYS ═════════ */}
        <div className="flex flex-col gap-10">
          <GroupTitle>Overlays</GroupTitle>
          <Section id="dialogs" title="Dialogs & sheets" file="components/ui/Dialog.tsx · chat/AttachSheet.tsx · rx/ReviewIssueDialog.tsx" use="Modal on desktop, sheet from the bottom on phones. Never a custom modal.">
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/styleguide?invite=1" scroll={false} variant="secondary">Invite form (real InviteDialog)</ButtonLink>
              <Button variant="secondary" onClick={() => setModal(true)}>Plain modal</Button>
              <Button variant="secondary" onClick={() => setSheet(true)}>Bottom sheet</Button>
              <Button variant="secondary" onClick={() => setAttach(true)}>AttachSheet</Button>
              <Button variant="secondary" onClick={() => setReview(true)}>ReviewIssueDialog (with table)</Button>
            </div>
            <AttachSheet open={attach} onClose={() => setAttach(false)} recipientName="Dr. Sharma" onSend={() => setAttach(false)} />
            <ReviewIssueDialog
              open={review}
              onClose={() => setReview(false)}
              patient={demo.patient}
              items={[medicine, demo.prescription.prescription_items![1]]}
              advice="Drink plenty of water. Come back if the fever lasts more than 3 days."
              onIssue={() => setReview(false)}
            />
            <Dialog
              open={modal}
              onClose={() => setModal(false)}
              title="Delete this draft?"
              description="The patient never saw it. This can't be undone."
              footer={
                <>
                  <Button variant="secondary" onClick={() => setModal(false)}>Keep draft</Button>
                  <Button variant="danger" onClick={() => setModal(false)}>Delete draft</Button>
                </>
              }
            >
              <p className="text-[15px] text-ink-2">Paracetamol 650 mg, ORS</p>
            </Dialog>
            {/* The real invite form: opened by ?invite=1 like in the app; sending is faked. */}
            <Suspense fallback={null}>
              <InviteDialog inviteAction={demoInvite} createLinkAction={demoCreateLink} />
            </Suspense>
            <Dialog open={sheet} onClose={() => setSheet(false)} variant="sheet" title="Send to Dr. Sharma" description="PDF, JPG or PNG.">
              <Button variant="secondary" size="lg" block onClick={() => setSheet(false)}>
                <Camera className="size-5" aria-hidden="true" /> Take a photo
              </Button>
              <Button variant="ghost" block onClick={() => setSheet(false)}>Cancel</Button>
            </Dialog>
          </Section>
        </div>

        {/* ═════════ NAVIGATION ═════════ */}
        <div className="flex flex-col gap-10">
          <GroupTitle>Navigation</GroupTitle>
          <Section id="nav" title="Tab bar & sidebar" file="layout/TabBar.tsx · PatientTabBar.tsx · DoctorSidebar.tsx" use="One TabBar for both apps; items differ. The doctor sidebar shows at ≥1024px.">
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="flex flex-col gap-4">
                <Spec label="Patient tabs">
                  <Frame className="h-28">
                    <TabBar
                      currentPath="/home"
                      items={[
                        { href: "/home", label: "Home", Icon: House },
                        { href: "/prescriptions", label: "Prescriptions", Icon: FileText },
                        { href: "/profile", label: "Profile", Icon: UserRound },
                      ]}
                    />
                  </Frame>
                </Spec>
                <Spec label="Doctor phone tabs (with unread)">
                  <Frame className="h-28">
                    <TabBar
                      currentPath="/doctor"
                      items={[
                        { href: "/doctor", label: "Inbox", Icon: Inbox, exact: true, badge: 3 },
                        { href: "/doctor/patients", label: "Patients", Icon: Users },
                        { href: "/doctor/patients?invite=1", label: "Invite patient", shortLabel: "Invite", Icon: UserPlus },
                        { href: "/doctor/settings", label: "Settings", Icon: Settings },
                      ]}
                    />
                  </Frame>
                </Spec>
              </div>
              <Spec label="Doctor sidebar (desktop)">
                <Frame className="flex h-[460px] resize-y overflow-auto p-3">
                  <DoctorSidebar name="Dr. Sharma" unread={3} signOutAction={noop} />
                </Frame>
              </Spec>
            </div>
          </Section>

          <Section id="header" title="Page header" file="components/layout/PageHeader.tsx">
            <div className="flex flex-col gap-3">
              <PageHeader backHref="#header" leading={<Avatar name="Dr. Sharma" doctor />} title="Dr. Sharma" subtitle="General Physician" actions={<IconButton label="Search" icon={<Search className="size-5" />} />} />
              <PageHeader backHref="#header" backLabel="Back to home" title="Profile" />
            </div>
          </Section>
        </div>

        {/* ═════════ CHAT ═════════ */}
        <div className="flex flex-col gap-10">
          <GroupTitle>Chat</GroupTitle>

          <Section id="bubbles" title="Bubbles & dividers" file="chat/MessageBubble.tsx" use="mine = right, mint. Theirs = left, white glass. Status under the last of mine.">
            <div className="flex w-full max-w-md flex-col gap-3">
              <ChatDivider>Today</ChatDivider>
              <MessageBubble mine createdAt={now} status="Seen">
                Good morning, doctor. I&apos;ve been having a headache since yesterday.
              </MessageBubble>
              <MessageBubble mine={false} createdAt={now}>
                Please share your recent reports.
              </MessageBubble>
              <ChatDivider tone="new">2 new messages</ChatDivider>
              <MessageBubble mine createdAt={now} tone="pending" status="Waiting to send">
                Okay doctor.
              </MessageBubble>
              <MessageBubble mine createdAt={now} tone="failed" status="Not sent">
                Sending this one failed.
              </MessageBubble>
            </div>
          </Section>

          <Section id="files" title="File cards" file="chat/FileCard.tsx">
            <div className="grid gap-5 sm:grid-cols-2">
              <Variant name="PDF, shows size" className="w-full"><FileCard name="Blood_Report.pdf" size={2516582} type="application/pdf" /></Variant>
              <Variant name="Photo, opens the viewer" code="href" className="w-full"><FileCard name="Rash_photo.jpg" size={812000} type="image/jpeg" href="#files" /></Variant>
              <Variant name="Shows when it was sent" code="meta" className="w-full"><FileCard name="Scan.heic" size={3100000} type="image/heic" meta="Today, 10:16 AM" /></Variant>
              <Variant name="With a button" code="action" className="w-full"><FileCard name="Notes.docx" size={42000} type="application/msword" action={<Button size="sm" variant="outline">Open</Button>} /></Variant>
            </div>
            <div className="flex gap-6">
              <Variant name="PDF" code="FileTypeTile"><FileTypeTile type="application/pdf" /></Variant>
              <Variant name="Image"><FileTypeTile type="image/png" /></Variant>
              <Variant name="Unknown"><FileTypeTile type={null} /></Variant>
            </div>
          </Section>

          <Section id="messages" title="Message rows" file="chat/MessageItem.tsx" use="Picks text bubble, file card or prescription card from message.kind.">
            <div className="flex w-full max-w-md flex-col gap-3">
              <MessageItem message={demo.fileMessage} mine status="Seen" fileHref="#messages" />
              <MessageItem message={{ ...demo.fileMessage, id: "demo-removed", file_path: null, file_name: null, body: null, deleted_at: demo.NOW }} mine={false} />
              <MessageItem message={demo.imageMessage} mine={false} fileHref="#messages" />
              <MessageItem
                message={{ ...demo.fileMessage, id: "demo-failed", file_path: null, body: "Okay doctor.", kind: "text" }}
                mine
                tone="failed"
                status="Not sent"
                actions={
                  <>
                    <Button size="sm" variant="soft">Try again</Button>
                    <Button size="sm" variant="ghost">Remove</Button>
                  </>
                }
              />
            </div>
          </Section>

          <Section id="composer" title="Composer" file="chat/Composer.tsx" use="Enter sends on desktop, adds a new line on phones.">
            <div className="flex max-w-md flex-col gap-3">
              <Composer value={draft} onChange={setDraft} onSend={() => setDraft("")} onAttach={() => setAttach(true)} />
              <Composer value="" onChange={() => {}} onSend={() => {}} offline placeholder="Message Dr. Sharma" />
            </div>
          </Section>

          <Section id="viewer" title="File viewer" file="chat/FileViewer.tsx" use="Opens a report from the chat. Preview, download, and for the doctor: reply and remove. Here the file links and removal are faked.">
            <div className="grid gap-4 lg:grid-cols-3">
              <Variant name="Image preview" className="w-full">
                <FileViewer className="h-[460px] w-full resize-y overflow-auto" message={{ ...demo.imageMessage, file_name: "Rash_photo.png", file_path: "demo/rash.png", file_type: "image/png" }} backHref="#viewer" replyHref="#viewer" onRemove={demoRemove} getUrl={demoFileUrl} />
              </Variant>
              <Variant name="Couldn't load" className="w-full">
                <FileViewer className="h-[460px] w-full resize-y overflow-auto" message={demo.fileMessage} backHref="#viewer" getUrl={demoFileUrl} />
              </Variant>
              <Variant name="Can't preview this type" className="w-full">
                <FileViewer className="h-[460px] w-full resize-y overflow-auto" message={{ ...demo.fileMessage, file_name: "Notes.docx", file_type: "application/msword" }} backHref="#viewer" getUrl={demoFileUrl} />
              </Variant>
            </div>
          </Section>
        </div>

        {/* ═════════ PRESCRIPTIONS ═════════ */}
        <div className="flex flex-col gap-10">
          <GroupTitle>Prescriptions</GroupTitle>

          <Section id="rxcards" title="Prescription cards" file="rx/PrescriptionCard.tsx" issues={["indic"]}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Variant name="In the doctor's chat: issued" code="actions (2)" className="w-full">
                <PrescriptionCard
                  issuedAt={now}
                  medicines={["Dolo 650"]}
                  actions={
                    <>
                      <ButtonLink href="#rxcards" variant="outline">View prescription</ButtonLink>
                      <ButtonLink href="#rxcards" variant="soft">Issue a correction</ButtonLink>
                    </>
                  }
                />
              </Variant>
              <Variant name="Patient's list: newest" code="latest" className="w-full">
                <PrescriptionCard issuedAt={now} medicines={["Paracetamol 650 mg", "Vitamin D3 60K"]} latest actions={<ButtonLink href="#rxcards" variant="outline">View prescription</ButtonLink>} />
              </Variant>
              <Variant name="Replaced by a correction" code="replaced" className="w-full">
                <PrescriptionCard issuedAt={now} medicines={["Paracetamol 650 mg"]} replaced />
              </Variant>
              <Variant name="Doctor's draft, not sent" code="draft" className="w-full">
                <PrescriptionCard draft medicines={["Paracetamol 650 mg", "ORS"]} actions={<Button variant="outline" size="sm">Continue draft</Button>} />
              </Variant>
            </div>
          </Section>

          <Section id="dose" title="Dose schedule" file="rx/DoseSchedule.tsx">
            <Card tone="solid" className="flex max-w-md flex-col gap-3 p-4">
              <DoseSchedule frequency="1-0-1" />
              <DoseSchedule frequency="1-1-1" />
              <DoseSchedule frequency="Once a week" />
            </Card>
          </Section>

          <Section id="medicine" title="Medicine row" file="rx/MedicineFields.tsx" use="One row inside the prescription composer.">
            <div className="max-w-2xl">
              <MedicineFields index={1} item={medicine} onChange={setMedicine} onRemove={() => {}} />
            </div>
          </Section>

          <Section id="rxview" title="Full prescription" file="rx/PrescriptionView.tsx" use="Patient detail, doctor View, and the print page (variant=&quot;print&quot;).">
            <div className="max-w-2xl">
              <PrescriptionView prescription={demo.prescription} actions={<Button variant="outline" block>Download PDF</Button>} />
            </div>
          </Section>

          <Section id="print" title="Print / PDF" file="rx/PrescriptionView.tsx · variant=&quot;print&quot; · /rx/[id]/print" use="Plain paper version the browser saves as a PDF. Doctor's registration number shows [REG NO] until it's set.">
            <div className="max-w-2xl rounded-tile border border-line bg-white p-6">
              <PrescriptionView prescription={demo.prescription} variant="print" />
            </div>
          </Section>
        </div>

        {/* ═════════ DOCTOR ═════════ */}
        <div className="flex flex-col gap-10">
          <GroupTitle>Doctor</GroupTitle>

          <Section id="inbox" title="Conversation list" file="doctor/ConversationList.tsx" use="Search, All/Unread, pending invites with a dashed avatar.">
            <Stage size="panel" height="tall">
              <ConversationList rows={demo.inbox} live={false} />
            </Stage>
          </Section>

          <Section id="panel" title="Patient panel" file="doctor/PatientPanel.tsx" use="Right column next to the doctor's chat.">
            <Stage size="panel" height="tall">
              <PatientPanel conversationId="demo" patient={demo.patient} prescriptions={[demo.prescription]} replacedRxIds={[]} reports={[demo.fileMessage, demo.imageMessage]} />
            </Stage>
          </Section>

          <Section id="table" title="Patients table" file="doctor/PatientsTable.tsx" use="The app's only data table. Scrolls sideways on phones.">
            <Stage size="full" height="tall">
              <PatientsTable rows={demo.patientRows} onResend={demoResend} />
            </Stage>
          </Section>

          <Section id="releases" title="Release notes" file="doctor/ReleaseNotes.tsx · lib/releases.ts">
            <div className="max-w-2xl">
              <ReleaseNotes releases={RELEASES.slice(0, 2)} />
            </div>
          </Section>
        </div>

        {/* ═════════ ACCOUNT ═════════ */}
        <div className="flex flex-col gap-10">
          <GroupTitle>Account</GroupTitle>
          <Section id="signin" title="Sign in & password" file="app/login/LoginForm.tsx · app/set-password/SetPasswordForm.tsx" use="Submitting here never signs in or saves. It shows the error state instead.">
            <div className="grid gap-4 md:grid-cols-2">
              <Variant name="Sign in (submit to see the error)" className="w-full">
                <div className="w-full [&>*]:mt-0">
                  <LoginForm loginAction={demoLogin} />
                </div>
              </Variant>
              <Variant name="Invite link expired" code="linkError" className="w-full">
                <div className="w-full [&>*]:mt-0">
                  <LoginForm linkError loginAction={demoLogin} />
                </div>
              </Variant>
              <Variant name="Join from a shared link (submit to see the error)" className="w-full">
                <div className="w-full [&>*]:mt-0">
                  <JoinForm token="demo" doctorName="Dr. Vipin John" specialty="General Medicine" joinAction={demoJoin} />
                </div>
              </Variant>
              <Variant name="Choose a password (after the invite link)" className="w-full">
                <div className="w-full [&>*]:mt-0">
                  <SetPasswordForm email="ravi@example.com" saveAction={demoSetPassword} />
                </div>
              </Variant>
            </div>
          </Section>

          <Section id="notifications" title="Notifications" file="layout/NotificationToggle.tsx" use="Every state, pinned with preview. Buttons do nothing here: no permission prompt, nothing saved.">
            <div className="grid gap-4 md:grid-cols-2">
              {NOTIFICATION_STATES.map(([state, label, audience, err]) => (
                <Spec key={label} label={label}>
                  <NotificationToggle audience={audience} preview={state} previewError={err} />
                </Spec>
              ))}
            </div>
          </Section>
        </div>

        {/* ═════════ EDGE CASES ═════════ */}
        <div className="flex flex-col gap-10">
          <GroupTitle>Edge cases</GroupTitle>
          <Section id="edges" title="Long, empty, many" file="Same components, harder content" use="Long names must not break layouts. Empty lists must say what to do next. Big counts must stay readable.">
            <div className="grid gap-6 lg:grid-cols-2">
              <Variant name="Very long patient name" className="w-full">
                <div className="flex w-full flex-col gap-3">
                  <PageHeader backHref="#edges" leading={<Avatar name={LONG_NAME} />} title={LONG_NAME} subtitle={`${LONG_NAME.toLowerCase().replace(/ /g, ".")}@example.com`} />
                  <MessageBubble mine={false} createdAt={now}>
                    Hello doctor, this is {LONG_NAME}. My test results from Narayana Health are attached below.
                  </MessageBubble>
                </div>
              </Variant>
              <Variant name="Long name in the inbox, 99+ unread" className="w-full">
                <Stage size="panel" height="short">
                  <ConversationList
                    live={false}
                    rows={[{ ...demo.inbox[0], other_name: LONG_NAME, unread_count: 150, last_message_preview: "I've attached three reports and a photo of the rash on my left arm from this morning." }]}
                  />
                </Stage>
              </Variant>
              <Variant name="Inbox, no patients yet" className="w-full">
                <Stage size="panel" height="short">
                  <ConversationList live={false} rows={[]} />
                </Stage>
              </Variant>
              <Variant name="Patients table, empty" className="w-full">
                <Stage size="panel" height="short">
                  <PatientsTable rows={[]} onResend={demoResend} />
                </Stage>
              </Variant>
              <Variant name="Many medicines" className="w-full">
                <PrescriptionCard issuedAt={now} medicines={["Paracetamol 650 mg", "Vitamin D3 60K", "Pantoprazole 40 mg", "Cetirizine 10 mg", "ORS sachet", "Azithromycin 500 mg", "Multivitamin"]} />
              </Variant>
              <Variant name="Kannada name and message" className="w-full">
                <div className="flex w-full flex-col gap-3">
                  <PageHeader backHref="#edges" leading={<Avatar name="ರವಿ ಕುಮಾರ್" />} title="ರವಿ ಕುಮಾರ್" subtitle="ರೋಗಿ" />
                  <MessageBubble mine createdAt={now} status="Seen">
                    ನಮಸ್ಕಾರ ಡಾಕ್ಟರ್, ನಿನ್ನೆಯಿಂದ ತಲೆನೋವು ಇದೆ.
                  </MessageBubble>
                </div>
              </Variant>
            </div>
          </Section>
        </div>

        {/* ═════════ REVIEW ═════════ */}
        <div className="flex flex-col gap-10 pb-16">
          <GroupTitle>Review</GroupTitle>
          <Section id="coverage" title="Coverage" file="src/components/** · page-local forms" use="Everything shared, and where to see it. Two live pieces can only be reviewed in the running app.">
            <Card tone="solid" className="overflow-x-auto p-0">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-[13px] text-ink-label">
                  <tr className="border-b border-line-soft">
                    <th scope="col" className="px-4 py-2.5 font-semibold">Component</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Where</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {COVERAGE.map(([name, where, status]) => (
                    <tr key={name} className="border-b border-line-soft last:border-0">
                      <td className="px-4 py-2.5">{name}</td>
                      <td className="px-4 py-2.5">{where.startsWith("#") ? <a href={where}>{SECTION_TITLES[where.slice(1)] ?? "On this page"}</a> : <code className="text-[13px] text-ink-2">{where}</code>}</td>
                      <td className="px-4 py-2.5">
                        {status === "shown" ? (
                          <Badge tone="brand" icon={<Check />}>Shown</Badge>
                        ) : (
                          <Badge tone="neutral" icon={<Info />}>In the app</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>

          <Section
            id="review"
            title="Merge & fix list"
            file="Found while building this page"
            use={"Each item shows the candidates side by side. Merge: two things that should be one. Fix: breaks a rule. Check: needs your decision. Ordered Fix, Merge, Check. None of these are changed yet (as of version " + APP_VERSION + ")."}
          >
            <ol className="flex flex-col gap-4">
              {DECISIONS.map((r) => (
                <li key={r.id} id={`review-${r.id}`} className="scroll-mt-6">
                  <Card tone="solid" className="flex flex-col gap-4 p-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={r.kind === "Fix" ? "warning" : r.kind === "Merge" ? "brand" : "neutral"}>{r.kind}</Badge>
                        <h4 className="text-[17px] font-semibold">{r.title}</h4>
                      </div>
                      <p className="text-[15px] leading-relaxed text-ink-2">{r.detail}</p>
                      <p className="text-[13px] text-ink-2">
                        Seen in:{" "}
                        {r.sections.map(([id, title], i) => (
                          <span key={id}>
                            {i > 0 ? ", " : null}
                            <a href={`#${id}`}>{title}</a>
                          </span>
                        ))}
                      </p>
                    </div>
                    <div className="rounded-tile bg-ground p-4">{r.compare}</div>
                  </Card>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </main>

      {wouldOpen ? (
        <div className="fixed top-5 left-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2">
          <Banner tone="info">Example only. In the app this would open {wouldOpen}</Banner>
        </div>
      ) : null}

      {scrolled && !framed ? (
        <a
          href="#top"
          className="glass fixed bottom-5 left-1/2 z-30 inline-flex h-11 -translate-x-1/2 items-center gap-2 rounded-full px-4 text-sm font-semibold text-forest no-underline shadow-float hover:text-forest lg:left-[calc(14rem+3rem)] lg:translate-x-0"
        >
          <ArrowUp aria-hidden="true" className="size-4" />
          Back to top
        </a>
      ) : null}

      {phone && !framed ? (
        <aside aria-label="Phone preview" className="glass-strong fixed top-3 right-3 bottom-3 z-40 hidden w-[430px] flex-col gap-2 rounded-card p-3 shadow-modal lg:flex">
          <div className="flex items-center justify-between px-2">
            <span className="text-[13px] font-semibold text-ink-label">Phone · {PHONE}px · follows where you are</span>
            <IconButton label="Close phone preview" icon={<X className="size-5" />} onClick={() => setPhone(false)} />
          </div>
          <iframe
            ref={iframe}
            title="This page at phone width"
            src="/styleguide?frame=1"
            onLoad={() => iframe.current?.contentWindow?.postMessage({ scrollTo: active }, window.location.origin)}
            className="mx-auto min-h-0 flex-1 rounded-tile border border-line bg-ground"
            style={{ width: PHONE }}
          />
        </aside>
      ) : null}
    </div>
  );
}
