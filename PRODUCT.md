# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Patients** of a solo general physician, mixed ages: young adults through elderly, many not confident with technology. They use their own phone, often in short moments between other things, sometimes unwell or anxious. Their jobs: ask the doctor a question, send a report or photo, and find and follow their prescriptions.
- **The doctor**: one general physician working mostly at a desk. They read and reply to patient messages, review reports, write and issue prescriptions, and invite patients. They need to get through the inbox quickly and stay organised.
- Patients exist only by invitation from the doctor. The schema allows more doctors later; today there is one.

## Product Purpose

Private messaging between a doctor and their patients, with reports and prescriptions filed alongside the conversation. The aim is that it feels like messaging a familiar doctor, not using a medical application. For patients it should be reassuring and obvious; for the doctor, fast and organised.

Success: patients get answers and clear prescriptions without phoning or visiting, and the doctor handles patient contact in one work place rather than on their personal phone.

## Positioning

The alternative is the patient messaging the doctor on WhatsApp. CareConnect differs in three ways:

- **The doctor's boundaries.** The doctor's personal number stays private, and patient messages arrive in a work inbox.
- **Organised history.** There is one ongoing conversation per patient, with that patient's reports and prescriptions filed beside it.
- **Structured prescriptions.** Prescriptions are proper documents with dose schedules. They lock once issued and can be printed. A correction is issued as a new version, and both versions stay on record.

## Operating Context

- **Patients** are on phone browsers (designed for 390px wide). They take photos of reports or pick PDFs and photos to send. They read prescriptions at home, often when taking medicine.
- **The doctor** is on a desktop browser (designed for 1440px wide) with a three-column inbox: conversation list, chat, and the patient panel. They sometimes use a phone.
- **Sign-in** is email and password. The only email the app sends is the patient invite.
- **Files** are private and shown through short-lived links.
- **Prescriptions** print, or save as PDF, from a dedicated print page.

## Capabilities and Constraints

- **Features:** live chat with "Seen" status, an offline queue and search; report attachments (PDF, JPG, PNG, WEBP, HEIC, up to 10 MB); prescription drafts with autosave, review, issue and correction; patient invites with resend; a patient language preference (English, ಕನ್ನಡ, हिन्दी).
- **Terminology:** conversation (never "ticket" or "thread"), report, prescription, draft, issued, replaced, invite pending, active.
- **Stack:** fixed by `CLAUDE.md` (Next.js, Supabase, Tailwind v4, lucide icons, Inter). No UI kits.
- **Out of scope for now:** email delivery tracking, a drug database, and phone sign-in.

## Brand Commitments

- **Fixed identity:** the name **CareConnect**, the heart logo, and the tagline "Better care starts with a conversation." are final.
- **Voice:** plain, warm and short. Say what happened and what to do. Never show error codes. Exact strings are in `docs/SPEC.md`.
- **Translations:** Kannada and Hindi are coming. Layouts must allow longer text and Indic scripts.

## Evidence on Hand

- There is no real doctor name, clinic details, registration number or testimonials yet. Never invent them; use placeholders such as `[REG NO]`.
- The privacy notice at `/privacy` is a placeholder until the clinic has reviewed one.

## Product Principles

1. **Familiar over clinical.** Patients should feel they are messaging their doctor, not filling in a medical system.
2. **Obvious for the least confident patient.** Every patient screen should be usable by an elderly first-time user without help.
3. **The conversation is the hub.** Reports, prescriptions and questions live in or beside the one ongoing chat. There are no separate inboxes.
4. **Records are trustworthy.** An issued prescription is never edited, only replaced, and the history stays visible.
5. **Respect the doctor's time and boundaries.** Their side is built for speed and keeps patient contact out of their personal life.

## Accessibility & Inclusion

- **Patient screens:** body text at least 16px, touch targets at least 44px, and icons always paired with a text label.
- **Status:** never shown by colour alone. Use badge text plus an icon.
- **Contrast:** at least 4.5:1.
- **Older and less tech-confident users** are a primary audience, not an edge case.
- **Indic scripts:** Kannada and Hindi text must fit, so allow for longer strings and taller line heights.
