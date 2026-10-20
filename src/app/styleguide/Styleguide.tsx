"use client";

import { useState, type ReactNode } from "react";
import { Camera, Clock, Download, FileText, Lock, Paperclip, Plus, Send, TriangleAlert } from "lucide-react";
import type { DraftItem, Message, Profile } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, CountBadge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Dialog } from "@/components/ui/Dialog";
import { Banner, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { Field, InputAddon, TextArea, TextInput } from "@/components/ui/Field";
import { Logo } from "@/components/ui/Logo";
import { Segmented } from "@/components/ui/Segmented";
import { ChatDivider, MessageBubble } from "@/components/chat/MessageBubble";
import { FileCard } from "@/components/chat/FileCard";
import { PrescriptionCard } from "@/components/rx/PrescriptionCard";
import { DoseSchedule } from "@/components/rx/DoseSchedule";
import { PageHeader } from "@/components/layout/PageHeader";
import { MessageItem } from "@/components/chat/MessageItem";
import { Composer } from "@/components/chat/Composer";
import { AttachSheet } from "@/components/chat/AttachSheet";
import { MedicineFields } from "@/components/rx/MedicineFields";
import { ReviewIssueDialog } from "@/components/rx/ReviewIssueDialog";
import { DURATION_OPTIONS, FREQUENCY_OPTIONS, LANGUAGES } from "@/lib/constants";

function Section({ title, file, children }: { title: string; file: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <code className="text-xs text-ink-2">{file}</code>
      </div>
      {children}
    </section>
  );
}

export function Styleguide() {
  const now = "2026-10-12T04:50:00.000Z"; // fixed so server and browser render the same
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [lang, setLang] = useState<string>("en");
  const [freq, setFreq] = useState<string | null>(null);
  const [dur, setDur] = useState<string | null>("3 days");
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [attach, setAttach] = useState(false);
  const [review, setReview] = useState(false);
  const [draft, setDraft] = useState("I'll send the report tonight.");
  const [medicine, setMedicine] = useState<DraftItem>({ medicine: "Paracetamol 650 mg", dose: "1 tablet", frequency: "1-0-1", duration: "3 days", timing: "After food" });

  const patient: Profile = {
    id: "demo-patient",
    role: "patient",
    full_name: "Ravi Kumar",
    email: "ravi@example.com",
    phone: null,
    specialty: null,
    reg_no: null,
    language: "en",
    status: "active",
    invited_by: null,
    activated_at: now,
    created_at: now,
  };
  const fileMessage: Message = {
    id: "demo-file",
    conversation_id: "demo",
    sender_id: "me",
    kind: "file",
    body: "Blood test from Friday",
    file_path: "demo/Blood_Report.pdf",
    file_name: "Blood_Report.pdf",
    file_size: 2516582,
    file_type: "application/pdf",
    prescription_id: null,
    read_at: null,
    created_at: now,
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-5 py-10">
      <header className="flex flex-col gap-2">
        <Logo />
        <h1 className="text-3xl font-semibold tracking-tight">Component styleguide</h1>
        <p className="text-ink-2">Reuse these. Don&apos;t rebuild them. Tokens live in src/app/globals.css.</p>
      </header>

      <Section title="Buttons" file="components/ui/Button.tsx">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="soft">
            <Plus className="size-4" aria-hidden="true" /> Soft
          </Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Sign out</Button>
          <Button loading>Saving</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <IconButton label="Attach" tone="soft" icon={<Paperclip className="size-5" />} />
          <IconButton label="Send" tone="primary" icon={<Send className="size-5" />} />
          <IconButton label="Download" tone="glass" icon={<Download className="size-5" />} />
        </div>
      </Section>

      <Section title="Cards" file="components/ui/Card.tsx">
        <div className="grid gap-4 sm:grid-cols-4">
          {(["glass", "subtle", "strong", "solid"] as const).map((t) => (
            <Card key={t} tone={t} className="p-5 text-sm font-medium">
              tone=&quot;{t}&quot;
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Form fields" file="components/ui/Field.tsx">
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <Field id="sg-name" label="Patient's full name">
            <TextInput id="sg-name" placeholder="e.g. Ravi Kumar" />
          </Field>
          <Field id="sg-email" label="Email" error="Enter a valid email address.">
            <div className="flex gap-2">
              <InputAddon>@</InputAddon>
              <TextInput id="sg-email" invalid defaultValue="ravi@" />
            </div>
          </Field>
          <Field id="sg-note" label="Add a note" optional hint="Shown to the doctor with the file." className="sm:col-span-2">
            <TextArea id="sg-note" rows={2} placeholder="e.g. Blood test from Friday" />
          </Field>
        </Card>
      </Section>

      <Section title="Segmented & chips" file="components/ui/Segmented.tsx · ChipGroup.tsx">
        <Card className="flex flex-col gap-5 p-5">
          <Segmented label="Filter" value={tab} onChange={setTab} options={[{ value: "all", label: "All patients" }, { value: "unread", label: "Unread · 2" }]} className="max-w-sm" />
          <Segmented label="Language" value={lang} onChange={setLang} options={LANGUAGES.map((l) => ({ value: l.value, label: l.label }))} className="max-w-sm" />
          <ChipGroup label="Frequency (nothing pre-selected)" options={FREQUENCY_OPTIONS} value={freq} onChange={setFreq} />
          <ChipGroup label="Duration" options={DURATION_OPTIONS} value={dur} onChange={setDur} />
        </Card>
      </Section>

      <Section title="Avatars & badges" file="components/ui/Avatar.tsx · Badge.tsx">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name="Dr. Sharma" doctor />
          <Avatar name="Ravi Kumar" />
          <Avatar name="Priya Mehta" />
          <Avatar name="Amit Patel" />
          <Avatar name="Kavya Nair" pending />
          <Badge tone="brand" icon={<Lock />}>Issued</Badge>
          <Badge tone="outline">Draft · not sent</Badge>
          <Badge tone="neutral" icon={<Clock />}>Invite pending</Badge>
          <Badge tone="danger" icon={<TriangleAlert />}>Email not delivered</Badge>
          <Badge tone="solid">Latest</Badge>
          <CountBadge count={2} />
        </div>
      </Section>

      <Section title="Chat" file="components/chat/* · components/layout/PageHeader.tsx">
        <Card tone="subtle" className="flex max-w-md flex-col gap-3 p-4">
          <PageHeader backHref="#" leading={<Avatar name="Dr. Sharma" doctor />} title="Dr. Sharma" subtitle="General Physician" />
          <ChatDivider>Today</ChatDivider>
          <MessageBubble mine createdAt={now} status="Seen">
            Good morning, doctor. I&apos;ve been having a headache since yesterday.
          </MessageBubble>
          <MessageBubble mine={false} createdAt={now}>
            Please share your recent reports.
          </MessageBubble>
          <MessageBubble mine createdAt={now} bare>
            <FileCard name="Blood_Report.pdf" size={2516582} type="application/pdf" />
          </MessageBubble>
          <ChatDivider tone="new">2 new messages</ChatDivider>
          <MessageBubble mine={false} createdAt={now} bare>
            <PrescriptionCard
              issuedAt={now}
              medicines={["Paracetamol 650 mg", "Vitamin D3 60K"]}
              actions={<Button variant="secondary" size="sm">View prescription</Button>}
            />
          </MessageBubble>
          <MessageBubble mine createdAt={now} tone="pending" status="Waiting to send">
            Okay doctor.
          </MessageBubble>
        </Card>
      </Section>

      <Section title="Prescription cards" file="components/rx/PrescriptionCard.tsx">
        <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
          <PrescriptionCard issuedAt={now} medicines={["Paracetamol 650 mg"]} latest />
          <PrescriptionCard issuedAt={now} medicines={["Paracetamol 650 mg"]} replaced />
          <PrescriptionCard draft medicines={["Paracetamol 650 mg", "ORS"]} actions={<Button variant="secondary" size="sm">Continue draft</Button>} />
          <PrescriptionCard issuedAt={now} medicines={["Azithromycin 500 mg"]} actions={<Button variant="soft" size="sm">Issue a correction</Button>} />
        </div>
      </Section>

      <Section title="Prescription" file="components/rx/DoseSchedule.tsx">
        <Card tone="solid" className="flex max-w-sm flex-col gap-3 p-4">
          <span className="text-lg font-semibold">Paracetamol 650 mg</span>
          <span>1 tablet · after food</span>
          <DoseSchedule frequency="1-0-1" />
          <DoseSchedule frequency="Once a week" />
        </Card>
      </Section>

      <Section title="Feedback" file="components/ui/Feedback.tsx">
        <div className="flex max-w-xl flex-col gap-3">
          <Banner tone="success">Prescription issued. Ravi can see it in chat and under Prescriptions.</Banner>
          <Banner tone="offline">You&apos;re offline. Messages will send when you&apos;re back online.</Banner>
          <Banner tone="danger">Not sent. Check your internet and try again.</Banner>
          <Banner tone="info">Draft · saved 10:19 AM · not visible to the patient</Banner>
          <Skeleton className="h-16" />
        </div>
        <Card>
          <EmptyState icon={FileText} title="No prescriptions yet" action={<Button>Go to chat</Button>}>
            When Dr. Sharma sends one, it will appear here and in your chat.
          </EmptyState>
        </Card>
      </Section>

      <Section title="Navigation" file="components/layout/TabBar.tsx · PatientTabBar.tsx · DoctorSidebar.tsx">
        <p className="text-sm text-ink-2">
          <code>TabBar</code> is the one floating bottom bar; the patient tabs and the doctor&apos;s phone nav are the same component
          with different items. It is fixed to the viewport, so it is shown in the app rather than inline here.
        </p>
      </Section>

      <Section title="Message rows & composer" file="components/chat/MessageItem.tsx · Composer.tsx">
        <Card tone="subtle" className="flex max-w-md flex-col gap-3 p-4">
          <MessageItem message={fileMessage} mine status="Seen" fileHref="#" />
          <MessageItem
            message={{ ...fileMessage, id: "demo-failed", file_path: null, body: "Okay doctor." , kind: "text" }}
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
          <Composer value={draft} onChange={setDraft} onSend={() => setDraft("")} onAttach={() => setAttach(true)} />
          <Composer value="" onChange={() => {}} onSend={() => {}} offline placeholder="Message Dr. Sharma" />
        </Card>
        <p className="text-sm text-ink-2">
          <code>Conversation</code>, <code>FileViewer</code>, <code>ConversationList</code>, <code>PatientPanel</code>,{" "}
          <code>PrescriptionComposer</code>, <code>PrescriptionView</code> and <code>PatientsTable</code> need live data, so they
          are shown in the app rather than here.
        </p>
      </Section>

      <Section title="Medicine row" file="components/rx/MedicineFields.tsx">
        <div className="max-w-xl">
          <MedicineFields index={1} item={medicine} onChange={setMedicine} onRemove={() => {}} />
        </div>
      </Section>

      <Section title="Dialogs" file="components/ui/Dialog.tsx · AttachSheet.tsx · ReviewIssueDialog.tsx">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setModal(true)}>Open modal</Button>
          <Button variant="secondary" onClick={() => setSheet(true)}>Open sheet</Button>
          <Button variant="secondary" onClick={() => setAttach(true)}>Open AttachSheet</Button>
          <Button variant="secondary" onClick={() => setReview(true)}>Open ReviewIssueDialog</Button>
        </div>
        <AttachSheet open={attach} onClose={() => setAttach(false)} recipientName="Dr. Sharma" onSend={() => setAttach(false)} />
        <ReviewIssueDialog
          open={review}
          onClose={() => setReview(false)}
          patient={patient}
          items={[medicine]}
          advice="Drink plenty of water. Come back if the fever lasts more than 3 days."
          onIssue={() => setReview(false)}
        />
        <Dialog
          open={modal}
          onClose={() => setModal(false)}
          title="Invite a patient"
          description="They'll get an email with a link to join."
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
              <Button onClick={() => setModal(false)}>Send invitation</Button>
            </>
          }
        >
          <Field id="sg-invite" label="Patient's email">
            <TextInput id="sg-invite" type="email" />
          </Field>
        </Dialog>
        <Dialog open={sheet} onClose={() => setSheet(false)} variant="sheet" title="Send to Dr. Sharma" description="PDF, JPG or PNG.">
          <Button variant="secondary" size="lg" block onClick={() => setSheet(false)}>
            <Camera className="size-5" aria-hidden="true" /> Take a photo
          </Button>
          <Button variant="ghost" block onClick={() => setSheet(false)}>Cancel</Button>
        </Dialog>
      </Section>
    </main>
  );
}
