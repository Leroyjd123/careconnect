/**
 * The landing page's images (decision 65, changed 2026-11-08).
 *
 * The images are real app screenshots (Q-F/G), taken from the demo data, in
 * `public/landing/`. A slot whose `src` is null draws a placeholder box at the same size.
 *
 * Rules: no stock photos, no AI images, no external image URLs, no real patient data.
 */
export type LandingImage = {
  /** The file in `public/landing/`, e.g. "/landing/hero.png". null until Leroy supplies it. */
  src: string | null;
  /** What the picture shows, for screen readers. */
  alt: string;
  /** The natural size, so the browser can reserve the space and there is no layout shift. */
  width: number;
  height: number;
};

export const LANDING_IMAGES: Record<string, LandingImage> = {
  /** The showcase: the doctor's inbox, the chat and the patient panel, side by side. */
  "doctor-panel": {
    src: "/landing/doctor-panel.png",
    alt: "The doctor's CareConnect screen: the inbox, a chat with a patient, and that patient's panel with their next check-in and latest prescription.",
    width: 2160,
    height: 1350,
  },
  /** "Your practice": the doctor's patient list. */
  "doctor-patients": {
    src: "/landing/doctor-patients.png",
    alt: "The doctor's patient list, with each patient's status and a button to open their chat.",
    width: 1024,
    height: 768,
  },
  /** "Your patients": every prescription, from every doctor. */
  "patient-rx": {
    src: "/landing/patient-rx.png",
    alt: "The patient's prescriptions, from all their doctors, filtered by doctor.",
    width: 780,
    height: 1430,
  },
  /** The hero: the patient's chat with their doctor. */
  "hero-chat": {
    src: "/landing/hero-chat.png",
    alt: "A patient messaging their doctor in the CareConnect app.",
    width: 780,
    height: 1430,
  },
  /** "Your patients can": the patient's home screen. */
  "patient-home": {
    src: "/landing/patient-home.png",
    alt: "The patient's home screen in CareConnect, with one card per doctor.",
    width: 780,
    height: 1430,
  },
  /** Feature tile: chat. */
  "feature-chat": {
    src: "/landing/feature-chat.png",
    alt: "A chat between a patient and their doctor.",
    width: 1024,
    height: 768,
  },
  /** Feature tile: reports. */
  "feature-reports": {
    src: "/landing/feature-reports.png",
    alt: "A patient sending a report to their doctor.",
    width: 780,
    height: 584,
  },
  /** Feature tile: prescriptions. */
  "feature-prescriptions": {
    src: "/landing/feature-prescriptions.png",
    alt: "A prescription the doctor issued, in the app.",
    width: 780,
    height: 585,
  },
  /** Feature tile: video meetings. */
  "feature-meetings": {
    src: "/landing/feature-meetings.png",
    alt: "A video meeting card in the chat.",
    width: 1024,
    height: 768,
  },
  /** Feature tile: languages. */
  "feature-languages": {
    src: "/landing/feature-languages.png",
    alt: "The language choice in the patient's profile.",
    width: 780,
    height: 470,
  },
  /** Feature tile: privacy. */
  "feature-privacy": {
    src: "/landing/feature-privacy.png",
    alt: "A private report, open only to the patient and their doctor.",
    width: 480,
    height: 360,
  },
};

/** The words the rotating headline cycles through (decision 62). */
export const ROTATING_WORDS = ["reports", "prescriptions", "follow-ups", "video meetings"];

/** The chips in the "What you can handle" marquee. */
export const MARQUEE_CHIPS = [
  "Blood test reports",
  "Prescriptions",
  "Follow-up check-ins",
  "Video meetings",
  "Medicine reminders",
  "Photo reports",
  "Chat",
  "Kannada, Malayalam and English",
];

/** The "Your patients can" checklist. */
export const PATIENT_CAN = [
  "Message you any time, and read your replies",
  "Send a report or a photo of a report",
  "See the prescription you were given",
  "Download it as a PDF",
  "Join a video meeting you agreed on",
  "Know when to come back for a check-up",
];

/** The FAQ. Five to seven questions, plain answers. */
export const FAQ = [
  {
    q: "Who can use CareConnect?",
    a: "Doctors and clinics. Patients join through a link or an invitation from their doctor, so nobody signs up on their own.",
  },
  {
    q: "Does it cost anything?",
    a: "No charges. You get in touch, we set it up, and you can talk to your patients without any fees.",
  },
  {
    q: "Can my patients send me reports?",
    a: "Yes. A report is a photo or a PDF they send in the chat. Only you and that patient can open it.",
  },
  {
    q: "Can I give a patient a prescription?",
    a: "Yes. You write it in CareConnect and the patient sees it in their chat and under their prescriptions, and can download it as a PDF.",
  },
  {
    q: "Can we have video meetings?",
    a: "Yes. You paste the link from your meeting app and pick a time. Both of you get a card in the chat, with a reminder before it starts.",
  },
  {
    q: "What happens to my patients' data?",
    a: "Reports are private. Only the patient and their doctor can open them. Every time the CareConnect admin looks at a chat or a file, it is written down.",
  },
  {
    q: "Is this for local practices?",
    a: "Yes. CareConnect is built for doctors and clinics serving their own local patients, wherever they are.",
  },
];

/** "How it works": the three steps from first contact to the first prescription. */
export const STEPS = [
  {
    title: "Tell us about your practice",
    body: "Write to us. We set up your clinic and your account, and walk you through it.",
  },
  {
    title: "Invite your patients",
    body: "Send an invitation by email, or share one link with many patients. They set a password and they are in.",
  },
  {
    title: "Look after them from anywhere",
    body: "Reply to messages, open reports, write prescriptions and arrange video meetings, from your phone or your desk.",
  },
];

/** The facts band. Only things the app really does (no invented numbers). */
export const FACTS = [
  { value: "1", label: "private chat for each patient" },
  { value: "5 min", label: "for a file link, then it closes" },
  { value: "0", label: "charges for your practice" },
  { value: "24/7", label: "for your patients to write to you" },
];

/** "Built for the doctor": what the doctor's screen gives them. */
export const DOCTOR_GETS = [
  { label: "One inbox for every patient", detail: "Unread first, with a badge when a check-in is due." },
  { label: "The patient beside the chat", detail: "Their details, their next check-in and their latest prescription." },
  { label: "Prescriptions in a minute", detail: "Pick the medicine, the dose and how often. It saves as you type." },
  { label: "Corrections that keep the record", detail: "An issued prescription never changes. A correction is a new one." },
  { label: "Meetings and check-ins", detail: "Paste your meeting link and pick a time. Reminders go out on their own." },
  { label: "Your patient list", detail: "See who has joined, resend an invitation, or open a chat." },
];
