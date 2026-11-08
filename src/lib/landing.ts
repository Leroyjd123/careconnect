/**
 * The landing page's images (decision 65, changed 2026-11-08).
 *
 * Leroy supplies the real images later. Until then every `src` is null and the page
 * draws a placeholder box at the same size, so nothing shifts when the real file
 * arrives. Drop the files into `public/landing/` and fill in the `src` here: the
 * page needs no other change.
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
  /** The hero: the patient's chat with their doctor. */
  "hero-chat": {
    src: null,
    alt: "A patient messaging their doctor in the CareConnect app.",
    width: 720,
    height: 1320,
  },
  /** "Your patients can": the patient's home screen. */
  "patient-home": {
    src: null,
    alt: "The patient's home screen in CareConnect, with one card per doctor.",
    width: 720,
    height: 1320,
  },
  /** Feature tile: chat. */
  "feature-chat": {
    src: null,
    alt: "A chat between a patient and their doctor.",
    width: 640,
    height: 480,
  },
  /** Feature tile: reports. */
  "feature-reports": {
    src: null,
    alt: "A patient sending a report to their doctor.",
    width: 640,
    height: 480,
  },
  /** Feature tile: prescriptions. */
  "feature-prescriptions": {
    src: null,
    alt: "A prescription the doctor issued, in the app.",
    width: 640,
    height: 480,
  },
  /** Feature tile: video meetings. */
  "feature-meetings": {
    src: null,
    alt: "A video meeting card in the chat.",
    width: 640,
    height: 480,
  },
  /** Feature tile: languages. */
  "feature-languages": {
    src: null,
    alt: "The language choice in the patient's profile.",
    width: 640,
    height: 480,
  },
  /** Feature tile: privacy. */
  "feature-privacy": {
    src: null,
    alt: "A private report, open only to the patient and their doctor.",
    width: 640,
    height: 480,
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
