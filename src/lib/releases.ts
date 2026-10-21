/**
 * Release notes shown in the doctor's Settings. Newest first.
 * The first entry IS the app version: when you ship, add an entry here and bump
 * "version" in package.json to match (semver: new features → minor, fixes → patch).
 */
export type Release = {
  version: string;
  /** YYYY-MM-DD. Shown via formatDate, never parsed by hand. */
  date: string;
  title: string;
  added?: string[];
  changed?: string[];
  fixed?: string[];
};

export const RELEASES: Release[] = [
  {
    version: "0.5.0",
    date: "2026-10-21",
    title: "Invite links and removing reports",
    added: [
      "Invite a patient with a link: create it, then copy it or share it on WhatsApp. It works once and lasts 7 days.",
      "Patients join from the link with their name, email or mobile number, and a password. No email code needed.",
      "Patients can sign in with their mobile number as well as their email.",
      "The doctor can remove a report. The chat shows “Report removed by the doctor”.",
    ],
  },
  {
    version: "0.4.1",
    date: "2026-10-20",
    title: "Easier to read and tap",
    changed: [
      "File names and medicine names are larger for patients.",
      "Small buttons and quick-pick chips are a little taller, so they're easier to tap.",
      "Corners, icon squares and error screens look the same everywhere.",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-10-20",
    title: "Notifications",
    added: [
      "Notifications on your phone or computer when a new message, file or prescription arrives.",
      "Turn them on or off in Profile (patients) or Settings (doctor), separately for each device.",
      "Alerts name who sent something, never what it says, so nothing private shows on a lock screen.",
    ],
    changed: ["Signing out turns off notifications on that device."],
  },
  {
    version: "0.3.1",
    date: "2026-10-20",
    title: "Icons and link previews",
    added: [
      "Home-screen icon: patients can add CareConnect to their phone like an app.",
      "A branded preview card when the website link is shared in WhatsApp or email.",
    ],
    changed: ["Clearer browser tab title and description."],
  },
  {
    version: "0.3.0",
    date: "2026-10-20",
    title: "Version and release notes",
    added: [
      "Settings page for the doctor with account details, the current version and these release notes.",
      "App version shown at the bottom of the patient's Profile.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-10-20",
    title: "Full MVP for review",
    added: [
      "Chat between doctor and patient with live updates, Seen, day dividers, search and an offline queue.",
      "Reports: patients send photos and PDFs; the doctor opens them in a viewer with Download.",
      "Prescriptions: drafts with autosave, review and issue, inline cards in chat, dose schedule and a print/PDF page.",
      "Corrections: an issued prescription is locked; a new version replaces it and both stay on record.",
      "Patient panel next to the chat with the patient's reports and prescriptions.",
      "Patients page with invite status, Resend invite and Open chat.",
      "Patient Profile with language choice (English, ಕನ್ನಡ, हिन्दी — translations to follow).",
      "Choose a password after opening the invite email.",
    ],
    changed: ["Sign-in is now email and password for everyone, instead of a code sent by email."],
  },
  {
    version: "0.1.0",
    date: "2026-10-20",
    title: "Foundation",
    added: [
      "Secure database with per-patient access rules, private file storage and live updates.",
      "Invite-only accounts: patients join only when the doctor invites them.",
      "CareConnect design system: glass surfaces, colours, buttons, fields and navigation.",
    ],
  },
];

export const APP_VERSION = RELEASES[0].version;
