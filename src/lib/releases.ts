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
    version: "0.8.0",
    date: "2026-11-11",
    title: "The CareConnect admin panel",
    added: [
      "A new admin area at /admin, for whoever looks after your CareConnect setup.",
      "An overview with plain counts: doctors, patients, chats and meetings this week.",
      "See every doctor, their specialty, their clinic and how many patients they have. Invite a new doctor with a link or an email.",
      "Deactivate a doctor when you need to. Their patients can still read their history, but nobody can send anything in their chats.",
      "See every patient, the doctors they see, and search by name, mobile number or email.",
      "Give a patient more than one doctor. Nobody is ever moved away from a doctor they've already got.",
      "Block one chat, or block a whole account. Both ask you first.",
      "Clinics: group your doctors together and set what each clinic shows.",
      "See every chat on CareConnect, with the patient, the doctor and whether it is blocked.",
      "Open a chat as the admin and send a message. Both sides see it as “CareConnect Admin”.",
      "Fix a message that was wrong, or remove one. Both sides see that you did.",
      "Cancel a prescription that was issued by mistake. It stays on record, marked as cancelled.",
      "Write a correction on a doctor's behalf. The doctor sends it to the patient.",
      "An audit log: who changed what, and when, with filters for the person, the change and the date.",
      "Everything the admin changes is written to the audit log.",
    ],
    changed: ["The side menu is now the same for doctors and for the admin, with different links."],
  },
  {
    version: "0.7.0",
    date: "2026-11-07",
    title: "More doctors, one shared medicine list",
    added: [
      "CareConnect now works for several doctors, each with their own patients.",
      "Already with another doctor on CareConnect? Open the new doctor's link and sign in to accept. You get a separate chat with them.",
      "Malayalam is now a language choice, alongside English and Kannada. Hindi is no longer offered; anyone who chose it is set to English.",
      "With more than one doctor, your home shows a card for each of them, and /chat lists them so you can open the right chat.",
      "Your prescriptions say which doctor issued each one, and you can filter the list by doctor.",
      "You can update your own date of birth, height and weight in Profile. Your doctor sees the same details.",
      "Schedule a video meeting: paste the link from your meeting app, pick a time and a length, and the patient sees the card in the chat.",
      "Set a check-in to remind a patient to come back on a date, with a reason.",
      "The patient's home shows their doctor's next meeting, and the panel shows the next meeting and check-in.",
      "Patients can ask for a meeting from the chat with “Request a meeting”.",
      "“Join meeting” switches on by itself 10 minutes before the start, without reloading.",
      "Your inbox shows a “Check-in due” badge when a patient is due to come back.",
      "Settings → Meetings: switch on or off marking meetings complete automatically 15 minutes after they start.",
    ],
    changed: [
      "Blocking a patient now only stops them messaging you. They can still read their history and talk to their other doctors.",
      "Master medicines is one list shared by all doctors. Add any medicine that's missing; changes and merges are made by CareConnect.",
      "The privacy notice and terms now speak about “your doctor” and say who else can see a conversation.",
      "Printed prescriptions leave out the registration number line until it's set.",
      "The panel beside your chat is now a summary of the patient: their details, their latest prescription and their latest reports. Every action opens a popup instead of changing the panel.",
      "On a phone the patient panel opens as a sheet from the chat header.",
      "“Join meeting” only opens 10 minutes before the meeting starts.",
      "The meeting and check-in card is one card, so both read the same way wherever they appear.",
    ],
    fixed: [
      "Inviting a patient who already has an account no longer changes their name.",
      "Closing a prescription popup no longer loses your draft. Open “New prescription” again and pick up where you left off.",
      "Your prescriptions can always be filtered by the doctor who issued them, even if that doctor is no longer in your chats.",
      "Scheduling a meeting that clashes with another of your meetings warns you, but still lets you go ahead.",
    ],
  },
  {
    version: "0.6.0",
    date: "2026-10-21",
    title: "Patient details, blocking and master medicines",
    added: [
      "Collapse the side menu, and hide the patient details, to give the chat more room.",
      "Edit a patient's name, email and mobile, and record date of birth (age shown), height and weight.",
      "Block a patient, or activate them again. Their history stays on record.",
      "Master medicines in Settings: add, edit, deactivate or merge the medicines you use. Nothing is ever deleted.",
      "Prescriptions suggest from your master medicines and fill in the usual dose. New names can be saved to the list.",
    ],
    fixed: ["Patients who joined with both an email and a mobile number can now sign in with either."],
  },
  {
    version: "0.5.1",
    date: "2026-10-21",
    title: "Privacy notice and terms",
    added: ["A plain-language privacy notice and terms of use, linked from sign-in, joining and Profile."],
  },
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
